#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Cod3x Code v4.0 - Linux Installation Script
# Developed by CodexHaven - https://github.com/codexhaven/cod3x-code
# ═══════════════════════════════════════════════════════════════

set -e

echo ""
echo "  ╔═══════════════════════════════════════════════════════════╗"
echo "  ║     Cod3x Code v4.0 - Linux Installer by CodexHaven     ║"
echo "  ╚═══════════════════════════════════════════════════════════╝"
echo ""

# Detect distro
if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO=$NAME
else
    DISTRO="Unknown"
fi

echo "Detected: $DISTRO"

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    echo "[1/5] Installing Node.js..."
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y nodejs20
    elif command -v pacman &> /dev/null; then
        sudo pacman -S nodejs npm --noconfirm
    else
        echo "Please install Node.js 20+ manually"
        exit 1
    fi
fi

# Install Cod3x
echo "[2/5] Installing Cod3x Code..."
npm install -g cod3x-code

# Setup config
echo "[3/5] Setting up configuration..."
mkdir -p "$HOME/.cod3x"
mkdir -p "$HOME/.cod3x/hooks" "$HOME/.cod3x/cache" "$HOME/.cod3x/memory" "$HOME/.cod3x/trails"

cat > "$HOME/.cod3xrc" << 'EOF'
{
  "name": "linux-environment",
  "platform": { "type": "linux", "autoDetect": true },
  "ai": { "provider": "opencode-proxy", "model": "claude-sonnet-4" },
  "by": "CodexHaven Cod3x Code v4.0"
}
EOF

# Install proxy (optional)
echo "[4/5] Setting up opencode-free-proxy..."
if command -v pip3 &> /dev/null; then
    git clone --depth 1 https://github.com/sionex-code/opencode-proxy-api.git "$HOME/.cod3x/proxy" 2>/dev/null || true
fi

# Verify
echo "[5/5] Verifying..."
if command -v cod3x &> /dev/null; then
    echo "✅ Cod3x Code v4.0 installed!"
    echo ""
    echo "Quick start:"
    echo "  cod3x              Start interactive session"
    echo "  cod3x /help        Show help"
    echo "  cod3x doctor       Check system"
    echo ""
    echo "Set API key: export ANTHROPIC_API_KEY=your-key"
    echo "Or start proxy: cd ~/.cod3x/proxy && python auth_capture_v2.py"
    echo ""
    echo "Developed by CodexHaven - https://github.com/codexhaven/cod3x-code"
else
    echo "⚠️ Installation issue - try: npm install -g cod3x-code"
fi
