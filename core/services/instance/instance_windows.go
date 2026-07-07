//go:build windows

package instance

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
)

// findClaudeExecutable locates the installed Claude Desktop executable via
// its AppX package, mirroring the lookup used by manual launch scripts:
//
//	Get-AppxPackage | Where-Object { $_.Name -like '*Claude*' }
func findClaudeExecutable() (string, error) {
	script := `try { $p = Get-AppxPackage | Where-Object { $_.Name -like '*Claude*' } | Select-Object -First 1; if ($p) { Join-Path $p.InstallLocation 'app\claude.exe' } } catch {}`

	cmd := exec.Command("powershell", "-NoProfile", "-Command", script)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	out, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to locate Claude Desktop: %w", err)
	}

	exePath := strings.TrimSpace(string(out))
	if exePath == "" {
		return "", fmt.Errorf("Claude Desktop is not installed")
	}
	if _, err := os.Stat(exePath); err != nil {
		return "", fmt.Errorf("claude.exe not found at %s", exePath)
	}
	return exePath, nil
}

// defaultInstallDataDir resolves the packaged (MSIX/AppX) default Claude
// Desktop install's real profile directory without requiring the process to
// be running, by reusing the same AppX package lookup as
// findClaudeExecutable. Windows virtualizes "%USERPROFILE%\AppData\Roaming\
// Claude" for packaged apps — the data actually lives under the package's
// LocalCache folder instead.
func defaultInstallDataDir() (string, error) {
	userProfile := os.Getenv("USERPROFILE")
	if userProfile == "" {
		return "", fmt.Errorf("USERPROFILE is not set")
	}

	familyName := claudePackageFamilyName()
	if familyName == "" {
		return "", fmt.Errorf("Claude Desktop is not installed")
	}

	return filepath.Join(userProfile, "AppData", "Local", "Packages", familyName, "LocalCache", "Roaming", "Claude"), nil
}

// openInFileExplorer reveals a directory in Windows Explorer.
func openInFileExplorer(path string) error {
	return exec.Command("explorer", path).Start()
}

var (
	claudePackageFamilyNameOnce  sync.Once
	claudePackageFamilyNameValue string
)

// claudePackageFamilyName returns the installed Claude Desktop AppX
// package's family name (e.g. "Claude_pzs8sxrjxfjjc"), or "" if it can't be
// determined. Resolved once and cached — it can't change while the app runs.
func claudePackageFamilyName() string {
	claudePackageFamilyNameOnce.Do(func() {
		script := `try { (Get-AppxPackage | Where-Object { $_.Name -like '*Claude*' } | Select-Object -First 1).PackageFamilyName } catch {}`

		cmd := exec.Command("powershell", "-NoProfile", "-Command", script)
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

		if out, err := cmd.Output(); err == nil {
			claudePackageFamilyNameValue = strings.TrimSpace(string(out))
		}
	})
	return claudePackageFamilyNameValue
}
