# Cod3x Code v4.0 - Portable Mode Documentation

Developed by [CodexHaven](https://github.com/codexhaven)

## Overview

Cod3x Code now supports **fully portable operation** - run from a USB drive on any Windows, Linux, or macOS computer without leaving any files on the host system. All data, configuration, logs, and dependencies stay inside a `./data/` folder relative to the executable.

## Quick Start

### Download and Run (End Users)

1. **Download** the latest `cod3x-portable-v4.0.zip` from the [releases page](https://github.com/codexhaven/cod3x-code/releases)
2. **Extract** the ZIP file to any location (USB drive, Desktop, Documents, etc.)
3. **Run**:
   - **Windows**: Double-click `launchers/START.bat`
   - **Linux/macOS**: Open terminal, run `bash launchers/start.sh`
4. On first run, Node.js will be auto-downloaded (no manual installation needed)
5. An interactive menu will appear - select your desired mode

### Switching Computers

Just **copy the entire folder** to a new computer. All your data travels with it:

- `data/config/` - AI provider settings and `.cod3xrc`
- `data/memory/` - Chat history, sessions, conversation memory
- `data/logs/` - Activity logs, permission logs, proxy logs
- `data/tmp/` - Temporary files
- `data/ollama/` - Downloaded local AI models (if using offline mode)

**Nothing is written to the host computer.** No registry entries, no `~/.cod3xrc`, no `~/.cod3x/` directory.

## Features

### Interactive Menu
The launcher presents a menu with these options:

1. **Normal Mode** (default) - Asks for confirmation before destructive operations (write files, execute bash, delete files)
2. **Limitless Mode** - Auto-executes all tool calls without confirmation (use with caution)
3. **Web Dashboard** - Starts the web UI at `http://localhost:9000` and opens it in your browser
4. **Change Provider** - Interactive wizard to switch between AI providers
5. **Setup Offline** - Configure Ollama local models for offline use
6. **Resume Session** - Resume a previous chat session by ID

The menu auto-selects option 1 (Normal Mode) after 10 seconds.

### Portable Mode Safety

When running in portable mode, the following **dangerous tools always require explicit approval**, even in Limitless Mode:

- `bash` - Execute shell commands
- `write_file` - Write/create files
- `edit_file` - Modify existing files
- `remove_file` - Delete files

This prevents accidental damage when running from untrusted machines.

### AI Provider Support

The built-in provider wizard (`tools/change-provider.js`) supports:

1. **NVIDIA NIM** - GPU-accelerated inference
2. **Anthropic Claude** - Claude Sonnet, Opus, Haiku
3. **OpenAI** - GPT-4o, GPT-4, GPT-3.5
4. **OpenRouter** - Access 200+ models
5. **Google Gemini** - Gemini Pro, Flash
6. **Ollama (Offline)** - Run models locally (no internet required)
7. **LM Studio** - Local model server
8. **Custom API** - Any OpenAI-compatible endpoint

### Ollama Speed Proxy

For local/offline mode, a speed proxy (`tools/local-proxy.js`) is included that:
- Listens on `localhost:11435`
- Forwards to Ollama on `localhost:11434`
- Automatically trims oversized system prompts (from ~10,000 tokens to ~300 tokens)
- Reduces first-token latency from 60-120 seconds to 5-20 seconds on CPU
- Logs activity silently to `data/logs/proxy.log`

### Session Management

Sessions are saved to `data/memory/conversations/<session-id>/session.json` and can be resumed across different computers by copying the `data/` folder.

## Building from Source

To create a portable distribution from source:

```bash
# Clone the repository
git clone https://github.com/codexhaven/cod3x-code.git
cd cod3x-code

# Install dependencies
npm install

# Build the portable distribution
npm run build:portable
```

This creates:
- `cod3x-portable-v4.0/` - The release folder
- `cod3x-portable-v4.0.zip` - Ready-to-distribute ZIP file

### Building Single Binary (Optional)

You can also create a single executable using `pkg`:

```bash
# Install pkg globally if not already installed
npm install -g pkg

# Build for all platforms
npm run package:all

# Or individually:
npm run package:win    # Windows x64
npm run package:linux  # Linux x64
npm run package:mac    # macOS ARM64
```

Binaries will be created in the `bin/` directory.

## File Structure

```
cod3x-code/
├── launchers/                 # Entry point scripts (committed to git)
│   ├── START.bat              # Windows launcher
│   ├── start.sh               # Linux/macOS launcher
│   ├── RESUME.bat             # Windows session resume shortcut
│   └── resume.sh              # Linux/macOS session resume shortcut
├── tools/                     # Utility scripts (committed to git)
│   ├── change-provider.js     # Interactive AI provider switcher
│   ├── local-proxy.js         # Ollama speed optimization proxy
│   ├── setup-local-models.bat # Windows offline model setup
│   └── setup-local-models.sh  # Linux/macOS offline model setup
├── data/                      # Runtime data (gitignored, created at runtime)
│   ├── config/                # Configuration files (.cod3xrc, ai_settings.env)
│   ├── memory/                # Chat history, sessions, conversation memory
│   ├── logs/                  # Activity logs
│   ├── tmp/                   # Temporary files
│   └── ollama/                # Local model storage (optional)
├── engine/                    # Runtime engine (gitignored, populated at runtime)
│   ├── node-<platform>-<arch>/# Bundled Node.js runtime
│   └── node_modules/          # Installed dependencies
├── src/                       # Source code (existing)
├── dist/                      # Compiled output (existing)
├── server.mjs                 # Web dashboard server
├── index.html                 # Dashboard UI
└── PORTABLE.md               # This file
```

## Environment Variables

The launcher scripts automatically set these environment variables:

| Variable | Purpose |
|----------|---------|
| `XDG_CONFIG_HOME` | Redirects to `./data/config` |
| `XDG_DATA_HOME` | Redirects to `./data` |
| `COD3X_HOME` | Base data directory (`./data`) |
| `HOME` | Prevents `~` expansion to host home |
| `USERPROFILE` | Windows home directory override |
| `TMP` / `TEMP` / `TMPDIR` | Temp directory (`./data/tmp`) |
| `NPM_CONFIG_CACHE` | npm cache (`./data/npm-cache`) |
| `NPM_CONFIG_PREFIX` | npm prefix (`./engine`) |
| `COD3X_PORTABLE_ROOT` | Marks portable mode, points to root directory |
| `COD3X_LIMITLESS` | When `1`, auto-approves tool executions |
| `COD3X_PORTABLE_TOKEN` | Optional API token for web dashboard auth |

## Technical Details

### How Portable Mode is Detected

Portable mode is detected automatically by checking:

1. If `process.env.COD3X_PORTABLE_ROOT` is set (set by launcher scripts)
2. If a `data/` directory exists as a sibling to the executable
3. If running from the project root with a `data/` directory present

If none of these conditions are met, Cod3x falls back to **standard mode** using the host's home directory (`~/.cod3xrc`, `~/.cod3x/`).

### Zero-Footprint Guarantee

When running in portable mode:

- **No files in home directory**: `~/.cod3xrc` and `~/.cod3x/` are never created
- **No registry entries**: On Windows, no registry modifications are made
- **No global npm installs**: All dependencies are installed to `./engine/node_modules/`
- **No system temp files**: All temporary files go to `./data/tmp/`
- **No browser profile leaks**: If using browser tools, profiles are created in `./data/tmp/`

### Web Server Security

The web dashboard (`server.mjs`) has been hardened:

- **Localhost-only binding**: Defaults to `127.0.0.1` (not `0.0.0.0`)
- **Optional token auth**: Set `COD3X_PORTABLE_TOKEN` to require `X-Cod3x-Token` header
- **Session cleanup**: Automatically removes old sessions when count exceeds 100
- **Health check**: `GET /api/health` works even if backend failed to initialize
- **Graceful error handling**: Server starts even if `index.html` is missing (serves fallback UI)

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Node.js not found" | First run on fresh system | Run launcher again - it will auto-download |
| "npm install failed" | No internet connection on first run | Connect to internet for first run only |
| "Port 9000 in use" | Another service using port | Change port: `node server.mjs 9001` |
| "Slow Ollama responses" | Model too large for hardware | Use smaller model (e.g., `gemma3:1b`) or enable speed proxy |
| "Permission denied" | Linux/macOS script not executable | Run: `chmod +x launchers/*.sh tools/*.sh` |
| "No LLM providers available" | No API keys configured | Run option 4 (Change Provider) from menu |
| "Session not found" | Invalid session ID | Run with `--session` flag or use resume option |

## Platform-Specific Notes

### Windows
- No prerequisites required
- Uses PowerShell or curl for downloading Node.js
- Creates `.bat` shortcut files in `launchers/`

### Linux
- Requires `curl` or `wget` (pre-installed on most distributions)
- May need `chmod +x` on shell scripts
- Tested on Ubuntu 20.04+, Debian 11+, Fedora 35+

### macOS
- Requires `curl` (pre-installed)
- Supports both Intel (x64) and Apple Silicon (arm64)
- May need to allow terminal apps in System Preferences > Security

### Termux (Android)
- Portable mode works but may need manual Node.js setup
- Use `pkg install nodejs` before running
- Ollama not available on Android

## Requirements

- **Windows**: Windows 10/11 (no prerequisites)
- **Linux**: Kernel 4.19+, `curl` or `wget`
- **macOS**: macOS 11+ (Big Sur or later)
- **Storage**: ~500MB for Node.js + dependencies, plus model sizes for offline use
- **RAM**: 4GB minimum, 8GB+ recommended for local models

## Security Considerations

When running from untrusted/public computers:

1. **Always use Normal Mode** (option 1) - it asks before destructive operations
2. **Never use Limitless Mode** on public machines
3. **Set a portable token** for the web dashboard if using it on shared networks
4. **Delete `data/`** before giving the USB drive to someone else (or use encrypted USB)
5. **API keys are stored in plaintext** in `data/config/ai_settings.env` - protect this file

## Migration from Standard Install

If you have an existing standard installation and want to migrate to portable mode:

```bash
# Backup existing data
cp ~/.cod3xrc ./data/config/
cp -r ~/.cod3x/* ./data/

# If using custom .env
cp ~/.cod3x/ai_settings.env ./data/config/
```

## Contributing

To contribute to the portable mode:

1. Make changes to launcher scripts in `launchers/`
2. Test on all three platforms (Windows, Linux, macOS)
3. Ensure `data/` and `engine/` remain in `.gitignore`
4. Update this documentation if behavior changes

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Developed by CodexHaven** | [GitHub](https://github.com/codexhaven) | [Website](https://github.com/codexhaven/cod3x-code)
