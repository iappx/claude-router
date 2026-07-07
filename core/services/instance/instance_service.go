package instance

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"claude_router/core/utils"

	"github.com/shirou/gopsutil/v3/process"
	"github.com/wailsapp/wails/v3/pkg/application"
)

// InstanceService persists the list of configured Claude Desktop instances
// and launches isolated Claude Desktop processes against per-instance
// profile directories.
//
// Every operation below takes the instance's absolute profile path as given
// by the caller — it never re-derives the path from the current settings.
// The path is decided once, when an instance is created or registered, and
// stays pinned even if the user later changes the global instances folder.
type InstanceService struct{}

func configPath() (string, error) {
	return utils.ConfigFilePath("instances.json")
}

// List returns every configured instance.
func (s *InstanceService) List() ([]Instance, error) {
	log.Printf("InstanceService.List")

	path, err := configPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return []Instance{}, nil
	}
	if err != nil {
		return nil, err
	}

	var instances []Instance
	if err := json.Unmarshal(data, &instances); err != nil {
		return nil, err
	}
	return instances, nil
}

// Save persists the full list of instances, replacing any previous content.
func (s *InstanceService) Save(instances []Instance) error {
	log.Printf("InstanceService.Save: %d instance(s)", len(instances))

	path, err := configPath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(instances, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0o644)
}

// EnsureProfileDir creates an instance's profile directory if it does not
// already exist.
func (s *InstanceService) EnsureProfileDir(path string) error {
	log.Printf("InstanceService.EnsureProfileDir: %s", path)

	if strings.TrimSpace(path) == "" {
		return fmt.Errorf("profile directory path is empty")
	}
	return os.MkdirAll(path, 0o755)
}

// Launch starts an isolated Claude Desktop process using the given absolute
// path as its --user-data-dir.
func (s *InstanceService) Launch(path string) error {
	log.Printf("InstanceService.Launch: %s", path)

	if strings.TrimSpace(path) == "" {
		return fmt.Errorf("profile directory path is empty")
	}
	if err := os.MkdirAll(path, 0o755); err != nil {
		return err
	}

	exePath, err := findClaudeExecutable()
	if err != nil {
		return err
	}

	cmd := exec.Command(exePath, "--user-data-dir="+path)
	return cmd.Start()
}

// DefaultInstance returns the packaged (MSIX/AppX) default Claude Desktop
// install's profile directory, resolved statically so it can be offered as
// a routing target even when the process isn't currently running.
func (s *InstanceService) DefaultInstance() (DefaultInstance, error) {
	log.Printf("InstanceService.DefaultInstance")

	dataDir, err := defaultInstallDataDir()
	if err != nil {
		return DefaultInstance{}, err
	}
	return DefaultInstance{ProfileDir: filepath.Base(dataDir), Path: dataDir}, nil
}

// RouteURL launches Claude Desktop with targetURL as a command-line
// argument, so it hands the redirect off to Claude's own OAuth handling.
// An empty dataDir targets the packaged default install (no
// --user-data-dir); otherwise it targets the isolated instance at dataDir,
// the same way Launch does.
func (s *InstanceService) RouteURL(dataDir string, targetURL string) error {
	log.Printf("InstanceService.RouteURL: dataDir=%s", dataDir)

	if strings.TrimSpace(targetURL) == "" {
		return fmt.Errorf("target URL is empty")
	}

	exePath, err := findClaudeExecutable()
	if err != nil {
		return err
	}

	if strings.TrimSpace(dataDir) == "" {
		return exec.Command(exePath, targetURL).Start()
	}
	return exec.Command(exePath, "--user-data-dir="+dataDir, targetURL).Start()
}

// RunningProfileDirs returns every currently running Claude Desktop process,
// matched to its profile directory. There is no PID to remember across app
// restarts (and a remembered PID can be silently reused by an unrelated
// process anyway), so instead every claude.exe process on the system is
// inspected and matched by its --user-data-dir command-line argument.
func (s *InstanceService) RunningProfileDirs() ([]RunningInstance, error) {
	log.Printf("InstanceService.RunningProfileDirs")

	procs, err := claudeProcessesByProfileDir()
	if err != nil {
		return nil, err
	}

	running := make([]RunningInstance, 0, len(procs))
	for profileDir, matches := range procs {
		if len(matches) == 0 {
			continue
		}
		running = append(running, RunningInstance{ProfileDir: profileDir, Path: matches[0].path, IsDefault: matches[0].isDefault})
	}

	sort.Slice(running, func(i, j int) bool { return running[i].ProfileDir < running[j].ProfileDir })
	return running, nil
}

