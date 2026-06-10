@echo off
REM ==================================================================
REM  PoxiOptimizer - prepara la build de produccion en deploy-hosting
REM  Copia el instalador y el ejecutable portable listos para distribuir.
REM ==================================================================
cd /d "%~dp0"

echo.
echo   == PoxiOptimizer - deploy ==
echo.

REM 1. Compila la version de produccion (frontend + binario nativo)
echo   Compilando release...
call npm run tauri build
if errorlevel 1 (
  echo   ERROR durante la compilacion. Abortando.
  exit /b 1
)

REM 2. Prepara la carpeta de salida limpia
if exist "deploy-hosting" rmdir /s /q "deploy-hosting"
mkdir "deploy-hosting"

REM 3. Copia los artefactos de produccion
set "REL=src-tauri\target\release"

echo   Copiando ejecutable portable...
copy /y "%REL%\poxi-optimizer.exe" "deploy-hosting\PoxiOptimizer.exe" >nul 2>&1

echo   Copiando instalador NSIS...
copy /y "%REL%\bundle\nsis\*-setup.exe" "deploy-hosting\" >nul 2>&1

REM 4. Copia documentacion util
copy /y "README.md" "deploy-hosting\" >nul 2>&1
copy /y "CHANGELOG.md" "deploy-hosting\" >nul 2>&1

echo.
echo   Listo. Archivos en: deploy-hosting\
dir /b "deploy-hosting"
echo.
