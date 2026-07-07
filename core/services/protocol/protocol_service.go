package protocol

import "log"

// EnsureRegistered advertises Claude Router as a claude:// candidate via
// the classic RegisteredApplications/Capabilities scheme, so it shows up
// in Windows' own Default Apps settings page. Called unconditionally on
// every Claude Router startup (main.go) — Windows still requires the user
// to explicitly pick it there before links actually launch Claude Router
// instead of Claude Desktop (see ProtocolService.OpenDefaultAppsSettings).
func EnsureRegistered() {
	if err := register(); err != nil {
		log.Printf("protocol.EnsureRegistered: %v", err)
	}
}

// ProtocolService exposes the one user-facing protocol action: opening
// Windows' Default Apps settings so the user can pick Claude Router.
// Registration itself is automatic (EnsureRegistered) and not
// user-toggled — Claude Desktop is a packaged (MSIX) app that declares its
// own claude:// protocol extension, so being a registered candidate isn't
// enough by itself; Windows requires the explicit choice made through
// that settings page.
type ProtocolService struct{}

// OpenDefaultAppsSettings opens Windows' own Default Apps settings page.
func (s *ProtocolService) OpenDefaultAppsSettings() error {
	log.Printf("ProtocolService.OpenDefaultAppsSettings")
	return openDefaultAppsSettings()
}
