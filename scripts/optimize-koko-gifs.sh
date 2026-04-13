#!/usr/bin/env bash
# optimize-koko-gifs.sh
# Converts raw Koko GIFs (22-25 MB each) to optimized WebP + GIF for web use.
# Run once after adding new animations.
#
# Requirements (install either):
#   brew install ffmpeg gifsicle   (macOS)
#   apt install ffmpeg gifsicle    (Linux)
#   winget install ffmpeg          (Windows — then use Git Bash to run this script)
#
# Usage:
#   bash scripts/optimize-koko-gifs.sh

set -e

SRC="$(dirname "$0")/../../Kokoanimation"
OUT="$(dirname "$0")/../public"

declare -A MAP=(
  ["Kotoka_igle_gif.gif"]="koko-idle"
  ["Kotoka_waving.gif"]="koko-waving"
  ["Kotoka_Thinking_gif.gif"]="koko-thinking"
  ["Kotoka_celebrate_gif.gif"]="koko-celebrate"
  ["Kotoka_encourage_gif.gif"]="koko-encourage"
  ["Kotoka_excited.gif"]="koko-excited"
)

HAS_FFMPEG=false
HAS_GIFSICLE=false
command -v ffmpeg &>/dev/null && HAS_FFMPEG=true
command -v gifsicle &>/dev/null && HAS_GIFSICLE=true

if ! $HAS_FFMPEG && ! $HAS_GIFSICLE; then
  echo "ERROR: Neither ffmpeg nor gifsicle found. Install one of them first."
  exit 1
fi

for src_name in "${!MAP[@]}"; do
  base="${MAP[$src_name]}"
  src_path="$SRC/$src_name"

  if [ ! -f "$src_path" ]; then
    echo "SKIP: $src_path not found"
    continue
  fi

  echo "Processing $src_name → $base..."

  if $HAS_FFMPEG; then
    # Animated WebP (~90% smaller than GIF)
    ffmpeg -i "$src_path" -vf "scale=300:-1:flags=lanczos" \
      -loop 0 -q:v 70 "$OUT/${base}.webp" -y -loglevel error
    echo "  ✓ ${base}.webp"
  fi

  if $HAS_GIFSICLE; then
    # Optimized GIF fallback (lossy, 128 colors, 300px wide)
    gifsicle --lossy=80 --colors=128 --resize-width 300 \
      --optimize=3 "$src_path" -o "$OUT/${base}.gif"
    echo "  ✓ ${base}.gif (optimized)"
  else
    # Plain copy if no gifsicle
    cp "$src_path" "$OUT/${base}.gif"
    echo "  ✓ ${base}.gif (copied — run with gifsicle for optimization)"
  fi
done

echo ""
echo "Done. Files written to $OUT"
echo "Sizes:"
ls -lh "$OUT"/koko-*.gif "$OUT"/koko-*.webp 2>/dev/null | awk '{print $5, $9}'
