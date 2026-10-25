#!/usr/bin/env python3
"""Warn about "@word" cues that don't appear in the scene's voiceover.
   python3 tools/check-cues.py [video-id ...]"""
import json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
ids = sys.argv[1:] or [p.stem for p in (ROOT / "videos").glob("*.json")]
bad = 0
for vid in sorted(ids):
    script = json.loads((ROOT / "videos" / f"{vid}.json").read_text())
    def cues(x):
        if isinstance(x, dict):
            for v in x.values(): yield from cues(v)
        elif isinstance(x, list):
            for v in x: yield from cues(v)
        elif isinstance(x, str) and x.startswith("@"):
            yield x
    for i, sc in enumerate(script["scenes"]):
        words = [norm(w) for w in (sc.get("vo") or "").split()]
        for c in cues({k: v for k, v in sc.items() if k != "vo"}):
            m = re.match(r"^@([^:+\-]+)(?::(\d+))?", c)
            if not m or words.count(norm(m.group(1))) < int(m.group(2) or 1):
                print(f"{vid} scene {i}: cue {c} not found in its voiceover"); bad += 1
print("cues ok" if not bad else f"{bad} cue problem(s)")

# Hook lines land when their first word is spoken: check they appear in order.
for vid in sorted(ids):
    script = json.loads((ROOT / "videos" / f"{vid}.json").read_text())
    for i, sc in enumerate(script["scenes"]):
        if sc["type"] != "hook" or not sc.get("vo"):
            continue
        words = [norm(w) for w in sc["vo"].split()]
        pos = -1
        for line in sc["lines"]:
            first = norm(line.split()[0])
            nxt = next((j for j in range(pos + 1, len(words)) if words[j] == first), None)
            if nxt is None or (pos == -1 and nxt > 3):
                print(f"{vid} scene {i}: hook line \"{line}\" won't land on time (\"{line.split()[0]}\" not spoken {'early' if nxt else 'at all'})")
                bad += 1
            pos = nxt if nxt is not None else pos
print("hooks ok" if not bad else f"{bad} problem(s) total")
