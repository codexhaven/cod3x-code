#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Cod3x Code v4.0 - Portable Linux/macOS Launcher
# Developed by CodexHaven - https://github.com/codexhaven/cod3x-code
#
# Zero-installation launcher: auto-downloads Node.js if needed,
# installs dependencies, and presents an interactive menu.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Detect ROOT (parent of launchers/ directory)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── Redirect ALL host paths into ./data/ ───
export XDG_CONFIG_HOME="$ROOT/data/config"
export XDG_DATA_HOME="$ROOT/data"
export COD3X_HOME="$ROOT/data"
export HOME="$ROOT/data"
export USERPROFILE="$ROOT/data"
export TMPDIR="$ROOT/data/tmp"
export TMP="$ROOT/data/tmp"
export TEMP="$ROOT/data/tmp"
export NPM_CONFIG_CACHE="$ROOT/data/npm-cache"
export NPM_CONFIG_PREFIX="$ROOT/engine"

# Ensure data subdirectories exist
mkdir -p "$ROOT/data/config" "$ROOT/data/memory" "$ROOT/data/logs" "$ROOT/data/tmp" "$ROOT/data/ollama"

# ─── Detect platform and architecture ───
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Normalize platform names for Node.js downloads
if [[ "$OS" == "darwin" ]]; then
    NODE_PLATFORM="darwin"
    if [[ "$ARCH" == "arm64" ]]; then
        NODE_ARCH="arm64"
        NODE_DISTRO="darwin-arm64"
    else
        NODE_ARCH="x64"
        NODE_DISTRO="darwin-x64"
    fi
elif [[ "$OS" == "linux" ]]; then
    NODE_PLATFORM="linux"
    if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
        NODE_ARCH="arm64"
        NODE_DISTRO="linux-arm64"
    else
        NODE_ARCH="x64"
        NODE_DISTRO="linux-x64"
    fi
else
    echo "Unsupported OS: $OS"
    exit 1
fi

NODE_VERSION="v20.18.1"
NODE_DIR="$ROOT/engine/node-$NODE_DISTRO"
NODE_EXE="$NODE_DIR/bin/node"
NPM_EXE="$NODE_DIR/bin/npm"

# ─── Detect/Install bundled Node.js ───
if [[ -x "$NODE_EXE" ]]; then
    echo "[✓] Using bundled Node.js ($NODE_DISTRO)"
