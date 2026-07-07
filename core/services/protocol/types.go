package protocol

// RegistrationStatus reports whether Claude Router is currently registered
// as the system handler for the claude:// protocol.
type RegistrationStatus struct {
	Registered bool `json:"registered"`
}
