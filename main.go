package main

import (
	"embed"
	_ "embed"
	"log"
	"os"

	"claude_router/core/services/instance"
	"claude_router/core/services/protocol"
	"claude_router/core/services/router"
	"claude_router/core/services/settings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// Wails uses Go's `embed` package to embed the frontend files into the binary.
// Any files in the frontend/dist folder will be embedded into the binary and
// made available to the frontend.
// See https://pkg.go.dev/embed for more information.

//go:embed all:frontend/dist
var assets embed.FS

// mainWindowName lets a second app launch (see SingleInstance below) find
// and refocus the already-open window instead of starting a new process.
const mainWindowName = "main"

func init() {
	application.RegisterEvent[instance.MoveProgress](instance.MoveProgressEvent)
	application.RegisterEvent[instance.MoveConflict](instance.MoveConflictEvent)
	application.RegisterEvent[string](router.URLReceivedEvent)
}

func main() {
	// Advertise Claude Router as a claude:// candidate on every startup —
	// Windows still requires the user to explicitly pick it in Default
	// Apps settings before links actually launch it (see
	// protocol.ProtocolService.OpenDefaultAppsSettings).
	protocol.EnsureRegistered()

	routerService := &router.RouterService{}
	routerService.SetPendingURL(router.FindURLArg(os.Args[1:]))

	app := application.New(application.Options{
		Name:        "Claude Router",
		Description: "Manage isolated Claude Desktop instances",
		Services: []application.Service{
			application.NewService(&instance.InstanceService{}),
			application.NewService(&settings.SettingsService{}),
			application.NewService(&protocol.ProtocolService{}),
			application.NewService(routerService),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
		// A claude:// link always launches a new claude-router.exe process.
		// Without this, that would open a second Dashboard window; instead
		// the new launch's URL is forwarded to the already-running instance
		// and this process exits immediately.
		SingleInstance: &application.SingleInstanceOptions{
			UniqueID: "claude-router",
			OnSecondInstanceLaunch: func(data application.SecondInstanceData) {
				url := router.FindURLArg(data.Args)
				if url == "" {
					return
				}

				routerService.SetPendingURL(url)
				application.Get().Event.Emit(router.URLReceivedEvent, url)

				if win, ok := application.Get().Window.GetByName(mainWindowName); ok {
					win.Restore()
					win.Focus()
				}
			},
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Name:  mainWindowName,
		Title: "Claude Router",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(24, 20, 18),
		URL:              "/",
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
