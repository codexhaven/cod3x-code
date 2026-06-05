#!/data/data/com.termux/files/usr/bin/bash
# ═══════════════════════════════════════════════════════════════
# Cod3x Code v4.0 - Termux Installation Script
# Developed by CodexHaven - https://github.com/codexhaven/cod3x-code
# ═══════════════════════════════════════════════════════════════

set -e

echo ""
echo "  ╔═══════════════════════════════════════════════════════════╗"
echo "  ║     Cod3x Code v4.0 - Termux Installer by CodexHaven    ║"
echo "  ╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Update packages
echo -e "${CYAN}[1/7] Updating packages...${NC}"
pkg update -y && pkg upgrade -y

# Install dependencies
echo -e "${CYAN}[2/7] Installing dependencies...${NC}"
pkg install -y nodejs git python

# Install opencode-free-proxy
echo -e "${CYAN}[3/7] Setting up opencode-free-proxy...${NC}"
if [ ! -d "$HOME/opencode-proxy-api" ]; then
    git clone --depth 1 https://github.com/sionex-code/opencode-proxy-api.git "$HOME/opencode-proxy-api" 2>/dev/null || {
        echo -e "${YELLOW}Note: Could not clone opencode-proxy. You can set API keys instead.${NC}"
    }
fi

# Install Cod3x globally
echo -e "${CYAN}[4/7] Installing Cod3x Code...${NC}"
npm install -g cod3x-code 2>/dev/null || {
    echo -e "${YELLOW}Installing from local...${NC}"
    cd /data/data/com.termux/files/usr/lib/node_modules
    npm install -g "$(pwd)/cod3x-code"
}

# Create config directory
echo -e "${CYAN}[5/7] Setting up configuration...${NC}"
mkdir -p "$HOME/.cod3x" "$HOME/.cod3x/hooks" "$HOME/.cod3x/cache" "$HOME/.cod3x/memory"

# Create default config
cat > "$HOME/.cod3xrc" << 'EOF'
{
  "name": "termux-environment",
  "version": "1.0.0",
  "platform": {
    "type": "termux",
    "autoDetect": true
  },
  "ai": {
    "provider": "opencode-proxy",
    "model": "claude-sonnet-4",
    "opencodeProxyURL": "http://localhost:8000/v1"
  },
  "by": "CodexHaven Cod3x Code v4.0"
}
EOF

# Create startup script
echo -e "${CYAN}[6/7] Creating startup scripts...${NC}"
cat > "$HOME/.shortcuts/cod3x" << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
source $PREFIX/etc/profile
cd $HOME
cod3x
EOF
chmod +x "$HOME/.shortcuts/cod3x" 2>/dev/null || true

# Create proxy starter
cat > "$HOME/start-proxy.sh" << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
if [ -d "$HOME/opencode-proxy-api" ]; then
    cd "$HOME/opencode-proxy-api"
    pip install -r requirements.txt 2>/dev/null
    python auth_capture_v2.py &
    echo "Proxy starting on http://localhost:3128"
    echo "Open browser, authenticate, then click Start Proxy"
else
    echo "opencode-proxy not installed. Set API keys in ~/.cod3xrc instead."
fi
EOF
chmod +x "$HOME/start-proxy.sh"

# Verify installation
echo -e "${CYAN}[7/7] Verifying...${NC}"
if command -v cod3x &> /dev/null; then
    echo -e "${GREEN}✅ Cod3x Code v4.0 installed successfully!${NC}"
    echo ""
    echo -e "${CYAN}Quick Start:${NC}"
    echo "  1. Start proxy: bash ~/start-proxy.sh"
    echo "  2. Or set API key: export ANTHROPIC_API_KEY=your-key"
    echo "  3. Run Cod3x: cod3x"
    echo "  4. Get help: cod3x /help"
    echo ""
    echo -e "${CYAN}Usage:${NC}"
    echo "  cod3x                    Start interactive session"
    echo "  cod3x run \"your prompt\"  Execute single command"
    echo "  cod3x swarm \"objective\" Run swarm agents"
    echo "  cod3x doctor             Check system"
    echo ""
    echo -e "${YELLOW}Developed by CodexHaven${NC}"
else
    echo -e "${RED}❌ Installation may have issues${NC}"
fi
