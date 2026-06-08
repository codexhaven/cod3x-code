#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Cod3x Code v4.0 - Linux/macOS Session Resume Launcher
# Quick shortcut to resume a previous session
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Detect ROOT
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

# ─── Detect Node.js ───
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [[ "$OS" == "darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        NODE_DISTRO="darwin-arm64"
    else
        NODE_DISTRO="darwin-x64"
    fi
else
    if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
        NODE_DISTRO="linux-arm64"
    else
        NODE_DISTRO="linux-x64"
    fi
fi

NODE_DIR="$ROOT/engine/node-$NODE_DISTRO"
NODE_EXE="$NODE_DIR/bin/node"

if [[ ! -x "$NODE_EXE" ]]; then
    if command -v node &> /dev/null; then
        NODE_EXE="node"
    else
        echo "[✗] Node.js not found. Please run ./start.sh first."
        exit 1
    fi
fi

# ─── Session ID ───
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Cod3x Code v4.0 - Resume Session"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [[ $# -ge 1 ]]; then
    SESSION_ID="$1"
else
    read -rp "Enter session ID: " SESSION_ID
fi

if [[ -z "$SESSION_ID" ]]; then
    echo "[✗] No session ID provided."
    exit 1
fi

echo ""
echo "[*] Resuming session: $SESSION_ID..."
echo ""

if [[ -x "$NODE_EXE" && "$NODE_EXE" != "node" ]]; then
    "$NODE_EXE" "$ROOT/engine/node_modules/cod3x-code/dist/main.js" resume "$SESSION_ID"
else
    node "$ROOT/engine/node_modules/cod3x-code/dist/main.js" resume "$SESSION_ID"
fi
