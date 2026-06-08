@echo off
setlocal EnableDelayedExpansion

:: ═══════════════════════════════════════════════════════════════
:: Cod3x Code v4.0 - Windows Local Model Setup
:: Developed by CodexHaven
::
:: Helps users download and configure Ollama models for offline use.
:: ═══════════════════════════════════════════════════════════════

cls
echo.
echo ═══════════════════════════════════════════════════════════════
echo   Cod3x Code v4.0 - Local Model Setup (Ollama)
echo   Developed by CodexHaven
echo ═══════════════════════════════════════════════════════════════
echo.

:: Check if Ollama is installed
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [^✗^] Ollama is not installed.
    echo.
    echo Please install Ollama first:
    echo    https://ollama.com/download/windows
    echo.
    echo After installation, run this script again.
    echo.
    choice /C YN /N /M "Open download page now? [Y/N]: "
    if !ERRORLEVEL! EQU 1 start https://ollama.com/download/windows
    goto :eof
)

echo [^✓^] Ollama is installed
for /f "tokens=*" %%a in ('ollama --version') do echo     %%a
echo.

:: ─── Menu ───
echo Select a model to download:
echo.
echo  [1] Gemma 3 1B    - Fastest, good for coding (Recommended)
echo  [2] Gemma 3 4B    - Balanced speed and quality
echo  [3] Qwen 2.5 7B   - Strong coding performance
echo  [4] DeepSeek 7B   - Good for complex tasks
echo  [5] Mistral 7B    - General purpose
echo  [6] Custom model   - Enter model name manually
echo  [7] List installed models
echo  [8] Start speed proxy only
echo.
choice /C 12345678 /N /M "Enter choice (1-8): "

if %ERRORLEVEL% EQU 1 set "MODEL=gemma3:1b"
if %ERRORLEVEL% EQU 2 set "MODEL=gemma3:4b"
if %ERRORLEVEL% EQU 3 set "MODEL=qwen2.5:7b"
if %ERRORLEVEL% EQU 4 set "MODEL=deepseek-llm:7b"
if %ERRORLEVEL% EQU 5 set "MODEL=mistral:7b"
if %ERRORLEVEL% EQU 6 goto :custom_model
if %ERRORLEVEL% EQU 7 goto :list_models
if %ERRORLEVEL% EQU 8 goto :start_proxy

goto :download

:custom_model
echo.
set /p "MODEL=Enter model name (e.g., codellama:7b): "
if "!MODEL!"=="" (
    echo [^✗^] No model name entered.
    goto :eof
)
goto :download

:list_models
echo.
echo Installed models:
echo.
ollama list
echo.
pause
goto :eof

:download
echo.
echo [*] Downloading model: !MODEL!
echo     This may take several minutes depending on your connection...
echo.
ollama pull !MODEL!
if %ERRORLEVEL% NEQ 0 (
    echo [^✗^] Failed to download model.
    pause
    exit /b 1
)

echo [^✓^] Model downloaded successfully!
echo.

:: ─── Configure Cod3x to use Ollama ───
echo [*] Configuring Cod3x to use Ollama...

set "CONFIG_DIR=%COD3X_HOME%\config"
if not exist "%CONFIG_DIR%" set "CONFIG_DIR=%USERPROFILE%\.cod3x"
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

(
echo # Cod3x AI Provider Configuration
echo AI_PROVIDER=ollama
echo BASE_URL=http://localhost:11435/v1
echo MODEL=!MODEL!
echo OLLAMA_API_KEY=ollama
) > "%CONFIG_DIR%\ai_settings.env"

echo [^✓^] Configuration saved to: %CONFIG_DIR%\ai_settings.env
echo.

:: ─── Start proxy ───
:start_proxy
echo [*] Starting local speed proxy...
echo     The proxy optimizes prompt sizes for faster local inference.
echo.
echo    Press Ctrl+C to stop the proxy when done.
echo.

:: Detect ROOT
cd /d "%~dp0\.."
set "ROOT=%CD%"

:: Start proxy in background
start "Cod3x Ollama Proxy" cmd /c "node tools\local-proxy.js"

echo [^✓^] Speed proxy started on localhost:11435
echo.
echo ═══════════════════════════════════════════════════════════════
echo   Setup Complete!
echo ═══════════════════════════════════════════════════════════════
echo.
echo   Model:      !MODEL!
echo   Provider:   Ollama
echo   Proxy:      http://localhost:11435
echo   Config:     %CONFIG_DIR%\ai_settings.env
echo.
echo   You can now run START.bat and select Normal Mode.
echo   The AI will use your local model - no internet needed!
echo ═══════════════════════════════════════════════════════════════
echo.
pause
