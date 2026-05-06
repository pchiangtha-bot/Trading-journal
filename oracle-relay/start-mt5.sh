#!/usr/bin/env sh
set -eu

TERMINAL_PATH="${MT5_TERMINAL_PATH:-}"

if [ -z "$TERMINAL_PATH" ]; then
  TERMINAL_PATH="$(find "$HOME" -type f \( -iname "terminal64.exe" -o -iname "terminal.exe" \) 2>/dev/null | grep -i "MetaTrader" | head -n 1 || true)"
fi

if [ -z "$TERMINAL_PATH" ] || [ ! -f "$TERMINAL_PATH" ]; then
  echo "Could not find terminal64.exe."
  echo "Install MT5 first with ./install-mt5-official.sh inside VNC."
  echo "If your path is custom, set MT5_TERMINAL_PATH before running this script."
  exit 1
fi

if [ -z "${DISPLAY:-}" ]; then
  export DISPLAY=:1
fi

export WINEDEBUG="${WINEDEBUG:--all}"

echo "Starting MT5:"
echo "  $TERMINAL_PATH"
exec wine "$TERMINAL_PATH"

