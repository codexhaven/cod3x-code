# Cod3x Code v4.0

> **The Ultimate Open-Source Claude Code Alternative** — Developed by [CodexHaven](https://github.com/codexhaven)

[![Version](https://img.shields.io/badge/version-4.0.0-00D4AA.svg)](https://github.com/codexhaven/cod3x-code)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/platform-Termux%20%7C%20Linux%20%7C%20Windows%20%7C%20macOS-blue.svg)](#installation)

## Overview

Cod3x Code is a comprehensive, production-ready open-source alternative to Anthropic's Claude Code. Built by **CodexHaven**, it features a React Ink terminal UI, **80+ tools** across **14 categories**, **14 specialized agents**, multi-agent swarm orchestration, Model Context Protocol (MCP) support, web browsing, debug trail tracking, and three-level configuration management — all designed to work seamlessly across **Termux (default), Linux, Windows, and macOS**.

### Key Features

| Feature | Cod3x Code v4.0 | Claude Code |
|---------|----------------|-------------|
| Tools | **80+ across 14 categories** | 40+ |
| Terminal UI | React Ink | React Ink |
| Agents | **14 specialized** | Subagent support |
| Swarm Mode | **Multi-agent orchestration** | Limited |
| MCP Support | Full support | Full support |
| Web Browsing | **Built-in scraping** | External |
| Debug Trail | **Execution tracing** | Basic |
| Open Source | **MIT License** | Proprietary |
| Multi-Provider | **Anthropic, OpenAI, Google, OpenRouter, opencode-free-proxy** | Anthropic only |
| Platforms | **Termux, Linux, Windows, macOS, Android** | Desktop only |
| Configuration | 3-level hierarchy | 3-level hierarchy |
| File References | @filename | @filename |
| Streaming | Yes | Yes |
| Non-Interactive | Yes (-p, CI/CD) | Yes (-p) |
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

Cod3x uses **opencode-free-proxy** as the default API provider (free access to Claude, GPT, Gemini models):

```bash
# Install opencode-free-proxy (recommended)
git clone https://github.com/sionex-code/opencode-proxy-api
cd opencode-proxy-api && pip install -r requirements.txt && python auth_capture_v2.py

# Or use direct API keys
export ANTHROPIC_API_KEY=your-key
# OR
export OPENROUTER_API_KEY=your-key
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

# Execute a tool
cod3x tool bash '{"command": "ls -la"}'

# System diagnostics
cod3x doctor
```

## Architecture

```
cod3x-enhanced/
├── src/
│   ├── main.tsx              # CLI entry with Commander.js
│   ├── core/
│   │   ├── app.tsx           # Main React Ink app with trail/swarm UI
│   │   ├── tool-registry.ts  # 80+ tool registry
│   │   ├── agent-runner.ts   # Agent execution engine
│   │   └── non-interactive.ts # CI/CD mode
│   ├── llm/
│   │   ├── provider.ts       # Unified LLM factory with fallback
│   │   └── opencode-proxy.ts # Default opencode-free-proxy provider
│   ├── swarm/
│   │   ├── engine.ts         # Multi-agent swarm execution
│   │   └── decomposer.ts     # Task decomposition with LLM
│   ├── agents/
│   │   └── orchestrator.ts   # 14-agent orchestration with swarm
│   ├── platform/
│   │   └── detector.ts       # Auto-detect Termux/Linux/Win/Mac
│   ├── tools/                # 80+ tools across 14 categories
│   │   ├── filesystem/       # 13 tools (read, write, edit, ls, glob, grep, find, cp, mv, rm, stat, json)
│   │   ├── execution/        # 3 tools (bash, spawn, eval)
│   │   ├── git/              # 9 tools (status, commit, branch, diff, log, checkout, stash, merge, remote)
│   │   ├── code/             # 8 tools (analyze, lint, format, tests, refactor, tokens, imports, dead-code)
│   │   ├── search/           # 3 tools (code-search, semantic, file-search)
│   │   ├── docs/             # 3 tools (generate-docs, changelog, readme)
│   │   ├── network/          # 3 tools (fetch, download, web-search)
│   │   ├── browser/          # 5 tools (browse, scrape, screenshot, click, fill-form)
│   │   ├── debug/            # 5 tools (trail-start, trail-stop, breakpoint, inspect, stack-trace)
│   │   ├── database/         # 2 tools (query, migrate)
│   │   ├── testing/          # 3 tools (run-tests, coverage, snapshot)
│   │   ├── utils/            # 7 tools (compress, decompress, hash, notebook, clipboard, env, parse)
│   │   ├── project/          # 3 tools (info, dependencies, scripts)
│   │   └── ai/               # 3 tools (think, complex-prompt, multi-step)
│   ├── ui/                   # React Ink components
│   ├── hooks/                # React hooks (conversation, tools, streaming, trail)
│   ├── memory/               # Conversation memory with persistence
│   ├── utils/                # Logger, permissions
│   ├── config/               # Three-level config loader
│   ├── context/              # File indexing
│   ├── types/                # TypeScript definitions
│   └── mcp/                  # MCP server management
├── install/                  # Platform installers
│   ├── termux.sh
│   ├── linux.sh
│   ├── windows.ps1
│   └── macos.sh
└── README.md
```

## 14 Built-in Agents

| Agent | Role | Specialization |
|-------|------|---------------|
| Code Generator | `code-generator` | Production-ready code generation |
| Code Reviewer | `code-reviewer` | Quality, security, best practices |
| Debugger | `debugger` | Root cause analysis and fixes |
| Architect | `architect` | System design and patterns |
| Tester | `tester` | Test generation and coverage |
| Documenter | `documenter` | Documentation creation |
| Git Manager | `git-manager` | Version control workflows |
| Security Auditor | `security-auditor` | Vulnerability detection |
| Optimizer | `optimizer` | Performance optimization |
| Web Browser | `browser` | Web research and extraction |
| Swarm Leader | `swarm-leader` | Multi-agent coordination |
| Task Decomposer | `task-decomposer` | Complex task breakdown |
| Error Analyst | `error-analyst` | Detailed error diagnostics |
| Trail Runner | `trail-runner` | Execution tracing |

### Swarm Execution

Swarm mode intelligently decomposes complex tasks into parallel subtasks:

```bash
# Decompose and execute with multiple agents
cod3x swarm "Build a complete REST API with authentication, tests, and documentation"

# The swarm will:
# 1. Decompose into subtasks (architect, code-gen, tester, documenter)
# 2. Execute agents in parallel with dependency management
# 3. Synthesize results into a coherent output
```

## Web Browsing & Debug Trail

### Web Browsing
```bash
# In interactive mode:
> Browse https://docs.example.com and extract the API endpoints
> Search for "React 19 new features" and summarize
> Scrape code examples from the tutorial page
```

### Debug Trail
```bash
# Start recording all operations
> /trail start
> [execute tasks...]
> /trail stop
> View the complete execution trace with timing and results
```

## Platform Detection

Cod3x automatically detects and adapts to your platform:

| Platform | Detection | Adaptations |
|----------|-----------|-------------|
| **Termux** | `TERMUX_VERSION`, `/data/data/com.termux` | Mobile optimizations, reduced memory, no browser |
| **Android** | `ANDROID_ROOT` | Mobile mode, restricted features |
| **Linux** | `process.platform === 'linux'` | Full features, bash shell |
| **Windows** | `process.platform === 'win32'` | CMD/PowerShell, path separators |
| **macOS** | `process.platform === 'darwin'` | zsh shell, full features |

## API Provider Configuration

### Default: opencode-free-proxy (Free)

The recommended setup uses the open-source opencode-free-proxy for free access to Claude, GPT, and Gemini models.

```bash
# 1. Install proxy
git clone https://github.com/sionex-code/opencode-proxy-api
cd opencode-proxy-api
pip install -r requirements.txt

# 2. Start proxy
python auth_capture_v2.py
# Open http://localhost:3128 in browser

# 3. Start Cod3x (connects automatically)
cod3x
```

### Alternative: Direct API Keys

```bash
export ANTHROPIC_API_KEY=your-key       # Claude models
export OPENAI_API_KEY=your-key          # GPT models
export GOOGLE_API_KEY=your-key          # Gemini models
export OPENROUTER_API_KEY=your-key      # 200+ models
```

## Slash Commands

| Command | Description |
|---------|-------------|
| `/exit`, `/quit` | Exit Cod3x |
| `/clear` | Clear conversation |
| `/compact` | Compact conversation memory |
| `/tools` | List all 80+ tools |
| `/agents` | List 14 agents |
| `/swarm <task>` | Execute with swarm |
| `/trail` | Toggle debug trail view |
| `/status` | Show system status |
| `/help` | Show help |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Exit |
| `Ctrl+L` | Clear chat |
| `Ctrl+O` | MCP mode |
| `Ctrl+S` | Swarm mode |
| `Ctrl+T` | Trail view |
| `Esc` | Cancel operation |
| `↑` / `↓` | Command history |

## Special Syntax

```
@file.ts              Reference a file
!agent role task      Run specific agent
!swarm objective      Run swarm mode
/tool params          Execute tool directly
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENCODE_PROXY_URL` | opencode-free-proxy URL |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `COD3X_PROVIDER` | Override provider |
| `COD3X_MODEL` | Override model |
| `COD3X_SWARM_ENABLED` | Enable swarm |
| `PLATFORM` | Override platform detection |

## Comparison with Claude Code

| Dimension | Cod3x Code v4.0 | Claude Code |
|-----------|----------------|-------------|
| Tools | **80+ across 14 categories** | 40+ |
| Agents | **14 specialized + swarm** | Subagent |
| Browser | **Built-in browsing/scraping** | External |
| Debug | **Execution trail tracking** | Basic |
| Platforms | **Termux, Linux, Win, Mac** | Desktop only |
| Cost | **Free (opencode-free-proxy)** | $20-200/month |
| License | **MIT (Open Source)** | Proprietary |

## Contributing

Contributions are welcome! Cod3x Code is developed by **CodexHaven** and the community.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

## License

[MIT](LICENSE) License — Copyright (c) 2024-2026 CodexHaven

## About CodexHaven

**CodexHaven** is dedicated to building open-source developer tools that rival proprietary alternatives. Cod3x Code is our flagship product — a Claude Code alternative that puts the power back in developers' hands.

- GitHub: [github.com/codexhaven](https://github.com/codexhaven)
- Project: [github.com/codexhaven/cod3x-code](https://github.com/codexhaven/cod3x-code)

---

**Built with passion by CodexHaven. Every line of code matters.**
