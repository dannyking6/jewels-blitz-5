#!/usr/bin/env bash
cd "$(dirname "$0")"
PORT="${1:-8802}"
echo "Jewels Blitz 5 -> http://localhost:${PORT}"
python3 -m http.server "$PORT" --bind 0.0.0.0
