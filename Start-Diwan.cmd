@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install the LTS version from https://nodejs.org
  pause
  exit /b 1
)
node build.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
node server.mjs
pause
