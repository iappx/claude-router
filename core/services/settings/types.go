package settings

// Settings holds user-configurable application preferences.
type Settings struct {
	// InstancesRootDir is the folder under which new instance profile
	// directories are created. Empty means "use the default".
	InstancesRootDir string `json:"instancesRootDir"`
	// AutoSelectTimeoutSeconds is how long the protocol router picker waits
	// for the user to choose a target before routing to the default install
	// automatically. Clamped to [5, 30]; 0 means "not yet set".
	AutoSelectTimeoutSeconds int `json:"autoSelectTimeoutSeconds"`
}

// SettingsView is what the frontend receives: the effective (already
// defaulted) settings plus derived, read-only information.
type SettingsView struct {
	InstancesRootDir string `json:"instancesRootDir"`
	// IsOnSystemDrive reports whether InstancesRootDir lives on the same
	// drive as Windows itself — a non-system drive (removable, network,
	// cloud-synced) can be unavailable at launch time or behave oddly with
	// Chromium's profile locking.
	IsOnSystemDrive          bool `json:"isOnSystemDrive"`
	AutoSelectTimeoutSeconds int  `json:"autoSelectTimeoutSeconds"`
}
