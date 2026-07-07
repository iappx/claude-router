package instance

// Instance describes a single isolated Claude Desktop instance definition.
// Path is the absolute profile directory pinned at creation/registration
// time — it is never recomputed from the current settings, so renaming the
// global instances root later doesn't strand existing instances.
type Instance struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	ProfileDir string `json:"profileDir"`
	Path       string `json:"path"`
	CreatedAt  string `json:"createdAt"`
}

// RunningInstance is a live claude.exe process matched to its profile
// directory, discovered by inspecting --user-data-dir on its command line.
type RunningInstance struct {
	ProfileDir string `json:"profileDir"`
	Path       string `json:"path"`
	// IsDefault marks the packaged (MSIX/AppX) default Claude Desktop
	// install — the one launched normally from the Start Menu, not by
	// Claude Router. It behaves specially: process matching for it is
	// unreliable (see claudeProcessesByProfileDir), so moving its data
	// requires stopping every claude.exe process, not just this one.
	IsDefault bool `json:"isDefault"`
}

// MoveProgressEvent is the name of the Wails event emitted while
// MoveProfileDir is copying data across drives.
const MoveProgressEvent = "instance:move-progress"

// MoveProgress reports how much of a cross-drive move has completed.
type MoveProgress struct {
	ProfileDir string `json:"profileDir"`
	// CurrentFile is the path (relative to the profile folder) of the file
	// currently being copied, or "" when the move hasn't started copying
	// yet (e.g. still stopping processes) or used the instant same-drive
	// rename fast path.
	CurrentFile string `json:"currentFile"`
	BytesDone   int64  `json:"bytesDone"`
	BytesTotal  int64  `json:"bytesTotal"`
}

// DefaultInstance describes the packaged (MSIX/AppX) default Claude Desktop
// install, resolved statically from the installed package — unlike
// RunningInstance, it doesn't require the process to be currently running,
// so it can be offered as a routing target even when Claude isn't open.
type DefaultInstance struct {
	ProfileDir string `json:"profileDir"`
	Path       string `json:"path"`
}

// MoveConflictEvent is the name of the Wails event emitted when a file
// can't be copied (e.g. it's locked by another process) and the frontend
// must decide whether to skip it or abort the whole move.
const MoveConflictEvent = "instance:move-conflict"

// MoveConflict describes a file that failed to copy during a move.
type MoveConflict struct {
	ProfileDir string `json:"profileDir"`
	File       string `json:"file"`
	Reason     string `json:"reason"`
}
