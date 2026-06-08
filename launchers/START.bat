@echo off
setlocal EnableDelayedExpansion

:: ═══════════════════════════════════════════════════════════════
:: Cod3x Code v4.0 - Portable Windows Launcher
:: Developed by CodexHaven - https://github.com/codexhaven/cod3x-code
::
:: Zero-installation launcher: auto-downloads Node.js if needed,
:: installs dependencies, and presents an interactive menu.
:: ═══════════════════════════════════════════════════════════════

:: Detect launcher directory and set ROOT to parent
cd /d "%~dp0"
set "ROOT=%~dp0\.."
cd /d "%ROOT%"
set "ROOT=%CD%"

:: ─── Redirect ALL host paths into ./data/ ───
set "XDG_CONFIG_HOME=%ROOT%\data\config"
set "XDG_DATA_HOME=%ROOT%\data"
set "COD3X_HOME=%ROOT%\data"
set "HOME=%ROOT%\data"
set "USERPROFILE=%ROOT%\data"
set "APPDATA=%ROOT%\data"
set "LOCALAPPDATA=%ROOT%\data"
set "TMP=%ROOT%\data\tmp"
set "TEMP=%ROOT%\data\tmp"
set "TMPDIR=%ROOT%\data\tmp"
set "NPM_CONFIG_CACHE=%ROOT%\data\npm-cache"
set "NPM_CONFIG_PREFIX=%ROOT%\engine"

:: Ensure data subdirectories exist
if not exist "%ROOT%\data\config" mkdir "%ROOT%\data\config"
if not exist "%ROOT%\data\memory" mkdir "%ROOT%\data\memory"
if not exist "%ROOT%\data\logs" mkdir "%ROOT%\data\logs"
if not exist "%ROOT%\data\tmp" mkdir "%ROOT%\data\tmp"
if not exist "%ROOT%\data\ollama" mkdir "%ROOT%\data\ollama"

:: ─── Detect/Install bundled Node.js ───
set "NODE_DIR=%ROOT%\engine\node-win-x64"
set "NODE_EXE=%NODE_DIR%\node.exe"

if exist "%NODE_EXE%" (
    echo [^✓^] Using bundled Node.js
    goto :check_modules
)

:: Try to find system Node.js
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [^✓^] Using system Node.js
    for /f "tokens=*" %%a in ('node --version') do set "NODE_VER=%%a"
    echo     Version: %NODE_VER%
    set "NODE_EXE=node"
    set "NPM_EXE=npm"
    goto :check_modules
)

:: Need to download Node.js
echo [*] Node.js not found. Downloading Node.js v20.x LTS...
if not exist "%NODE_DIR%" mkdir "%NODE_DIR%"

:: Download using PowerShell
echo [*] Downloading Node.js v20.18.1 (Windows x64)...
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.1/node-v20.18.1-win-x64.zip' -OutFile '%ROOT%\data\tmp\node.zip'"
if %ERRORLEVEL% NEQ 0 (
    echo [^✗^] Download failed. Trying with curl...
    curl -L -o "%ROOT%\data\tmp\node.zip" "https://nodejs.org/dist/v20.18.1/node-v20.18.1-win-x64.zip"
)

if not exist "%ROOT%\data\tmp\node.zip" (
    echo [^✗^] Failed to download Node.js. Please install Node.js manually from https://nodejs.org
    pause
    exit /b 1
)

:: Extract
echo [*] Extracting Node.js...
powershell -Command "Expand-Archive -Path '%ROOT%\data\tmp\node.zip' -DestinationPath '%ROOT%\data\tmp\node-extract' -Force"

:: Move files to engine directory
xcopy /E /I /Y "%ROOT%\data\tmp\node-extract\node-v20.18.1-win-x64\*" "%NODE_DIR%\"
rmdir /S /Q "%ROOT%\data\tmp\node-extract"
del "%ROOT%\data\tmp\node.zip"

if not exist "%NODE_EXE%" (
    echo [^✗^] Node.js extraction failed.
    pause
    exit /b 1
)

echo [^✓^] Node.js downloaded and extracted
>"%ROOT%\engine\.node-ready" echo ready

:: ─── Install node_modules ───
:check_modules
set "NPM_EXE=%NODE_DIR%\npm.cmd"
if "%NPM_EXE%"=="" set "NPM_EXE=npm"

if exist "%ROOT%\engine\node_modules\cod3x-code" (
    echo [^✓^] Dependencies already installed
    goto :menu
)

