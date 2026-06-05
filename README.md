# Cod3x Code v4.0

> **The Ultimate Open-Source Claude Code Alternative** — Developed by [CodexHaven](https://github.com/codexhaven)

[![Version](https://img.shields.io/badge/version-4.0.0-00D4AA.svg)](https://github.com/codexhaven/cod3x-code)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/platform-Termux%20%7C%20Linux%20%7C%20Windows%20%7C%20macOS-blue.svg)](#installation)

## Overview

Cod3x Code is a comprehensive, production-ready open-source alternative to proprietary AI coding assistants. Built by **CodexHaven**, it features a React Ink terminal UI, **70+ tools** across **14 categories**, **14 specialized agents**, multi-agent swarm orchestration, Model Context Protocol (MCP) support, web browsing, debug trail tracking, and three-level configuration management — all designed to work seamlessly across **Termux (default), Linux, Windows, and macOS**.

### Key Features

| Feature | Cod3x Code v4.0 | Claude Code |
|---------|----------------|-------------|
| Tools | **70+ across 14 categories** | 40+ |
| Terminal UI | React Ink | React Ink |
| Agents | **14 specialized** | Subagent support |
| Swarm Mode | **Multi-agent orchestration** | Limited |
| MCP Support | Full support | Full support |
| Web Browsing | **Built-in scraping** | External |
| Debug Trail | **Execution tracing** | Basic |
| Open Source | **MIT License** | Proprietary |
| Multi-Provider | **Anthropic, OpenAI, Google, OpenRouter, opencode-free-proxy, Custom** | Anthropic only |
| Platforms | **Termux, Linux, Windows, macOS, Android** | Desktop only |
| Configuration | 3-level hierarchy | 3-level hierarchy |
| File References | @filename | @filename |
| Streaming | Yes | Yes |
| Non-Interactive | Yes (CI/CD) | Yes |
| Web UI | **Built-in server** | No |
| Cost | **Free (via opencode-free-proxy)** | $20-200/month |

## Quick Start

### Installation

#### Termux (Default / Primary Target)

```bash
# Download and run the Termux installer
curl -fsSL https://raw.githubusercontent.com/codexhaven/cod3x-code/main/install/termux.sh | bash

# Or manually:
pkg update && pkg install nodejs git
npm install -g cod3x-code
cod3x init
```

#### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/codexhaven/cod3x-code/main/install/linux.sh | bash
```

#### Windows (PowerShell Admin)

```powershell
irm https://raw.githubusercontent.com/codexhaven/cod3x-code/main/install/windows.ps1 | iex
```

#### macOS

```bash
curl -fsSL https://raw.githubusercontent.com/codexhaven/cod3x-code/main/install/macos.sh | bash
```

### Configuration

Cod3x supports multiple LLM providers with automatic fallback:

**Option 1: OpenCode Free Proxy (Default - Free)**
```bash
# Install opencode-free-proxy for free access to Claude, GPT, Gemini
git clone https://github.com/sionex-code/opencode-proxy-api
cd opencode-proxy-api && pip install -r requirements.txt && python auth_capture_v2.py
```

**Option 2: Direct API Keys**
```bash
# Create .env file in your project directory
echo "ANTHROPIC_API_KEY=your-key" > .env
# OR
echo "OPENROUTER_API_KEY=your-key" > .env
# OR
echo "OPENAI_API_KEY=your-key" > .env
```

**Option 3: Custom OpenAI-compatible endpoint (Ollama, LM Studio, etc.)**
```bash
echo "COD3X_CUSTOM_BASE_URL=http://localhost:11434/v1" >> .env
```

### Usage

```bash
# Start interactive session (default)
cod3x

# Or use the alias
c3

# Execute with swarm agents
cod3x swarm "Refactor the auth module with proper error handling and add tests"

# Run a specific agent
cod3x agent debugger "Fix the login timeout bug"

# Single prompt (CI/CD)
cod3x run "Generate README for this project" --json

# Start web UI server
node server.mjs 9000

# Diagnostics
cod3x doctor
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cod3x Code v4.0                          │
├─────────────────────────────────────────────────────────────┤
│  Entry: src/main.tsx (Commander CLI + Ink React TUI)        │
│  Web: server.mjs (HTTP server + Web UI on localhost:9000)   │
├─────────────┬───────────────┬───────────────────────────────┤
│   Core      │   Agents      │   Tools (70+ across 14 cats)  │
│   ────      │   ──────      │   ─────────────────────────   │
│   app.tsx   │ orchestrator  │ 📁 filesystem (13)            │
│   tool-     │   (14 agents) │ ⚡ execution (3)              │
│   registry  │   swarm       │ 🌿 git (9)                    │
│   non-      │   engine      │ 💻 code (8)                   │
│   interactive│  decomposer  │ 🔍 search (3)                 │
│             │               │ 🌐 network (3)                │
│             │               │ 🗄️ database (2)               │
├─────────────┼───────────────┼───────────────────────────────┤
│   LLM       │   Platform    │   Utilities                   │
│   ────      │   ────────    │   ─────────                   │
│   opencode- │   detector    │   logger, permissions         │
│   proxy     │   (5 OS)      │   file-index, config-loader   │
│   anthropic │               │   memory (SQLite+JSON)        │
│   openai    │               │   mcp-manager                 │
│   openrouter│               │                               │
│   custom    │               │                               │
└─────────────┴───────────────┴───────────────────────────────┘
```

## The 14 Specialized Agents

| Agent | Role | Description |
|-------|------|-------------|
| Code Generator | `code-generator` | Generate production-ready code from specifications |
| Code Reviewer | `code-reviewer` | Review code for quality, security, and best practices |
| Debugger | `debugger` | Debug errors and fix issues with root cause analysis |
| Architect | `architect` | Design system architecture and patterns |
| Tester | `tester` | Generate comprehensive tests and verify coverage |
| Documenter | `documenter` | Generate comprehensive documentation |
| Git Manager | `git-manager` | Manage git workflows and version control |
| Security Auditor | `security-auditor` | Audit code for security vulnerabilities |
| Optimizer | `optimizer` | Optimize code performance and resource usage |
| Web Browser | `browser` | Browse web pages and extract information |
| Swarm Leader | `swarm-leader` | Coordinate multi-agent swarm execution |
| Task Decomposer | `task-decomposer` | Break down complex tasks into subtasks |
| Error Analyst | `error-analyst` | Analyze errors and provide detailed diagnostics |
| Trail Runner | `trail-runner` | Execute and trace code with detailed logging |

## Web Server

Cod3x includes a built-in web server for browser-based access:

```bash
# Start the web server (default port 9000)
node server.mjs

# Custom port
node server.mjs 8080

# Environment variable
COD3X_PORT=8080 node server.mjs
```

The web UI provides:
- Interactive chat interface
- Toggle switches for all 70+ tools and 14 agents
- Tool execution panel with parameter inputs
- Swarm mode with visual task decomposition
- Settings configuration
- Real-time status monitoring

## Tool Categories

### Filesystem (13 tools)
`read_file`, `write_file`, `edit_file`, `list_directory`, `glob_search`, `grep_search`, `find_files`, `copy_file`, `move_file`, `remove_file`, `file_stat`, `read_json`, `write_json`

### Execution (3 tools)
`bash` (cross-platform), `spawn`, `eval_code`

### Git (9 tools)
`git_status`, `git_commit`, `git_branch`, `git_diff`, `git_log`, `git_checkout`, `git_stash`, `git_merge`, `git_remote`

### Code Analysis (8 tools)
`analyze_code`, `lint_code`, `format_code`, `generate_tests`, `refactor_code`, `count_tokens`, `extract_imports`, `find_dead_code`

### Search (3 tools)
`search_code`, `semantic_search`, `file_search`

### Network (3 tools)
`fetch_url`, `download_file`, `web_search`

### Browser (5 tools)
`browse_page`, `scrape_content`, `screenshot_page`, `click_element`, `fill_form`

### Debug (5 tools)
`trail_start`, `trail_stop`, `set_breakpoint`, `inspect_variable`, `stack_trace`

### AI (3 tools)
`think`, `complex_prompt`, `multi_step`

### Project (3 tools)
`project_info`, `project_dependencies`, `project_scripts`

### Documentation (3 tools)
`generate_docs`, `update_changelog`, `readme_generator`

### Database (2 tools)
`db_query`, `db_migrate`

### Testing (3 tools)
`run_tests`, `coverage_report`, `snapshot_test`

### Utility (7 tools)
`compress`, `decompress`, `calculate_hash`, `notebook`, `clipboard`, `env_manager`, `parse_data`

## Configuration

Cod3x uses a 3-level configuration hierarchy:

1. **Global**: `~/.cod3xrc` - User-level defaults
2. **Local**: `~/.cod3x/config.local.json` - Machine-specific (not in git)
3. **Project**: `./.cod3xrc` - Project-specific settings

Environment variables override all levels:

| Variable | Description |
|----------|-------------|
| `COD3X_PROVIDER` | LLM provider (opencode-proxy, anthropic, openai, openrouter, custom) |
| `COD3X_MODEL` | Model name |
| `COD3X_TEMPERATURE` | Temperature (0-1) |
| `COD3X_MAX_TOKENS` | Max tokens |
| `COD3X_CUSTOM_BASE_URL` | Custom API base URL |
| `COD3X_CUSTOM_API_KEY` | Custom API key |
| `OPENCODE_PROXY_URL` | OpenCode proxy URL |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `COD3X_SWARM_ENABLED` | Enable swarm mode |
| `COD3X_BROWSER_ENABLED` | Enable browser tools |
| `PLATFORM` | Override platform detection |

## Swarm Mode

Swarm mode decomposes complex tasks into subtasks and executes them across multiple agents:

```bash
# Command line
cod3x swarm "Refactor auth module, add tests, update docs"

# In chat
!swarm Build a REST API with authentication, rate limiting, and tests

# Strategies: parallel, sequential, priority, dependency, round-robin
cod3x swarm "Task" --strategy dependency --agents 5
```

## Agent Chaining

Chain agents together where the output of one feeds into the next:

```javascript
// In the web UI or programmatic API
await orchestrator.executeChain([
  { task: { id: '1', description: 'Analyze the codebase' }, agentId: 'code-review', usePreviousOutput: false },
  { task: { id: '2', description: 'Fix issues found' }, agentId: 'debugger', usePreviousOutput: true },
  { task: { id: '3', description: 'Write tests for fixes' }, agentId: 'tester', usePreviousOutput: true },
]);
```

## Cross-Platform Support

| Platform | Shell | Puppeteer | Notes |
|----------|-------|-----------|-------|
| Termux | bash | Disabled | curl fallback for web tools |
| Linux | bash | Enabled | Full support |
| Windows | cmd.exe | Disabled | Auto command translation |
| macOS | zsh | Enabled | Full support |
| Android | sh | Disabled | Via Termux recommended |

The bash tool automatically:
- Translates Unix commands to Windows equivalents (`ls` → `dir`, etc.)
- Sets correct PATH on Termux
- Uses appropriate shell (bash/cmd/zsh)
- Handles path separators (`/` → `\` on Windows)

## API Endpoints

When running `node server.mjs`, the following API endpoints are available:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Server status and configuration |
| GET | `/api/tools` | List all tools |
| GET | `/api/agents` | List all agents |
| POST | `/api/chat` | Send a chat message |
| POST | `/api/swarm` | Execute swarm task |
| POST | `/api/tool/:name` | Execute a specific tool |
| GET | `/api/config` | Get current configuration |

## Development

```bash
# Clone
git clone https://github.com/codexhaven/cod3x-code.git
cd cod3x-code

# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Test
npm run test
```

## Project Structure

```
cod3x-code/
├── src/
│   ├── main.tsx              # CLI entry point
│   ├── core/
│   │   ├── app.tsx           # Main React Ink app
│   │   ├── tool-registry.ts  # Tool registration system
│   │   └── non-interactive.ts # CI/CD mode
│   ├── agents/
│   │   └── orchestrator.ts   # 14-agent orchestration
│   ├── llm/
│   │   ├── provider.ts       # Multi-provider factory
│   │   ├── opencode-proxy.ts # OpenCode proxy provider
│   │   ├── anthropic-provider.ts # Anthropic direct API
│   │   ├── openai-provider.ts    # OpenAI direct API
│   │   ├── openrouter-provider.ts # OpenRouter API
│   │   └── custom-provider.ts    # Generic OpenAI-compatible
│   ├── swarm/
│   │   ├── engine.ts         # Swarm execution engine
│   │   └── decomposer.ts     # Task decomposition
│   ├── tools/                # 70+ tools in 14 categories
│   ├── ui/                   # React Ink components
│   ├── hooks/                # React hooks
│   ├── memory/
│   │   └── conversation.ts   # SQLite + JSON persistence
│   ├── platform/
│   │   └── detector.ts       # Cross-platform detection
│   ├── config/
│   │   ├── loader.ts         # 3-level config loader
│   │   └── defaults.ts       # Default configuration
│   ├── utils/
│   │   ├── logger.ts         # Structured logging
│   │   └── permissions.ts    # Permission management
│   ├── context/
│   │   └── file-index.ts     # File indexing
│   ├── mcp/
│   │   └── manager.ts        # MCP server management
│   ├── commands/
│   │   └── doctor.ts         # Diagnostics command
│   └── types/
│       └── index.ts          # TypeScript definitions
├── server.mjs                # Web server
├── register-paths.mjs        # Node.js path resolver
├── scripts/
│   ├── postinstall.js        # Post-install setup
│   └── fix-dist-paths.js     # Build post-processor
├── install/                  # Platform install scripts
├── .cod3xrc                  # Example configuration
├── .env.example              # Environment variables template
└── tsconfig.json             # TypeScript configuration
```

## License

MIT License - see [LICENSE](LICENSE) file.

## Credits

Developed by [CodexHaven](https://github.com/codexhaven). Special thanks to the open-source community for the tools and libraries that make this project possible.

## Support

- GitHub Issues: [github.com/codexhaven/cod3x-code/issues](https://github.com/codexhaven/cod3x-code/issues)
- Documentation: [github.com/codexhaven/cod3x-code#readme](https://github.com/codexhaven/cod3x-code#readme)