// Stop terminates every running Claude Desktop process launched for the
// given profile directory (an isolated instance can spawn more than one
// process — main + renderer — all sharing the same --user-data-dir).
func (s *InstanceService) Stop(profileDir string) error {
	log.Printf("InstanceService.Stop: %s", profileDir)

	procs, err := claudeProcessesByProfileDir()
	if err != nil {
		return err
	}

	matches, ok := procs[profileDir]
	if !ok || len(matches) == 0 {
		return fmt.Errorf("no running process found for %s", profileDir)
	}

	for _, m := range matches {
		if err := m.proc.Kill(); err != nil {
			return err
		}
	}
	return nil
}

// OpenProfileDir reveals the given absolute directory in the system file
// explorer, creating it first if it does not exist yet.
func (s *InstanceService) OpenProfileDir(path string) error {
	log.Printf("InstanceService.OpenProfileDir: %s", path)

	if strings.TrimSpace(path) == "" {
		return fmt.Errorf("profile directory path is empty")
	}
	if err := os.MkdirAll(path, 0o755); err != nil {
		return err
	}
	return openInFileExplorer(path)
}

// DeleteProfileDir permanently deletes the given absolute directory and
// everything inside it. Callers are expected to ensure the instance isn't
// running first — deleting files still open in another process is
// unreliable on Windows.
func (s *InstanceService) DeleteProfileDir(path string) error {
	log.Printf("InstanceService.DeleteProfileDir: %s", path)

	if strings.TrimSpace(path) == "" {
		return fmt.Errorf("profile directory path is empty")
	}
	return os.RemoveAll(path)
}

// MoveProfileDir relocates a Claude Router-managed instance's profile
// directory from oldPath to newPath. The instance must not be running —
// moving files still open in another process is unreliable on Windows.
//
// When both paths are on the same drive, this is an instant, atomic
// rename — literally the same MoveFileEx the OS itself uses for a
// same-volume move ("system tools" as requested). Only when the drives
// differ (rename fails with a cross-device error) does it fall back to a
// manual copy-then-delete, reporting progress via the instance:move-progress
// event as it goes.
//
// Returns whether any file had to be skipped (see ResolveMoveConflict) —
// when that happens, oldPath is deliberately left in place instead of being
// deleted, so the skipped data isn't lost.
func (s *InstanceService) MoveProfileDir(profileDir, oldPath, newPath string) (bool, error) {
	log.Printf("InstanceService.MoveProfileDir: %s -> %s", oldPath, newPath)

	if !waitUntilStopped(profileDir, 3*time.Second) {
		return false, fmt.Errorf("stop the instance before moving its data")
	}
	return moveDir(profileDir, oldPath, newPath)
}

// MoveDefaultProfileDir relocates the packaged default Claude Desktop
// install's data. Its processes can't be reliably isolated by profile
// directory (see claudeProcessesByProfileDir), so instead of stopping just
// this one, every claude.exe process on the system is stopped — meaning
// any other running Claude Router instance gets closed too. Callers should
// warn the user about that before calling this. It also waits considerably
// longer than MoveProfileDir for everything to fully quiesce.
func (s *InstanceService) MoveDefaultProfileDir(profileDir, oldPath, newPath string) (bool, error) {
	log.Printf("InstanceService.MoveDefaultProfileDir: %s -> %s", oldPath, newPath)

	if err := stopAllClaudeProcesses(); err != nil {
		return false, err
	}
	if !waitUntilNoClaudeProcesses(10 * time.Second) {
		return false, fmt.Errorf("some Claude processes are still running")
	}
	return moveDir(profileDir, oldPath, newPath)
}

