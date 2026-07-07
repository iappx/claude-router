package router

// URLReceivedEvent is the name of the Wails event emitted when a claude://
// URL is forwarded from a second app launch to the already-running
// instance (see main.go's SingleInstance.OnSecondInstanceLaunch). The
// frontend listens for it to update the picker screen if it's already open.
const URLReceivedEvent = "router:url-received"
