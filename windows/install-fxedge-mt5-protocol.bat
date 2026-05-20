@echo off
setlocal
title FX Edge MT5 Desktop Setup

echo.
echo ==========================================
echo   FX Edge Journal - MT5 Desktop Setup
echo ==========================================
echo.
echo This one-time setup lets the website open your local MetaTrader 5 app
echo when you click the MT5 icon in Market Tools.
echo.
echo It registers this local Windows link:
echo   fxedge-mt5://open
echo.

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%register-fxedge-mt5-protocol.ps1"

if not exist "%PS_SCRIPT%" (
  echo Could not find:
  echo   %PS_SCRIPT%
  echo.
  echo Keep this installer in the same windows folder as register-fxedge-mt5-protocol.ps1.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
set "SETUP_RESULT=%ERRORLEVEL%"

echo.
if "%SETUP_RESULT%"=="0" (
  echo Setup finished. Return to FX Edge Journal and click "I Already Installed".
) else (
  echo Setup did not finish. If MT5 is installed in a custom folder, run:
  echo powershell -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -Mt5Path "C:\Path\To\terminal64.exe"
)
echo.
pause
exit /b %SETUP_RESULT%
