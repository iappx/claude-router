package tray

import (
	"log"

	"claude_router/core/services/instance"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

// Setup wires up the system tray icon for mainWindow:
//   - left-click shows and focuses the main window
//   - right-click opens a menu listing every configured instance (click one
//     to launch it), followed by an Exit item
//   - closing the main window minimizes it to the tray instead of quitting
//
// icon is the raw PNG/ICO bytes to use as the tray icon.
func Setup(app *application.App, mainWindow *application.WebviewWindow, icon []byte) {
	mainWindow.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		e.Cancel()
		mainWindow.Hide()
	})

	systemTray := app.SystemTray.New()
	systemTray.SetLabel("Claude Router")
	systemTray.SetTooltip("Claude Router")
	systemTray.SetIcon(icon)

	systemTray.OnClick(func() {
		mainWindow.Show()
		mainWindow.Focus()
	})

	// SystemTray.OpenMenu() only works once a menu has been attached via
	// SetMenu() before Run() — it's what flips the tray's internal "has a
	// menu" flag. The actual displayed content is rebuilt fresh on every
	// right-click below so it always reflects the current instance list.
	systemTray.SetMenu(buildMenu(app))

	systemTray.OnRightClick(func() {
		systemTray.SetMenu(buildMenu(app))
		systemTray.OpenMenu()
	})

	systemTray.Run()
}

// buildMenu is rebuilt on every right-click so the instance list always
// reflects the current instances.json instead of a stale snapshot taken at
// startup.
func buildMenu(app *application.App) *application.Menu {
	menu := app.NewMenu()

	instances, err := (&instance.InstanceService{}).List()
	if err != nil {
		log.Printf("tray: failed to list instances: %v", err)
	}

	if len(instances) == 0 {
		menu.Add("Нет инстансов").SetEnabled(false)
	} else {
		for _, inst := range instances {
			inst := inst
			menu.Add(inst.Name).OnClick(func(ctx *application.Context) {
				if err := (&instance.InstanceService{}).Launch(inst.Path); err != nil {
					log.Printf("tray: failed to launch instance %q: %v", inst.Name, err)
				}
			})
		}
	}

	menu.AddSeparator()
	menu.Add("Выход").OnClick(func(ctx *application.Context) {
		app.Quit()
	})

	return menu
}
