@echo off
setlocal EnableExtensions
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

set "MT5_PATH=%~1"
if defined MT5_PATH (
  if not exist "%MT5_PATH%" (
    echo The provided MT5 path was not found:
    echo   %MT5_PATH%
    echo.
    goto :not_found
  )
  goto :register
)

call :try_path "%ProgramFiles%\MetaTrader 5\terminal64.exe"
call :try_path "%ProgramFiles%\MetaTrader 5 Terminal\terminal64.exe"
call :try_path "%ProgramFiles%\Pepperstone MetaTrader 5\terminal64.exe"
call :try_path "%ProgramFiles%\Pepperstone MetaTrader 5 Terminal\terminal64.exe"
call :try_path "%ProgramFiles%\Pepperstone MT5\terminal64.exe"
call :try_path "%LOCALAPPDATA%\Programs\MetaTrader 5\terminal64.exe"

set "PF86=%ProgramFiles(x86)%"
if defined PF86 (
  call :try_path "%PF86%\MetaTrader 5\terminal64.exe"
  call :try_path "%PF86%\MetaTrader 5 Terminal\terminal64.exe"
  call :try_path "%PF86%\Pepperstone MetaTrader 5\terminal64.exe"
  call :try_path "%PF86%\Pepperstone MetaTrader 5 Terminal\terminal64.exe"
  call :try_path "%PF86%\Pepperstone MT5\terminal64.exe"
)

if not defined MT5_PATH goto :not_found

:register
echo Found MT5:
echo   %MT5_PATH%
echo.

reg add "HKCU\Software\Classes\fxedge-mt5" /ve /d "URL:FX Edge MT5 Protocol" /f >nul
if errorlevel 1 goto :failed
reg add "HKCU\Software\Classes\fxedge-mt5" /v "URL Protocol" /t REG_SZ /d "" /f >nul
if errorlevel 1 goto :failed
reg add "HKCU\Software\Classes\fxedge-mt5\DefaultIcon" /ve /d "\"%MT5_PATH%\"" /f >nul
if errorlevel 1 goto :failed
reg add "HKCU\Software\Classes\fxedge-mt5\shell\open\command" /ve /d "\"%MT5_PATH%\"" /f >nul
if errorlevel 1 goto :failed

echo Setup finished.
echo Return to FX Edge Journal, click "I Already Installed", then click the MT5 icon.
echo.
pause
exit /b 0

:not_found
echo MT5 terminal64.exe was not found automatically.
echo.
echo To finish setup:
echo   1. Find terminal64.exe from your MetaTrader 5 desktop shortcut.
echo   2. Drag terminal64.exe onto this setup file.
echo      OR run this from Command Prompt:
echo      install-fxedge-mt5-protocol.bat "C:\Path\To\terminal64.exe"
echo.
pause
exit /b 1

:failed
echo Setup could not write the Windows protocol registry key.
echo Try running this setup again, or ask Windows security to allow it.
echo.
pause
exit /b 1

:try_path
if not defined MT5_PATH if exist "%~1" set "MT5_PATH=%~1"
exit /b 0
