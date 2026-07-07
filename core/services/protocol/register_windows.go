//go:build windows

package protocol

import (
	"fmt"
	"os"
	"os/exec"

	"golang.org/x/sys/windows/registry"
)

// progID is the classic "Programmatic Identifier" that links Claude
// Router's advertised Capabilities to the actual command line that
// launches it. It only needs to be unique on this machine.
const progID = `ClaudeRouter.claude`

// This implements the classic "Default Programs" registration scheme —
// the same one apps use to become choosable as a default browser or mail
// client (RegisteredApplications + Capabilities + a ProgID), all under
// HKCU so no administrator elevation is required. Windows' own Default
// Apps settings page only lists candidates registered this way.
const (
	progIDKeyPath              = `Software\Classes\` + progID
	capabilitiesKeyPath        = `Software\ClaudeRouter\Capabilities`
	registeredApplicationsPath = `Software\RegisteredApplications`
	registeredApplicationsName = "Claude Router"
)

func register() error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	progIDKey, _, err := registry.CreateKey(registry.CURRENT_USER, progIDKeyPath, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer progIDKey.Close()
	if err := progIDKey.SetStringValue("", "URL:Claude Protocol"); err != nil {
		return err
	}
	if err := progIDKey.SetStringValue("URL Protocol", ""); err != nil {
		return err
	}

	commandKey, _, err := registry.CreateKey(registry.CURRENT_USER, progIDKeyPath+`\shell\open\command`, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer commandKey.Close()
	if err := commandKey.SetStringValue("", fmt.Sprintf(`"%s" "%%1"`, exePath)); err != nil {
		return err
	}

	capabilitiesKey, _, err := registry.CreateKey(registry.CURRENT_USER, capabilitiesKeyPath, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer capabilitiesKey.Close()
	if err := capabilitiesKey.SetStringValue("ApplicationName", "Claude Router"); err != nil {
		return err
	}
	if err := capabilitiesKey.SetStringValue("ApplicationDescription", "Routes claude:// redirects to the right Claude Desktop instance"); err != nil {
		return err
	}

	urlAssociationsKey, _, err := registry.CreateKey(registry.CURRENT_USER, capabilitiesKeyPath+`\UrlAssociations`, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer urlAssociationsKey.Close()
	if err := urlAssociationsKey.SetStringValue("claude", progID); err != nil {
		return err
	}

	registeredAppsKey, _, err := registry.CreateKey(registry.CURRENT_USER, registeredApplicationsPath, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer registeredAppsKey.Close()
	return registeredAppsKey.SetStringValue(registeredApplicationsName, capabilitiesKeyPath)
}

// openDefaultAppsSettings opens Windows' own Default Apps settings page.
func openDefaultAppsSettings() error {
	return exec.Command("explorer.exe", "ms-settings:defaultapps").Start()
}
