@echo off
REM ============================================
REM  PoxiOptimizer - arranque en modo desarrollo
REM ============================================
cd /d "%~dp0"

echo.
echo   == PoxiOptimizer (desarrollo) ==
echo.

if not exist "node_modules" (
  echo   Instalando dependencias por primera vez...
  call npm install
)

call npm run tauri dev