echo [*] Installing dependencies (first run, may take 2-3 minutes)...
if not exist "%ROOT%\engine\package.json" (
    echo {"name":"cod3x-engine","version":"1.0.0","private":true} > "%ROOT%\engine\package.json"
)

if "%NODE_EXE%"=="node" (
    npm install cod3x-code --prefix "%ROOT%\engine" --cache "%ROOT%\data\npm-cache"
) else (
    "%NODE_EXE%" "%NODE_DIR%\node_modules\npm\bin\npm-cli.js" install cod3x-code --prefix "%ROOT%\engine" --cache "%ROOT%\data\npm-cache"
)

if %ERRORLEVEL% NEQ 0 (
    echo [^✗^] npm install failed. Check your internet connection.
    pause
    exit /b 1
)

echo [^✓^] Dependencies installed

:: ─── Interactive Menu ───
:menu
cls
echo.
echo ═══════════════════════════════════════════════════════════════
echo   Cod3x Code v4.0 by CodexHaven
echo   Portable Edition - Windows
echo ═══════════════════════════════════════════════════════════════
echo.
echo   [1] Normal Mode     - Ask before destructive operations
echo   [2] Limitless Mode  - Auto-execute, no prompts
echo   [3] Web Dashboard   - Open http://localhost:9000
echo   [4] Change Provider - Switch AI provider
echo   [5] Setup Offline   - Configure Ollama local models
echo   [6] Resume Session  - Resume a previous session
echo.
echo   Auto-selecting [1] Normal Mode in 10 seconds...
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

:: Timeout with choice
choice /C 123456 /N /T 10 /D 1 /M "Select option: "
set "CHOICE=%ERRORLEVEL%"

if "%CHOICE%"=="1" goto :normal
if "%CHOICE%"=="2" goto :limitless
if "%CHOICE%"=="3" goto :dashboard
if "%CHOICE%"=="4" goto :change_provider
if "%CHOICE%"=="5" goto :setup_offline
if "%CHOICE%"=="6" goto :resume_session
goto :normal

:: ─── Normal Mode ───
:normal
echo.
echo Starting Cod3x in Normal Mode...
echo.
if exist "%NODE_EXE%" (
    "%NODE_EXE%" "%ROOT%\engine\node_modules\cod3x-code\dist\main.js" chat
) else (
    node "%ROOT%\engine\node_modules\cod3x-code\dist\main.js" chat
)
pause
goto :eof

:: ─── Limitless Mode ───
:limitless
echo.
echo Starting Cod3x in Limitless Mode...
echo WARNING: Tools will execute WITHOUT confirmation!
echo.
set "COD3X_LIMITLESS=1"
if exist "%NODE_EXE%" (
    "%NODE_EXE%" "%ROOT%\engine\node_modules\cod3x-code\dist\main.js" chat
) else (
    set "COD3X_LIMITLESS=1" && node "%ROOT%\engine\node_modules\cod3x-code\dist\main.js" chat
)
pause
goto :eof

:: ─── Web Dashboard ───
:dashboard
echo.
echo Starting Web Dashboard on http://localhost:9000...
echo.
start http://localhost:9000
if exist "%NODE_EXE%" (
    "%NODE_EXE%" "%ROOT%\engine\node_modules\cod3x-code\server.mjs" 9000
) else (
    node "%ROOT%\engine\node_modules\cod3x-code\server.mjs" 9000
)
pause
goto :eof

:: ─── Change Provider ───
:change_provider
echo.
echo Launching Provider Switcher...
echo.
if exist "%NODE_EXE%" (
    "%NODE_EXE%" "%ROOT%\tools\change-provider.js"
) else (
    node "%ROOT%\tools\change-provider.js"
)
echo.
pause
goto :menu

:: ─── Setup Offline ───
:setup_offline
echo.
echo Launching Offline Model Setup...
echo.
call "%ROOT%\tools\setup-local-models.bat"
echo.
pause
goto :menu

:: ─── Resume Session ───
:resume_session
echo.
echo Enter session ID to resume:
set /p SESSION_ID="Session ID: "
if "%SESSION_ID%"=="" goto :menu
echo.
echo Resuming session: %SESSION_ID%...
if exist "%NODE_EXE%" (
    "%NODE_EXE%" "%ROOT%\engine\node_modules\cod3x-code\dist\main.js" resume %SESSION_ID%
) else (
    node "%ROOT%\engine\node_modules\cod3x-code\dist\main.js" resume %SESSION_ID%
)
pause
goto :eof
