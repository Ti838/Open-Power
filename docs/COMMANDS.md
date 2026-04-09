# Open Power Command Reference

This document lists the main in-app shortcuts, command palette actions, and terminal commands for Open Power.

## 1. In-App Keyboard Shortcuts

| Shortcut | Where | Action |
|---|---|---|
| `Ctrl + K` / `Cmd + K` | Chat workspace | Open / close the command palette |
| `Esc` | Command palette | Close the command palette |
| `↑` / `↓` | Command palette | Move selection up / down |
| `Enter` | Command palette | Run selected command |
| `Enter` | Chat input | Send message |
| `Shift + Enter` | Chat input | New line without sending |
| `Ctrl + Shift + V` | Chat input (desktop) | Push-to-talk voice typing |
| `Arrow Left` / `Arrow Right` | Assistant race response navigator | Browse alternative race responses |

## 2. Mobile / Touch Controls

| Control | Where | Action |
|---|---|---|
| Hold mic button | Chat input (mobile) | Start voice typing |
| Release mic button | Chat input (mobile) | Stop voice typing |
| Tap suggestion chip | Chat input | Insert a quick prompt |

## 3. Command Palette Actions

The command palette contains these actions:

| Action | What it does |
|---|---|
| New Chat | Create a fresh conversation |
| Focus Input | Move cursor to the message box |
| Open Settings | Open the settings modal |
| Switch to Standard | Disable race / consortium mode |
| Switch to Speed Race | Enable ULTRAPLINIAN race mode |
| Switch to Multi-Model | Enable CONSORTIUM synthesis mode |
| Toggle HUD | Show or hide the performance HUD |

## 4. Web UI Controls

| Control | Where | Action |
|---|---|---|
| Theme selector | Settings → Appearance | Switch app theme (including Light mode) |
| Language selector | Settings → Appearance | Switch English / Bengali UI |
| Model selector | Sidebar / Welcome screen | Change the default model |
| Quick prompt chips | Composer | Insert a starter prompt |
| Mic locale buttons | Composer | Set voice typing locale to Auto / EN / BN |
| Image upload button | Composer | Attach an image to the message |

## 5. Terminal Commands

### 5.1 CLI Core Commands

| Command | Description |
|---|---|
| `openpower config` | Show current CLI config |
| `openpower config --key <key>` | Save your OpenRouter API key locally |
| `openpower config --model <model>` | Save the default model |
| `openpower config --theme <theme>` | Save the terminal theme |
| `openpower theme list` | List available terminal themes |
| `openpower model` | Show the current default model |
| `openpower model <id>` | Set the current default model |
| `openpower chat "message"` | Send a single-model chat request |
| `openpower chat --model <id> "message"` | Send a chat request with a model override |
| `openpower race "message"` | Run a three-model race and compare results |
| `openpower doctor` | Diagnose config and API connectivity |
| `openpower --help` | Show CLI help |

### 5.2 Development Commands

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the Next.js frontend |
| `npm run api:dev` | Start the Express API in watch mode |
| `npm run api` | Start the Express API once |
| `npm link` | Register the CLI globally as `openpower` |
| `npm run build:cli:win` | Build a standalone Windows `.exe` |
| `npm run build:cli:all` | Build CLI binaries for multiple platforms |

### 5.3 Standalone EXE Usage

If you build the CLI executable, the main file is:

- `dist/openpower.exe`

Example usage:

```powershell
.\dist\openpower.exe --help
.\dist\openpower.exe doctor
.\dist\openpower.exe chat "Explain transformers"
```

## 6. Notes

- The desktop push-to-talk shortcut is supported when the browser exposes the Web Speech API.
- In packaged `.exe` mode, CLI config is stored in `%USERPROFILE%\.openpower\config.json`.
- The command palette is intentionally minimal and fast so it behaves like a developer tool, not a generic menu.
