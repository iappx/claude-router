//go:build !windows

package protocol

import "fmt"

func register() error {
	return fmt.Errorf("protocol registration is only supported on Windows")
}

func openDefaultAppsSettings() error {
	return fmt.Errorf("opening Default Apps settings is only supported on Windows")
}
