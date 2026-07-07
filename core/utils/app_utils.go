package utils

import (
	"os"
	"path/filepath"
)

// ConfigFilePath returns the path to a named file under a "config" folder
// next to the running executable (not the process's working directory,
// which can differ depending on how the app was launched), creating that
// directory if it doesn't exist yet.
func ConfigFilePath(name string) (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}

	dir := filepath.Join(filepath.Dir(exe), "config")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return filepath.Join(dir, name), nil
}