// ResolveMoveConflict answers a pending instance:move-conflict event —
// "skip" leaves that one file/folder behind and continues the move, "abort"
// stops the whole move. No-ops with an error if nothing is pending (e.g. the
// conflict was already resolved or timed out).
func (s *InstanceService) ResolveMoveConflict(action string) error {
	log.Printf("InstanceService.ResolveMoveConflict: %s", action)

	conflictMu.Lock()
	ch := pendingConflict
	pendingConflict = nil
	conflictMu.Unlock()

	if ch == nil {
		return fmt.Errorf("no move conflict is pending")
	}

	switch action {
	case "skip":
		ch <- moveConflictSkip
	case "abort":
		ch <- moveConflictAbort
	default:
		return fmt.Errorf("unknown action: %s", action)
	}
	return nil
}

// moveDir contains the actual relocation logic shared by MoveProfileDir and
// MoveDefaultProfileDir — they only differ in how they ensure nothing is
// still running against oldPath first.
func moveDir(profileDir, oldPath, newPath string) (bool, error) {
	if strings.TrimSpace(oldPath) == "" || strings.TrimSpace(newPath) == "" {
		return false, fmt.Errorf("source and destination paths are required")
	}
	if strings.EqualFold(oldPath, newPath) {
		return false, fmt.Errorf("source and destination are the same")
	}
	if isSubPath(oldPath, newPath) {
		return false, fmt.Errorf("can't move a folder into itself")
	}

	if _, err := os.Stat(newPath); err == nil {
		return false, fmt.Errorf("destination folder already exists: %s", newPath)
	}

	if err := os.MkdirAll(filepath.Dir(newPath), 0o755); err != nil {
		return false, err
	}

	if err := os.Rename(oldPath, newPath); err == nil {
		emitMoveProgress(profileDir, "", 1, 1)
		return false, nil
	}

	hadSkips, err := copyDirWithProgress(profileDir, oldPath, newPath)
	if err != nil {
		os.RemoveAll(newPath)
		return false, err
	}
	if hadSkips {
		// Some files couldn't be copied and were left behind — keep oldPath
		// intact so that data isn't silently lost.
		return true, nil
	}
	return false, os.RemoveAll(oldPath)
}

