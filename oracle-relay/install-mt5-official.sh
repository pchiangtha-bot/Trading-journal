#!/usr/bin/env sh
set -eu

if [ -z "${DISPLAY:-}" ]; then
  echo "Open the VNC desktop first, then run this script from a terminal inside VNC."
  echo "Expected DISPLAY like :1."
  exit 1
fi

cd "$HOME"
echo "Downloading official MetaTrader 5 Linux installer..."
wget -O mt5linux.sh https://download.terminal.free/cdn/web/metaquotes.software.corp/mt5/mt5linux.sh
chmod +x mt5linux.sh

echo "Starting official MT5 installer..."
./mt5linux.sh

echo
echo "When installation is complete, log in to Pepperstone MT5 and attach the bridge EA."

