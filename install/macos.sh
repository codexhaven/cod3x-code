#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Cod3x Code v4.0 - macOS Installation Script
# Developed by CodexHaven - https://github.com/codexhaven/cod3x-code
# ═══════════════════════════════════════════════════════════════

set -e

echo ""
echo "  ╔═══════════════════════════════════════════════════════════╗"
echo "  ║     Cod3x Code v4.0 - macOS Installer by CodexHaven     ║"
echo "  ╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check Homebrew
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Node.js
echo "[1/4] Installing dependencies..."
brew install node git 2>/dev/null || brew upgrade node 2>/dev/null || true

# Install Cod3x
echo "[2/4] Installing Cod3x Code..."
npm install -g cod3x-code

# Setup config
echo "[3/4] Setting up configuration..."
mkdir -p "$HOME/.cod3x"
cat > "$HOME/.cod3xrc" << 'EOF'
{
  "name": "macos-environment",
  "platform": { "type": "darwin", "autoDetect": true },
  "ai": { "provider": "opencode-proxy", "model": "claude-sonnet-4" },
  "by": "CodexHaven Cod3x Code v4.0"
}
EOF

# Verify
echo "[4/4] Verifying..."
if command -v cod3x &> /dev/null; then
    echo "✅ Cod3x Code v4.0 installed!"
    echo ""
    echo "Quick start:"
    echo "  cod3x              Start interactive session"
    echo "  cod3x /help        Show help"
    echo "  cod3x doctor       Check system"
    echo ""
    echo "Set API key: export ANTHROPIC_API_KEY=your-key"
    echo ""
    echo "Developed by CodexHaven - https://github.com/codexhaven/cod3x-code"
else
    echo "⚠️ Installation issue"
fi
