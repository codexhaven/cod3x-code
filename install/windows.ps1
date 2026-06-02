# ═══════════════════════════════════════════════════════════════
# Cod3x Code v4.0 - Windows PowerShell Installation Script
# Developed by CodexHaven - https://github.com/codexhaven/cod3x-code
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║     Cod3x Code v4.0 - Windows Installer by CodexHaven   ║" -ForegroundColor Cyan
Write-Host "  ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "[1/5] Checking Node.js..." -ForegroundColor Cyan
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Node.js via winget..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Install Cod3x
Write-Host "[2/5] Installing Cod3x Code..." -ForegroundColor Cyan
npm install -g cod3x-code

# Setup config
Write-Host "[3/5] Setting up configuration..." -ForegroundColor Cyan
$cod3xDir = "$env:USERPROFILE\.cod3x"
New-Item -ItemType Directory -Force -Path "$cod3xDir\hooks", "$cod3xDir\cache", "$cod3xDir\memory", "$cod3xDir\trails" | Out-Null

@"
{
  "name": "windows-environment",
  "platform": { "type": "win32", "autoDetect": true },
  "ai": { "provider": "opencode-proxy", "model": "claude-sonnet-4" },
  "by": "CodexHaven Cod3x Code v4.0"
}
"@ | Set-Content "$env:USERPROFILE\.cod3xrc" -Encoding UTF8

# Verify
Write-Host "[4/5] Verifying..." -ForegroundColor Cyan
$cod3xPath = (Get-Command cod3x -ErrorAction SilentlyContinue)
if ($cod3xPath) {
    Write-Host "✅ Cod3x Code v4.0 installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Quick start:" -ForegroundColor Cyan
    Write-Host "  cod3x              Start interactive session"
    Write-Host "  cod3x /help        Show help"
    Write-Host "  cod3x doctor       Check system"
    Write-Host ""
    Write-Host "Set API key: `$env:ANTHROPIC_API_KEY = 'your-key'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Developed by CodexHaven - https://github.com/codexhaven/cod3x-code" -ForegroundColor Gray
} else {
    Write-Host "⚠️ Installation issue" -ForegroundColor Yellow
}
