#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
EA_SOURCE="$SCRIPT_DIR/FxEdgeClosedOrderBridge.mq5"

if [ ! -f "$EA_SOURCE" ]; then
  echo "Missing $EA_SOURCE"
  echo "Copy mt5/FxEdgeClosedOrderBridge.mq5 from the project into this oracle-relay folder first."
  exit 1
fi

EXPERTS_DIR="$(find "$HOME" -type d -path "*/MQL5/Experts" 2>/dev/null | head -n 1 || true)"

if [ -z "$EXPERTS_DIR" ]; then
  echo "Could not find an MQL5/Experts folder yet."
  echo "Install and open MT5 once, then run this script again."
  exit 1
fi

cp "$EA_SOURCE" "$EXPERTS_DIR/FxEdgeClosedOrderBridge.mq5"

echo "Copied EA to:"
echo "  $EXPERTS_DIR/FxEdgeClosedOrderBridge.mq5"
echo "Now open MetaEditor, compile FxEdgeClosedOrderBridge.mq5, and attach it to one MT5 chart."