else
    # Try system Node.js
    if command -v node &> /dev/null; then
        SYS_NODE_VER=$(node --version 2>/dev/null || echo "unknown")
        echo "[✓] Using system Node.js ($SYS_NODE_VER)"
        NODE_EXE="node"
        NPM_EXE="npm"
    else
        echo "[*] Node.js not found. Downloading Node.js $NODE_VERSION..."
        mkdir -p "$NODE_DIR"

        NODE_TARBALL="node-$NODE_VERSION-$NODE_DISTRO.tar.gz"
        DOWNLOAD_URL="https://nodejs.org/dist/$NODE_VERSION/$NODE_TARBALL"
        TMP_TARBALL="$ROOT/data/tmp/$NODE_TARBALL"

        echo "[*] Downloading from $DOWNLOAD_URL..."
        if command -v curl &> /dev/null; then
            curl -fsSL "$DOWNLOAD_URL" -o "$TMP_TARBALL"
        elif command -v wget &> /dev/null; then
            wget -q "$DOWNLOAD_URL" -O "$TMP_TARBALL"
        else
            echo "[✗] Neither curl nor wget found. Please install curl."
            exit 1
        fi

        echo "[*] Extracting Node.js..."
        mkdir -p "$ROOT/data/tmp/node-extract"
        tar -xzf "$TMP_TARBALL" -C "$ROOT/data/tmp/node-extract" --strip-components=1
        mv "$ROOT/data/tmp/node-extract/bin/node" "$NODE_DIR/bin/node" 2>/dev/null || {
            mkdir -p "$NODE_DIR/bin"
            cp -r "$ROOT/data/tmp/node-extract"/* "$NODE_DIR/"
        }
        rm -rf "$ROOT/data/tmp/node-extract" "$TMP_TARBALL"

        if [[ ! -x "$NODE_EXE" ]]; then
            echo "[✗] Node.js extraction failed."
            exit 1
        fi

        chmod +x "$NODE_EXE"
        echo "[✓] Node.js downloaded and extracted"
        echo "ready" > "$ROOT/engine/.node-ready"
    fi
fi

# ─── Install node_modules ───
if [[ -d "$ROOT/engine/node_modules/cod3x-code" ]]; then
    echo "[✓] Dependencies already installed"
else
    echo "[*] Installing dependencies (first run, may take 2-3 minutes)..."
    if [[ ! -f "$ROOT/engine/package.json" ]]; then
        echo '{"name":"cod3x-engine","version":"1.0.0","private":true}' > "$ROOT/engine/package.json"
    fi

    if [[ "$NPM_EXE" == "npm" ]]; then
        npm install cod3x-code --prefix "$ROOT/engine" --cache "$ROOT/data/npm-cache"
    else
        "$NODE_EXE" "$NODE_DIR/lib/node_modules/npm/bin/npm-cli.js" install cod3x-code --prefix "$ROOT/engine" --cache "$ROOT/data/npm-cache" 2>/dev/null || \
            "$NPM_EXE" install cod3x-code --prefix "$ROOT/engine" --cache "$ROOT/data/npm-cache"
    fi

    echo "[✓] Dependencies installed"
fi

# ─── Helper functions ───
run_chat() {
    local limitless="${1:-0}"
    local args="chat"

    if [[ "$limitless" == "1" ]]; then
        export COD3X_LIMITLESS=1
        echo "WARNING: Tools will execute WITHOUT confirmation!"
    fi

    if [[ -x "$NODE_EXE" && "$NODE_EXE" != "node" ]]; then
        "$NODE_EXE" "$ROOT/engine/node_modules/cod3x-code/dist/main.js" $args
    else
        node "$ROOT/engine/node_modules/cod3x-code/dist/main.js" $args
    fi
}

run_dashboard() {
    echo "[*] Starting Web Dashboard on http://localhost:9000..."
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:9000 &
    elif command -v open &> /dev/null; then
        open http://localhost:9000 &
    fi

    if [[ -x "$NODE_EXE" && "$NODE_EXE" != "node" ]]; then
        "$NODE_EXE" "$ROOT/engine/node_modules/cod3x-code/server.mjs" 9000
    else
        node "$ROOT/engine/node_modules/cod3x-code/server.mjs" 9000
    fi
}

run_change_provider() {
    if [[ -x "$NODE_EXE" && "$NODE_EXE" != "node" ]]; then
        "$NODE_EXE" "$ROOT/tools/change-provider.js"
    else
        node "$ROOT/tools/change-provider.js"
    fi
}

run_setup_offline() {
    bash "$ROOT/tools/setup-local-models.sh"
}

run_resume() {
    read -rp "Enter session ID to resume: " session_id
    if [[ -z "$session_id" ]]; then
        echo "[✗] No session ID provided."
        return
    fi
    echo "[*] Resuming session: $session_id..."
    if [[ -x "$NODE_EXE" && "$NODE_EXE" != "node" ]]; then
        "$NODE_EXE" "$ROOT/engine/node_modules/cod3x-code/dist/main.js" resume "$session_id"
    else
        node "$ROOT/engine/node_modules/cod3x-code/dist/main.js" resume "$session_id"
    fi
}

# ─── Interactive Menu ───
show_menu() {
    clear 2>/dev/null || true
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Cod3x Code v4.0 by CodexHaven"
    echo "  Portable Edition - ${NODE_PLATFORM^} ($NODE_DISTRO)"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "  [1] Normal Mode     - Ask before destructive operations"
    echo "  [2] Limitless Mode  - Auto-execute, no prompts"
    echo "  [3] Web Dashboard   - Open http://localhost:9000"
    echo "  [4] Change Provider - Switch AI provider"
    echo "  [5] Setup Offline   - Configure Ollama local models"
    echo "  [6] Resume Session  - Resume a previous session"
    echo ""
    echo "  Auto-selecting [1] Normal Mode in 10 seconds..."
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
}

# ─── Read with timeout ───
read_with_timeout() {
    local prompt="$1"
    local timeout="${2:-10}"
    local default="${3:-1}"

    # Try using read -t (bash 4+)
    local choice=""
    if IFS= read -rs -t "$timeout" -n 1 choice 2>/dev/null; then
        echo "$choice"
    else
        echo "$default"
    fi
}

# ─── Main Menu Loop ───
while true; do
    show_menu
    CHOICE=$(read_with_timeout "Select option: " 10 "1")
    echo ""

    case "$CHOICE" in
        1)
            run_chat 0
            exit 0
            ;;
        2)
            run_chat 1
            exit 0
            ;;
        3)
            run_dashboard
            exit 0
            ;;
        4)
            run_change_provider
            echo ""
            read -rp "Press Enter to return to menu..."
            ;;
        5)
            run_setup_offline
            echo ""
            read -rp "Press Enter to return to menu..."
            ;;
        6)
            run_resume
            exit 0
            ;;
        *)
            run_chat 0
            exit 0
            ;;
    esac
done
