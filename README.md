<div align="center">
  <img src="build/appicon.png" alt="Claude Router" width="96" />

  # Claude Router

  **Run multiple isolated Claude Desktop instances side by side — one account each, zero conflicts.**

  [![Release](https://img.shields.io/github/v/release/iappx/claude-router?label=release&sort=semver)](https://github.com/iappx/claude-router/releases/latest)
  [![Build & Release](https://github.com/iappx/claude-router/actions/workflows/release.yml/badge.svg)](https://github.com/iappx/claude-router/actions/workflows/release.yml)
  [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Platform](https://img.shields.io/badge/platform-Windows-informational)](#downloads)
  [![Built with Wails3](https://img.shields.io/badge/built%20with-Wails3-b32a2a)](https://v3alpha.wails.io/)

  [Download](#downloads) · [Features](#features) · [How it works](#how-it-works) · [Development](#development) · [Contributing](#contributing)
</div>

---

> **Windows only, for now.** Claude Router currently ships Windows-only builds. It locates Claude Desktop via `Get-AppxPackage`, which only resolves the **Microsoft Store / MSIX-packaged** install of Claude Desktop — a portable or manually-installed `claude.exe` outside that package won't be found. macOS/Linux are not supported yet.

Claude Desktop only lets you sign in with one account at a time. If you juggle a personal account, a work account, and a couple of client accounts, you're stuck logging in and out all day — or running fragile workarounds.

**Claude Router fixes that.** It launches Claude Desktop with a dedicated `--user-data-dir` per instance, so each one has its own login session, chat history, and settings — running fully isolated, at the same time, right next to each other.

## Features

### 🧩 Isolated instances
Create as many named Claude Desktop instances as you need. Each gets its own profile folder, its own login, its own history — launch them all simultaneously without one instance logging the others out.

### 🔗 `claude://` link router
Claude Router registers itself as a `claude://` protocol handler. Click a Claude link anywhere on your system and a picker pops up asking **which instance** should open it — your registered instances, any instance already running but not yet registered, or the system default install. No answer in time? It auto-routes to the default after a configurable countdown.

### 🗂️ Safe profile management
Move an instance's data folder anywhere — including across drives — without losing a byte. Same-drive moves are instant, atomic renames; cross-drive moves stream with a live progress bar and ask you before skipping any file that's locked or fails to copy.

### 🖥️ Menu bar / system tray
Lives quietly in the tray. Left-click to bring the dashboard back, right-click for a live menu of every configured instance — click one to launch it straight from the tray. Closing the window minimizes it instead of quitting.

### 🔍 Auto-discovery
Already have Claude Desktop instances running that Claude Router doesn't know about? It detects them by inspecting running processes and lets you register them on the spot — nothing is left invisible.

### 🪟 Single-instance aware
Launching a second `claude://` link doesn't spawn a duplicate window — it's forwarded to the already-running Claude Router process, which restores and focuses itself.

## How it works

Claude Router is a thin, native control layer on top of the official Claude Desktop app — it doesn't reimplement or proxy the Claude API, and it never touches your credentials. All it does is:

1. Keep a small `instances.json` registry of instance names → profile directories.
2. Launch `claude.exe`/`Claude` with `--user-data-dir=<profile>`, the same flag Chromium-based apps use for profile isolation — so each instance's cookies, local storage, and session are its own.
3. Watch running Claude processes to know what's live and match `claude://` redirects to the right window.

No account switching. No shared session. No hacks inside Claude itself.

## Downloads

Prebuilt Windows installers for every push to `main` are published automatically via GitHub Actions.

👉 **[Grab the latest release](https://github.com/iappx/claude-router/releases/latest)**

| Platform | Artifact |
|---|---|
| Windows | `claude-router-*-installer.exe` (NSIS installer) |

> Claude Desktop itself must already be installed **from the Microsoft Store** (the packaged MSIX/AppX build) — Claude Router locates and orchestrates that install, it doesn't replace it. A portable/manually-installed `claude.exe` is not detected.

### Setting Claude Router as your `claude://` handler

Windows requires an explicit opt-in before a third-party app can own a protocol that another packaged app (Claude Desktop) already claims. Open **Settings → Apps → Default Apps**, search for `claude://`, and pick Claude Router. The app's own settings panel has a shortcut straight to that page.

## Development

Claude Router is a [Wails3](https://v3alpha.wails.io/) desktop app: a Go backend (`core/`) driving a native webview, with a Vue 3 + TypeScript frontend (`frontend/`).

**Stack:** Go · Wails3 · Vue 3 · TypeScript · Vite · Tailwind CSS · Pinia · tsyringe (DI) · a class-based, event-driven Clean Architecture on the frontend (`domain` → `application` → `infrastructure` → `presentation`).

### Prerequisites

- Go 1.25+
- Node.js 22+
- [Wails3 CLI](https://v3alpha.wails.io/) (`go install github.com/wailsapp/wails/v3/cmd/wails3@latest`)
- Windows (see the [platform note](#claude-router) above)

### Run in dev mode

```bash
wails3 dev -config ./build/config.yml
```

Starts the Vite dev server with hot reload and launches the app shell pointed at it.

### Build a production binary

```bash
wails3 build -config ./build/config.yml     # builds the binary
wails3 package -config ./build/config.yml   # packages the NSIS installer under bin/
```

Frontend-only tasks (`frontend/`):

```bash
npm install
npm run dev     # standalone Vite dev server
npm run build   # type-check + production bundle
```

## Contributing

Issues and pull requests are welcome. Before opening a PR, please read [CLAUDE.md](CLAUDE.md) — it documents this repo's architecture and coding conventions in detail (layering rules, naming, the event-driven store pattern, component style) and every change is expected to follow it.

## License

[MIT](LICENSE) © 2026 iappx

---

<sub>Claude Router is an independent, unofficial tool. "Claude" and "Claude Desktop" are trademarks of Anthropic, PBC. This project is not affiliated with or endorsed by Anthropic.</sub>
