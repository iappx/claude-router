package settings

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"

	"claude_router/core/utils"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// SettingsService persists user-configurable application preferences, such
// as the folder under which instance profile directories are created.
type SettingsService struct{}

func configPath() (string, error) {
	return utils.ConfigFilePath("app.json")
}

const (
	minAutoSelectTimeoutSeconds     = 5
	maxAutoSelectTimeoutSeconds     = 30
	defaultAutoSelectTimeoutSeconds = 10
)

// clampAutoSelectTimeoutSeconds keeps the protocol router's auto-select
// timeout within its supported range, defaulting an unset (zero) value
// instead of clamping it up to the minimum.
func clampAutoSelectTimeoutSeconds(seconds int) int {
	switch {
	case seconds == 0:
		return defaultAutoSelectTimeoutSeconds
	case seconds < minAutoSelectTimeoutSeconds:
		return minAutoSelectTimeoutSeconds
	case seconds > maxAutoSelectTimeoutSeconds:
		return maxAutoSelectTimeoutSeconds
	default:
		return seconds
	}
}

// defaultInstancesRootDir mirrors the layout used by manually created Claude
// Desktop launch shortcuts: profile folders live directly under the current
// user's roaming AppData folder.
func defaultInstancesRootDir() (string, error) {
	return os.UserConfigDir()
}

func load() (Settings, error) {
	path, err := configPath()
	if err != nil {
		return Settings{}, err
	}

	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return Settings{}, nil
	}
	if err != nil {
		return Settings{}, err
	}

	var s Settings
	if err := json.Unmarshal(data, &s); err != nil {
		return Settings{}, err
	}
	return s, nil
}

// ResolveInstancesRootDir returns the currently configured instances root
// directory, falling back to the default when unset. Other packages (e.g.
// the instance service) call this to resolve where a profile folder lives.
func ResolveInstancesRootDir() (string, error) {
	s, err := load()
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(s.InstancesRootDir) != "" {
		return s.InstancesRootDir, nil
	}
	return defaultInstancesRootDir()
}

// Get returns the effective settings plus derived, read-only information.
func (s *SettingsService) Get() (SettingsView, error) {
	log.Printf("SettingsService.Get")

	rootDir, err := ResolveInstancesRootDir()
	if err != nil {
		return SettingsView{}, err
	}

	current, err := load()
	if err != nil {
		return SettingsView{}, err
	}

	return SettingsView{
		InstancesRootDir:         rootDir,
		IsOnSystemDrive:          isOnSystemDrive(rootDir),
		AutoSelectTimeoutSeconds: clampAutoSelectTimeoutSeconds(current.AutoSelectTimeoutSeconds),
	}, nil
}

// Save persists the given settings.
func (s *SettingsService) Save(settings Settings) error {
	log.Printf("SettingsService.Save: %+v", settings)

	settings.AutoSelectTimeoutSeconds = clampAutoSelectTimeoutSeconds(settings.AutoSelectTimeoutSeconds)

	path, err := configPath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0o644)
}

// PickInstancesRootDir opens a native folder picker and returns the chosen
// path, or an empty string if the user cancelled.
func (s *SettingsService) PickInstancesRootDir() (string, error) {
	log.Printf("SettingsService.PickInstancesRootDir")

	dir, err := application.Get().Dialog.OpenFile().
		SetTitle("Choose instances folder").
		CanChooseFiles(false).
		CanChooseDirectories(true).
		CanCreateDirectories(true).
		PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return dir, nil
}

func isOnSystemDrive(path string) bool {
	systemDrive := os.Getenv("SystemDrive")
	if systemDrive == "" || path == "" {
		return true
	}
	return strings.EqualFold(filepath.VolumeName(path), systemDrive)
}