// stopAllClaudeProcesses terminates every claude.exe process on the system,
// regardless of which profile directory it's tied to.
func stopAllClaudeProcesses() error {
	procs, err := process.Processes()
	if err != nil {
		return err
	}

	var firstErr error
	for _, p := range procs {
		name, err := p.Name()
		if err != nil || !strings.EqualFold(name, "claude.exe") {
			continue
		}
		if err := p.Kill(); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

// waitUntilStopped polls for up to timeout for every claude.exe process
// matching profileDir to disappear. A freshly killed process can briefly
// remain in the system's process table (or hold its file handles a moment
// longer) after Stop's Kill() call returns, so a single immediate check
// right after stopping is prone to false "still running" positives.
func waitUntilStopped(profileDir string, timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	for {
		procs, err := claudeProcessesByProfileDir()
		if err != nil {
			return true // can't tell either way — don't block the move on it.
		}
		if matches, ok := procs[profileDir]; !ok || len(matches) == 0 {
			return true
		}
		if time.Now().After(deadline) {
			return false
		}
		time.Sleep(150 * time.Millisecond)
	}
}

// waitUntilNoClaudeProcesses polls for up to timeout for every claude.exe
// process on the system to disappear (used after stopAllClaudeProcesses).
func waitUntilNoClaudeProcesses(timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	for {
		procs, err := process.Processes()
		if err != nil {
			return true
		}

		anyLeft := false
		for _, p := range procs {
			if name, err := p.Name(); err == nil && strings.EqualFold(name, "claude.exe") {
				anyLeft = true
				break
			}
		}
		if !anyLeft {
			return true
		}
		if time.Now().After(deadline) {
			return false
		}
		time.Sleep(150 * time.Millisecond)
	}
}

func isSubPath(parent, child string) bool {
	rel, err := filepath.Rel(parent, child)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}

func emitMoveProgress(profileDir, currentFile string, done, total int64) {
	application.Get().Event.Emit(MoveProgressEvent, MoveProgress{
		ProfileDir:  profileDir,
		CurrentFile: currentFile,
		BytesDone:   done,
		BytesTotal:  total,
	})
}

// errSkipFile is returned internally when the user chooses to skip a file
// or folder that failed to copy — it's never surfaced to the caller.
var errSkipFile = errors.New("skip file")

type moveConflictResolution int

const (
	moveConflictSkip moveConflictResolution = iota
	moveConflictAbort
)

var (
	conflictMu      sync.Mutex
	pendingConflict chan moveConflictResolution
)

// askUserAboutConflict blocks until the frontend calls ResolveMoveConflict
// (or five minutes pass, in which case it defaults to aborting rather than
// risking data loss by guessing "skip").
func askUserAboutConflict(profileDir, file, reason string) moveConflictResolution {
	ch := make(chan moveConflictResolution, 1)

	conflictMu.Lock()
	pendingConflict = ch
	conflictMu.Unlock()

	application.Get().Event.Emit(MoveConflictEvent, MoveConflict{ProfileDir: profileDir, File: file, Reason: reason})

	select {
	case resolution := <-ch:
		return resolution
	case <-time.After(5 * time.Minute):
		return moveConflictAbort
	}
}

// resolveCopyFailure is called whenever a file/folder can't be copied. It
// asks the user what to do and turns their answer into either errSkipFile
// (caller should continue with the next entry) or a real error (abort).
func resolveCopyFailure(profileDir, relName string, cause error) error {
	if askUserAboutConflict(profileDir, relName, cause.Error()) == moveConflictSkip {
		return errSkipFile
	}
	return fmt.Errorf("failed to copy %s: %w", relName, cause)
}

// copyDirWithProgress copies every file under src to dst, preserving the
// directory structure, and emits instance:move-progress events as bytes are
// written. It walks the tree twice: once to sum total bytes (so progress
// can be reported as a percentage), once to actually copy. Returns whether
// any file/folder was skipped due to a copy failure the user chose to skip
// past (see resolveCopyFailure) — if so, the caller must not delete src, as
// that would destroy the skipped data.
func copyDirWithProgress(profileDir, src, dst string) (bool, error) {
	var total int64
	if err := filepath.WalkDir(src, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() {
			info, err := d.Info()
			if err != nil {
				return err
			}
			total += info.Size()
		}
		return nil
	}); err != nil {
		return false, err
	}

	var done int64
	var hadSkips bool
	lastEmit := time.Now()

	err := filepath.WalkDir(src, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)

		if d.IsDir() {
			if err := os.MkdirAll(target, 0o755); err != nil {
				if resolveCopyFailure(profileDir, rel, err) == errSkipFile {
					hadSkips = true
					return filepath.SkipDir
				}
				return fmt.Errorf("failed to create %s: %w", rel, err)
			}
			return nil
		}

		// Announce the file before copying it so the frontend shows the
		// right name even while a large file is still being read.
		emitMoveProgress(profileDir, rel, done, total)
		if err := copyFileTracked(path, target, profileDir, rel, total, &done, &lastEmit); err != nil {
			if err == errSkipFile {
				hadSkips = true
				return nil
			}
			return err
		}
		return nil
	})
	return hadSkips, err
}

// copyFileTracked copies one file, asking the user via resolveCopyFailure
// on any error — with a single point of failure handling so that a partial
// destination file left behind by a mid-copy error gets cleaned up
// regardless of which step failed.
func copyFileTracked(src, dst, profileDir, relName string, total int64, done *int64, lastEmit *time.Time) error {
	err := copyFileOnce(src, dst, total, done, lastEmit, profileDir, relName)
	if err == nil {
		return nil
	}

	result := resolveCopyFailure(profileDir, relName, err)
	if result == errSkipFile {
		os.Remove(dst) // best-effort — don't leave a truncated file behind.
	}
	return result
}

func copyFileOnce(src, dst string, total int64, done *int64, lastEmit *time.Time, profileDir, relName string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	buf := make([]byte, 1<<20)
	for {
		n, readErr := in.Read(buf)
		if n > 0 {
			if _, err := out.Write(buf[:n]); err != nil {
				return err
			}
			*done += int64(n)
			if time.Since(*lastEmit) > 100*time.Millisecond {
				emitMoveProgress(profileDir, relName, *done, total)
				*lastEmit = time.Now()
			}
		}
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return readErr
		}
	}
	emitMoveProgress(profileDir, relName, *done, total)
	return nil
}

