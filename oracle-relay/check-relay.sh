#!/usr/bin/env sh
set -eu

echo "Architecture:"
uname -m

echo
echo "VNC sessions:"
vncserver -list || true

echo
echo "MT5/Wine processes:"
pgrep -af "terminal64.exe|terminal.exe|MetaTrader|wine" || true

echo
echo "Supabase webhook OPTIONS check:"
curl -i -X OPTIONS https://lzaetartgfejsnwpiezc.supabase.co/functions/v1/mt5-closed-order || true

