//go:build !windows

package instance

import "fmt"

func findClaudeExecutable() (string, error) {
	return "", fmt.Errorf("launching Claude Desktop is only supported on Windows")
}

func openInFileExplorer(path string) error {
	return fmt.Errorf("opening the file explorer is only supported on Windows")
}

func claudePackageFamilyName() string {
	return ""
}

func defaultInstallDataDir() (string, error) {
	return "", fmt.Errorf("resolving the default Claude Desktop install is only supported on Windows")
}
