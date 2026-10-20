#!/bin/sh
# Package only public website assets; originals and review documents stay in the repository.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/dist/site"
rm -rf "$DEST"
mkdir -p "$DEST/assets" "$DEST/media"
cp "$ROOT/assets/index.html" "$ROOT/style.css" "$ROOT/_headers" "$ROOT/CNAME" "$ROOT/robots.txt" "$ROOT/sitemap.xml" "$DEST/"
cp "$ROOT"/assets/*.js "$DEST/assets/"
for file in character-short.mp4 reel-poster.jpg system-poster.webp rigel-dashboard.jpg rigel-stock.jpg rigel-assistant.jpg favicon.svg social-card.png; do
  cp "$ROOT/media/$file" "$DEST/media/"
done
printf 'Static artifact built in dist/site.\n'
