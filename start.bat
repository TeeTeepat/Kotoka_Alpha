@echo off
REM Kotoka Docker Startup Script for Windows

echo ========================================
echo    Kotoka - Docker Startup
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo [!] .env file not found!
    echo [*] Creating from .env.example...
    copy .env.example .env >nul
    echo.
    echo [!] Please edit .env with your API keys, then run this script again.
    echo.
    echo Required variables:
    echo   - AZURE_SPEECH_KEY
    echo   - GEMINI_API_KEY
    echo   - AUTH_SECRET
    echo.
    pause
    exit /b 1
)

echo [+] .env file found
echo [*] Building and starting containers...
echo.

docker-compose up --build

pause
