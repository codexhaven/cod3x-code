@echo off
setlocal

:: ═══════════════════════════════════════════════════════════════
:: Cod3x Code v4.0 - Windows Session Resume Launcher
:: Quick shortcut to resume a previous session
:: ═══════════════════════════════════════════════════════════════

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

:: ─── Detect Node.js ───
set "NODE_DIR=%ROOT%\engine\node-win-x64"
set "NODE_EXE=%NODE_DIR%\node.exe"

if not exist "%NODE_EXE%" (
    node --version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "NODE_EXE=node"
    ) else (
        echo [✗] Node.js not found. Please run START.bat first.
        pause
        exit /b 1
    )
)

:: ─── Prompt for session ID ───
echo.
echo ═══════════════════════════════════════════════════════════════
echo   Cod3x Code v4.0 - Resume Session
echo ═══════════════════════════════════════════════════════════════
echo.

if "%~1"=="" (
    set /p SESSION_ID="Enter session ID: "
) else (
    set "SESSION_ID=%~1"
)

if "!SESSION_ID!"=="" (
    echo [✗] No session ID provided.
    pause
    exit /b 1
)

echo.
echo [*] Resuming session: !SESSION_ID!...
echo.

if exist "%NODE_EXE%" (
    "%NODE_EXE%" "%ROOT%\engine\node_modules\cod3x-code\dist\main.js" resume !SESSION_ID!
) else (
    node "%ROOT%\engine\node_modules\cod3x-code\dist\main.js" resume !SESSION_ID!
)

pause
