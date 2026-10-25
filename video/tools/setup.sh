#!/usr/bin/env bash
# One-time setup for video. Safe to re-run: every step checks first.
#   npm run setup
set -euo pipefail
cd "$(dirname "$0")/.."
say() { printf '\n▶ %s\n' "$*"; }
PY=${PYTHON:-python3}
PIP_FLAGS=""; $PY -c 'import sys; sys.exit(0 if sys.prefix != sys.base_prefix else 1)' || PIP_FLAGS="--break-system-packages"

say "Node packages"
npm install --no-audit --no-fund

say "Python packages + voice model (Kokoro, ~350 MB, cached in ~/.cache)"
$PY -m pip install -q $PIP_FLAGS kokoro-onnx soundfile numpy pretty_midi
$PY tools/audio.py setup

say "Sound effects + music beds"
[ -f public/sfx/whoosh.wav ] || $PY tools/audio.py sfx
[ -f public/music/drive.wav ] || $PY tools/audio.py music

say "FluidSynth + General MIDI SoundFont (for generated music)"
if ! command -v fluidsynth >/dev/null; then
  if command -v brew >/dev/null; then brew install fluid-synth || true
  elif command -v apt-get >/dev/null; then (sudo -n true 2>/dev/null && S=sudo || S=""; $S apt-get update -q && $S apt-get install -y -q fluidsynth fluid-soundfont-gm) || true
  fi
fi
SF=""; for f in "$HOME/.cache/backsurge-video/soundfont.sf2" /usr/share/sounds/sf2/FluidR3_GM.sf2 /usr/share/soundfonts/FluidR3_GM.sf2 /usr/share/sounds/sf2/default-GM.sf2 /opt/homebrew/share/soundfonts/default.sf2 /usr/local/share/soundfonts/default.sf2; do [ -f "$f" ] && SF="$f" && break; done
[ -n "$SF" ] && echo "  SoundFont: $SF"
if [ -z "$SF" ]; then
  echo "  No SoundFont found. Music will use the built-in synth (plainer sound)."
  echo "  For better sound, put any General MIDI .sf2 at ~/.cache/backsurge-video/soundfont.sf2"
fi
command -v fluidsynth >/dev/null && echo "  fluidsynth: $(command -v fluidsynth)" || echo "  fluidsynth not installed: music falls back to the built-in synth."

say "Headless Chrome for rendering"
if npx remotion browser ensure >/dev/null 2>&1; then
  echo "  Remotion's browser is ready."; rm -f .chrome-path
else
  # Locked-down machines (e.g. Claude's cloud workspace): get Chromium from npm instead.
  D="$HOME/.cache/backsurge-video/chromium"; mkdir -p "$D"
  (cd "$D" && [ -f package.json ] || npm init -y >/dev/null; cd "$D" && npm i -s @sparticuz/chromium@153 >/dev/null)
  P=$(cd "$D" && node -e "import('@sparticuz/chromium').then(async m=>console.log(await m.default.executablePath()))")
  echo "$P" > .chrome-path; echo "  Using $P"
fi

say "Done. Try: npm run make -- launch"
