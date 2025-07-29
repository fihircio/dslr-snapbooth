@echo off
echo Starting DSLR Helper for Windows...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if gphoto2 is available
gphoto2 --version >nul 2>&1
if errorlevel 1 (
    echo Warning: gphoto2 not found in PATH
    echo If using WSL2, run this script from WSL2 terminal
    echo If using native Windows, ensure gphoto2 is installed
)

REM Set environment variable if not set
if "%DSLR_API_TOKEN%"=="" (
    set DSLR_API_TOKEN=yourtoken
    echo Using default API token. Set DSLR_API_TOKEN for production.
)

REM Create static directory if it doesn't exist
if not exist "static" mkdir static

REM Start the Node.js server
echo Starting DSLR Helper server...
npx nodemon main.js

pause 