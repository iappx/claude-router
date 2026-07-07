package router

import (
	"log"
	"strings"
	"sync"
)

// RouterService exposes the claude:// URL that triggered this launch, if
// any. Unlike the other services, it holds a small amount of process-
// lifetime state: the pending URL is decided once at startup (from the
// command line) or by a forwarded second-instance launch, and stays until
// the frontend claims it.
type RouterService struct {
	mu  sync.Mutex
	url string
}

// SetPendingURL records the claude:// URL to route, overwriting any
// previous one.
func (s *RouterService) SetPendingURL(url string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.url = url
}

// GetPendingURL returns the currently pending claude:// URL, or "" if none.
func (s *RouterService) GetPendingURL() string {
	log.Printf("RouterService.GetPendingURL")

	s.mu.Lock()
	defer s.mu.Unlock()
	return s.url
}

// ClearPendingURL forgets the pending URL once the frontend has taken it,
// so navigating back to the dashboard doesn't re-show the picker.
func (s *RouterService) ClearPendingURL() {
	log.Printf("RouterService.ClearPendingURL")

	s.mu.Lock()
	defer s.mu.Unlock()
	s.url = ""
}

// FindURLArg returns the first claude:// URL found among command-line
// arguments, or "" if none.
func FindURLArg(args []string) string {
	for _, arg := range args {
		if strings.HasPrefix(arg, "claude://") {
			return arg
		}
	}
	return ""
}
