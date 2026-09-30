#!/bin/sh
# Copies the Pages site files (repo root) into public/ so the Worker preview and
# `wrangler deploy` always ship the same content. Run before deploying: pnpm deploy does this.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cp "$ROOT/index.html" "$ROOT/style.css" "$ROOT/app.js" "$ROOT/_headers" "$ROOT/CNAME" "$ROOT/public/"
cp "$ROOT/media/poster.jpg" "$ROOT/media/teaser.mp4" "$ROOT/media/workflow.mp4" "$ROOT/public/media/"
echo "public/ synced from root site files."
