#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Cod3x Code v4.0 - Linux/macOS Local Model Setup
# Developed by CodexHaven
#
# Helps users download and configure Ollama models for offline use.
# ═══════════════════════════════════════════════════════════════

set -e

# Detect ROOT
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

clear
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Cod3x Code v4.0 - Local Model Setup (Ollama)"
echo "  Developed by CodexHaven"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "[✗] Ollama is not installed."
    echo ""
    echo "Please install Ollama first:"
    echo "    curl -fsSL https://ollama.com/install.sh | sh"
    echo ""
    echo "Or visit: https://ollama.com/download"
    echo ""
    read -rp "Install Ollama now? [Y/n]: " install_ollama
    if [[ "$install_ollama" =~ ^[Yy]$ ]] || [[ -z "$install_ollama" ]]; then
        echo "[*] Installing Ollama..."
        curl -fsSL https://ollama.com/install.sh | sh
    else
        exit 0
    fi
fi

echo "[✓] Ollama is installed"
ollama --version 2>/dev/null || true
echo ""

# ─── Menu ───
echo "Select a model to download:"
echo ""
echo "  [1] Gemma 3 1B    - Fastest, good for coding (Recommended)"
echo "  [2] Gemma 3 4B    - Balanced speed and quality"
echo "  [3] Qwen 2.5 7B   - Strong coding performance"
echo "  [4] DeepSeek 7B   - Good for complex tasks"
echo "  [5] Mistral 7B    - General purpose"
echo "  [6] Custom model   - Enter model name manually"
echo "  [7] List installed models"
echo "  [8] Start speed proxy only"
echo ""
read -rp "Enter choice (1-8): " choice

case "$choice" in
    1) MODEL="gemma3:1b" ;;
    2) MODEL="gemma3:4b" ;;
    3) MODEL="qwen2.5:7b" ;;
    4) MODEL="deepseek-llm:7b" ;;
    5) MODEL="mistral:7b" ;;
    6)
        read -rp "Enter model name (e.g., codellama:7b): " MODEL
        if [[ -z "$MODEL" ]]; then
            echo "[✗] No model name entered."
            exit 1
        fi
        ;;
    7)
        echo ""
        echo "Installed models:"
        echo ""
        ollama list
        echo ""
        exit 0
        ;;
    8)
        start_proxy
        exit 0
        ;;
    *)
        echo "Invalid choice."
        exit 1
        ;;
esac

# ─── Download ───
echo ""
echo "[*] Downloading model: $MODEL"
echo "    This may take several minutes depending on your connection..."
echo ""
ollama pull "$MODEL"

echo "[✓] Model downloaded successfully!"
echo ""

# ─── Configure Cod3x ───
echo "[*] Configuring Cod3x to use Ollama..."

CONFIG_DIR="${COD3X_HOME:-$ROOT/data}/config"
mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_DIR/ai_settings.env" << EOF
# Cod3x AI Provider Configuration
AI_PROVIDER=ollama
BASE_URL=http://localhost:11435/v1
MODEL=$MODEL
OLLAMA_API_KEY=ollama
EOF

echo "[✓] Configuration saved to: $CONFIG_DIR/ai_settings.env"
echo ""

# ─── Start proxy ───
start_proxy() {
    echo "[*] Starting local speed proxy..."
    echo "    The proxy optimizes prompt sizes for faster local inference."
    echo ""
    echo "    Press Ctrl+C to stop the proxy when done."
    echo ""

    node "$ROOT/tools/local-proxy.js"
}

echo "[*] Starting local speed proxy..."
echo "    The proxy optimizes prompt sizes for faster local inference."
echo "    Press Ctrl+C to stop the proxy when done."
echo ""

# Start proxy in background
node "$ROOT/tools/local-proxy.js" &
PROXY_PID=$!

echo "[✓] Speed proxy started on localhost:11435 (PID: $PROXY_PID)"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Setup Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Model:      $MODEL"
echo "  Provider:   Ollama"
echo "  Proxy:      http://localhost:11435"
echo "  Config:     $CONFIG_DIR/ai_settings.env"
echo ""
echo "  You can now run ./start.sh and select Normal Mode."
echo "  The AI will use your local model - no internet needed!"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Keep script running until user presses Enter
echo "Press Enter to stop the proxy and exit..."
read -r
kill $PROXY_PID 2>/dev/null || true
echo "[✓] Proxy stopped."