type matchedProcess struct {
	proc      *process.Process
	path      string
	isDefault bool
}

// claudeProcessesByProfileDir groups every running claude.exe process by the
// profile folder name found in its --user-data-dir command-line argument.
//
// gopsutil reads a process's command line via ReadProcessMemory on Windows;
// for a process that's exiting or whose PID has just been reused, that read
// can return stale/garbage memory instead of an error, which is where
// "Prefetch" (Windows' own prefetch cache) has been observed leaking in —
// so it's explicitly rejected. Anything else is trusted: it's better to
// show a real instance than to silently drop it on an overly strict check.
func claudeProcessesByProfileDir() (map[string][]matchedProcess, error) {
	procs, err := process.Processes()
	if err != nil {
		return nil, err
	}

	byProfileDir := make(map[string][]matchedProcess)
	for _, p := range procs {
		name, err := p.Name()
		if err != nil || !strings.EqualFold(name, "claude.exe") {
			continue
		}

		cmdline, err := p.Cmdline()
		if err != nil {
			continue
		}

		dir, ok := extractUserDataDir(cmdline)
		if !ok || isBogusProfileDir(dir) {
			continue
		}
		redirected := redirectDefaultClaudeAppDataDir(dir)
		isDefault := redirected != dir
		dir = redirected

		profileDir := filepath.Base(dir)
		byProfileDir[profileDir] = append(byProfileDir[profileDir], matchedProcess{proc: p, path: dir, isDefault: isDefault})
	}

	return byProfileDir, nil
}

// isBogusProfileDir rejects the one bogus value observed in practice: the
// well-known Windows Prefetch cache leaking in from a corrupted command
// line read (see claudeProcessesByProfileDir).
func isBogusProfileDir(dir string) bool {
	return strings.Contains(strings.ToLower(dir), "prefetch")
}

// redirectDefaultClaudeAppDataDir corrects the one specific path the
// packaged (MSIX/AppX) default Claude Desktop install reports on its
// command line: "<user>\AppData\Roaming\Claude". Windows virtualizes that
// folder for packaged apps — it doesn't physically exist there. The real
// data lives under the package's LocalCache folder instead.
func redirectDefaultClaudeAppDataDir(dir string) string {
	userProfile := os.Getenv("USERPROFILE")
	if userProfile == "" {
		return dir
	}

	virtualRoamingClaude := filepath.Join(userProfile, "AppData", "Roaming", "Claude")
	if !strings.EqualFold(dir, virtualRoamingClaude) {
		return dir
	}

	resolved, err := defaultInstallDataDir()
	if err != nil {
		return dir
	}
	return resolved
}

var winEnvVarPattern = regexp.MustCompile(`%([^%]+)%`)

// expandWindowsEnvVars resolves %VAR%-style references some launchers embed
// literally in a shortcut/registry command line instead of an already
// resolved absolute path.
func expandWindowsEnvVars(path string) string {
	return winEnvVarPattern.ReplaceAllStringFunc(path, func(match string) string {
		if value := os.Getenv(strings.Trim(match, "%")); value != "" {
			return value
		}
		return match
	})
}

// extractUserDataDir pulls the value of a --user-data-dir="..." (or
// unquoted --user-data-dir=...) argument out of a full command line.
func extractUserDataDir(cmdline string) (string, bool) {
	const flag = "--user-data-dir="
	idx := strings.Index(cmdline, flag)
	if idx == -1 {
		return "", false
	}

	rest := cmdline[idx+len(flag):]
	if strings.HasPrefix(rest, `"`) {
		rest = rest[1:]
		if end := strings.Index(rest, `"`); end != -1 {
			return expandWindowsEnvVars(rest[:end]), true
		}
		return expandWindowsEnvVars(rest), true
	}

	if end := strings.Index(rest, " --"); end != -1 {
		return expandWindowsEnvVars(strings.TrimSpace(rest[:end])), true
	}
	return expandWindowsEnvVars(strings.TrimSpace(rest)), true
}
