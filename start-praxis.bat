@echo off
TITLE Praxis Trading Platform Launcher
echo =======================================================
echo   PRAXIS INSTITUTIONAL TRADING PLATFORM
echo   Starting Foundation Models, Backend, and Frontend...
echo =======================================================
echo.

REM 1. Start Node.js Express API Server (port 5000)
REM The backend automatically boots and supervises the Python Foundation Models Ensemble (port 7174) in the background.
echo [1/2] Launching Backend API Server [Port 5000] (Auto-spawns Python Models)...
start "Praxis Backend API [Port 5000]" cmd /c "cd /d "%~dp0backend" && npm run dev"

REM 2. Start Frontend Vite Dev Server (port 5173)
echo [2/2] Launching Frontend Dashboard [Port 5173]...
start "Praxis Frontend [Port 5173]" cmd /c "cd /d "%~dp0frontend\stock-look" && npm run dev"

echo.
echo =======================================================
echo   Services successfully launched!
echo   - Backend API & Foundation Models: http://localhost:5000 (Models on 7174)
echo   - Frontend Web App:                http://localhost:5173
echo =======================================================
