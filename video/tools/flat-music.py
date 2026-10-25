#!/usr/bin/env python3
"""Music cue sheets for the hand-built kid Shorts, from the beat lengths in
src/flat/clips.tsx (so the music follows any retiming). Called by make.mjs.

    python3 tools/flat-music.py [id ...]
"""
import json
import re
import sys
from pathlib import Path

CLIPS = Path(__file__).resolve().parent.parent / "src/flat/clips.tsx"
# clip id -> (beat list name, seed, [(beat id, music part)])
SHEETS = {
    "did-it-work": ("A", 1, [("hook1", "intro"), ("title", "build"), ("wait", "silence"), ("reveal", "drop"), ("end", "outro")]),
    "which-videos": ("B", 2, [("hook1", "intro"), ("hook3", "silence"), ("map", "build"), ("gemfix", "drop"), ("under", "break"), ("end", "outro")]),
    "change-history": ("C", 5, [("hook1", "intro"), ("tweak", "build"), ("weeks", "silence"), ("spot", "drop"), ("end", "outro")]),
    "views-stuck": ("D", 9, [("hook1", "intro"), ("hook2", "silence"), ("check", "build"), ("impfix", "drop"), ("one", "break"), ("end", "outro")]),
}


def beats(src: str, name: str):
    a = src.index(f"const {name}: Beat[] = [")
    seg = src[a : src.index("];", a)]
    return [(m.group(1), int(m.group(2))) for m in re.finditer(r"\{ id: '([^']+)',[^\n]*?len: (\d+)", seg)]


def main(ids):
    src = CLIPS.read_text()
    for cid in ids or SHEETS:
        if cid not in SHEETS:
            continue
        name, seed, parts = SHEETS[cid]
        start, t = {}, 0
        for bid, ln in beats(src, name):
            start[bid] = t
            t += ln
        cue = {"duration": round(t / 30, 3), "style": "quirky", "seed": seed, "sections": [{"at": round(start[b] / 30, 2), "part": p} for b, p in parts], "hits": []}
        out = CLIPS.parent.parent.parent / "music" / f"{cid}.json"
        text = json.dumps(cue, indent=2) + "\n"
        if not out.exists() or out.read_text() != text:
            out.write_text(text)
            print(f"music/{cid}.json  ({cue['duration']} s)")


if __name__ == "__main__":
    main(sys.argv[1:])
