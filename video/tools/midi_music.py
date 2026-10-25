#!/usr/bin/env python3
"""Background music written as MIDI, timed to a video, rendered with FluidSynth.

    python3 tools/midi_music.py <cue-sheet.json> <out-dir>

A cue sheet says how long the video is and where its sections start:

    {
      "duration": 27.0,
      "style": "drive",                       # drive | chill | pulse
      "seed": 1,                              # different seed, different variation
      "sections": [                           # seconds; each runs until the next
        {"at": 0,     "part": "intro"},       # sparse: pad + hits
        {"at": 2.0,   "part": "build"},       # pad, arp, hats, kick on 1 and 3
        {"at": 8.5,   "part": "lift"},        # adds snare roll into the drop
        {"at": 13.03, "part": "drop"},        # full beat, crash on the downbeat
        {"at": 19.5,  "part": "break"},       # half-time, lighter
        {"at": 23.0,  "part": "outro"}        # big chord, then rings out
      ],                                      # "silence": nothing (for awkward pauses)
      "hits": [0.1, 0.67]                     # extra accents (crash + low hit)
    }

The tempo and a start offset are chosen (within the style's range) so section
starts land on beats, and the drop and outro on bar lines. Writes music.mid (open it in any DAW to swap
instruments) and music.wav (FluidSynth + a General MIDI SoundFont, loudness
normalised). All notes are generated here, so the music is ours: no licences,
nothing for Content ID to match.
"""

from __future__ import annotations

import json
import math
import random
import shutil
import subprocess
import sys
from pathlib import Path

STYLES = {
    # bpm range, key root (MIDI), minor?, progression (scale degrees as semitones from root)
    "drive": dict(bpm=(108, 126), root=57, minor=True, prog=[0, -4, 3, -2], pad=89, bass=38, keys=4, lead=81),
    "pulse": dict(bpm=(118, 132), root=52, minor=True, prog=[0, 0, 3, -2], pad=90, bass=39, keys=5, lead=81),
    "chill": dict(bpm=(80, 96), root=53, minor=False, prog=[0, 4, -3, 5], pad=88, bass=33, keys=4, lead=11),
    # Mockumentary comedy: pizzicato strings, bassoon, marimba, glockenspiel, light kit.
    "quirky": dict(bpm=(100, 114), root=55, minor=False, prog=[0, 5, -3, 7], pad=45, bass=70, keys=12, lead=9, quirky=True),
}

SOUNDFONTS = [
    str(Path.home() / ".cache/backsurge-video/soundfont.sf2"),
    "/usr/share/sounds/sf2/FluidR3_GM.sf2",
    "/usr/share/soundfonts/FluidR3_GM.sf2",
    "/usr/share/sounds/sf2/default-GM.sf2",
    "/opt/homebrew/share/soundfonts/default.sf2",
    "/usr/local/share/soundfonts/default.sf2",
]

KICK, SNARE, CLAP, HAT, OHAT, CRASH, TOM = 36, 38, 39, 42, 46, 49, 45


def pick_tempo(lo: float, hi: float, sections: list[dict], hits: list[float]) -> tuple[float, float]:
    """Tempo and start offset (music starts mid-bar) so drop/outro land on bar
    lines and other sections and hits on beats."""
    best, best_err = (lo, 0.0), 1e9
    bpm = lo
    while bpm <= hi:
        beat = 60 / bpm
        bar = beat * 4
        steps = 64
        for k in range(steps):
            off = bar * k / steps
            err = 0.0
            for s in sections[1:]:
                strong = s["part"] in ("drop", "outro")
                unit = bar if strong else beat
                d = ((s["at"] + off) / unit) % 1
                err += min(d, 1 - d) * unit * (4 if strong else 1)
            for h in hits:
                d = ((h + off) / (beat / 2)) % 1
                err += min(d, 1 - d) * beat * 0.3
            if err < best_err:
                best, best_err = (round(bpm, 2), round(off, 4)), err
        bpm += 0.1
    return best


def compose(cue: dict):
    import pretty_midi

    st = STYLES[cue.get("style", "drive")]
    rnd = random.Random(cue.get("seed", 1))
    sections = sorted(cue["sections"], key=lambda s: s["at"])
    hits = cue.get("hits", [])
    duration = float(cue["duration"])
    bpm, off = (cue["bpm"], cue.get("offset", 0.0)) if cue.get("bpm") else pick_tempo(*st["bpm"], sections, hits)
    beat = 60 / bpm
    bar = beat * 4

    pm = pretty_midi.PrettyMIDI(initial_tempo=bpm)
    inst = lambda prog, drum=False, name="": pretty_midi.Instrument(program=prog, is_drum=drum, name=name)
    drums, bass, pad, keys, lead = inst(0, True, "drums"), inst(st["bass"], name="bass"), inst(st["pad"], name="pad"), inst(st["keys"], name="keys"), inst(st["lead"], name="lead")
    pm.instruments += [drums, bass, pad, keys, lead]

    def note(track, pitch, t, length, vel):
        if t >= duration:
            return
        vel = max(1, min(127, int(vel)))
        track.notes.append(pretty_midi.Note(velocity=vel, pitch=int(pitch), start=t, end=min(duration + 1.5, t + length)))

    third = 3 if st["minor"] else 4
    root = st["root"]

    def part_at(t):
        cur = sections[0]["part"]
        for s in sections:
            if t + 1e-6 >= s["at"]:
                cur = s["part"]
        return cur

    def next_section_time(t):
        later = [s["at"] for s in sections if s["at"] > t + 1e-6]
        return later[0] if later else duration

    penta = [0, 2, 4, 7, 9]
    motif = [rnd.choice([None, 0, 1, 2, 3, 4, 2, 4]) for _ in range(8)]
    motif[0] = 0

    def quirky_beat(t, b, pos, part, chord_root, chord, bar_i):
        e = beat / 2
        low = chord_root - 24
        if part in ("intro", "build", "lift", "drop", "break"):
            # Bassoon: root on 1, fifth on 3, staccato.
            if pos in (0, 2):
                note(bass, low + (7 if pos == 2 else 0) + 12, t, e * 0.8, 74 if part != "drop" else 88)
            # Pizzicato chord on the off-beats.
            if pos in (1, 3) or part == "lift":
                for p in chord:
                    note(pad, p, t + (e if part == "lift" and pos in (0, 2) else 0), e * 0.6, 56 if part != "drop" else 70)
        if part in ("build", "drop", "break"):
            # Marimba / glock motif, repeated every two bars.
            for k in range(2):
                m = motif[(pos * 2 + k + (bar_i % 2) * 4) % 8]
                if m is None or (part == "break" and k):
                    continue
                p = chord_root + 12 + penta[m]
                note(keys, p, t + k * e, e * 0.9, 60 if part == "build" else 76)
                if part == "drop":
                    note(lead, p + 12, t + k * e, e * 0.9, 58)
        if part == "lift":
            # Chaos: marimba running sixteenths up and down.
            for k in range(4):
                i = (b * 4 + k) % 8
                p = chord_root + 12 + penta[i if i < 5 else 8 - i]
                note(keys, p, t + k * beat / 4, beat * 0.22, 70)
            note(drums, 76 if pos % 2 else 77, t, 0.05, 70)
            note(drums, HAT, t + e, 0.03, 50)
        if part == "drop":
            if pos in (0, 2):
                note(drums, KICK, t, 0.1, 92)
            if pos in (1, 3):
                note(drums, 37, t, 0.08, 78)  # side stick
            note(drums, HAT, t, 0.03, 40)
            note(drums, HAT, t + e, 0.03, 54)

    # Bars start at 0; sections switch on the beat they land on.
    n_beats = int(math.ceil((duration + off) / beat)) + 1
    arp_shape = rnd.choice([[0, 2, 1, 3], [0, 1, 2, 3], [0, 2, 3, 1]])
    for b in range(n_beats):
        t = b * beat - off  # video time of this beat
        if t >= duration:
            break
        if t < -1e-6:
            continue
        part = part_at(t)
        if part == "silence":
            continue
        bar_i = int((t + off) // bar)
        deg = st["prog"][bar_i % len(st["prog"])]
        chord_root = root + deg
        chord = [chord_root, chord_root + third, chord_root + 7]
        pos = b % 4  # beat in bar
        if st.get("quirky"):
            quirky_beat(t, b, pos, part, chord_root, chord, bar_i)
            continue
        loud = {"intro": 0.55, "build": 0.7, "lift": 0.85, "drop": 1.0, "break": 0.7, "outro": 0.8}[part]

        # Pad: one chord per bar (held), except in the outro where it rings.
        if pos == 0 and part != "outro":
            for p in chord + [chord_root + 12]:
                note(pad, p, t, bar * 0.98, 52 * loud)

        # Bass
        if part in ("build", "lift"):
            if pos in (0, 2):
                note(bass, chord_root - 24, t, beat * 1.8, 80 * loud)
        elif part == "drop":
            for k in range(2):
                p = chord_root - 24 + (12 if (b * 2 + k) % 4 == 3 else 0)
                note(bass, p, t + k * beat / 2, beat * 0.45, 96)
        elif part == "break" and pos == 0:
            note(bass, chord_root - 24, t, bar * 0.9, 76)

        # Arp / keys
        if part in ("build", "lift", "drop"):
            tones = [chord_root + 12, chord_root + 12 + third, chord_root + 19, chord_root + 24]
            for k in range(2):
                p = tones[arp_shape[(b * 2 + k) % 4]]
                note(lead, p, t + k * beat / 2, beat * 0.35, (58 if part == "build" else 66) * loud)
        if part == "break" and pos in (1, 3):
            for p in chord:
                note(keys, p + 12, t, beat * 0.4, 62)

        # Drums
        if part == "build":
            if pos in (0, 2):
                note(drums, KICK, t, 0.1, 90)
            note(drums, HAT, t + beat / 2, 0.05, 50)
        elif part == "lift":
            note(drums, KICK, t, 0.1, 96)
            note(drums, HAT, t, 0.05, 48)
            note(drums, HAT, t + beat / 2, 0.05, 58)
            if pos in (1, 3):
                note(drums, CLAP, t, 0.1, 80)
            # Snare roll in the last bar before the drop
            nxt = next_section_time(t)
            if nxt - t <= bar + 1e-6:
                steps = 4 if nxt - t > beat * 2 else 8
                for k in range(steps // 2):
                    tt = t + k * beat / (steps // 2)
                    note(drums, SNARE, tt, 0.05, 50 + 70 * (1 - (nxt - tt) / bar))
        elif part == "drop":
            note(drums, KICK, t, 0.1, 112)
            note(drums, OHAT, t + beat / 2, 0.08, 64)
            if pos in (1, 3):
                note(drums, CLAP, t, 0.1, 100)
                note(drums, SNARE, t, 0.1, 70)
            for k in range(4):
                note(drums, HAT, t + k * beat / 4, 0.03, 36 + 14 * (k % 2 == 0))
        elif part == "break":
            if pos == 0:
                note(drums, KICK, t, 0.1, 96)
            if pos == 2:
                note(drums, CLAP, t, 0.1, 82)
            note(drums, HAT, t + beat / 2, 0.05, 44)

    # Section entrances: crash + low hit on drop and outro, a tom fill before the break.
    for s in sections:
        t = s["at"]
        if s["part"] in ("drop", "outro"):
            note(drums, CRASH, t, 1.5, 110)
            note(drums, KICK, t, 0.2, 120)
        if s["part"] == "outro":
            # Big final chord that rings out.
            deg = st["prog"][int((t + off) // bar) % len(st["prog"])]
            cr = root + deg
            ring = next_section_time(t) - t
            for p in [cr - 12, cr, cr + third, cr + 7, cr + 12]:
                note(pad, p, t, ring if st.get("quirky") else duration - t + 1.5, 70)
                note(keys, p + 12, t, 1.2, 84)
            note(bass, cr - 24 + (12 if st.get("quirky") else 0), t, ring if st.get("quirky") else duration - t, 92)
        if s["part"] == "break" and not st.get("quirky"):
            for k, tom in enumerate([50, 47, 45, 43]):
                note(drums, tom, t - beat + k * beat / 4, 0.1, 70 + k * 8)
    for h in hits:
        note(drums, CRASH, h, 1.2, 96)
        note(drums, KICK, h, 0.2, 110)
        note(bass, root - 24, h, beat, 100)

    return pm, bpm, off


def render(pm, out_dir: Path, duration: float) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    mid = out_dir / "music.mid"
    pm.write(str(mid))
    sf = next((p for p in SOUNDFONTS if Path(p).exists()), None)
    wav = out_dir / "music.wav"
    raw = out_dir / "music.raw.wav"
    if sf and shutil.which("fluidsynth"):
        subprocess.run(["fluidsynth", "-ni", "-g", "0.6", "-r", "44100", "-F", str(raw), sf, str(mid)], check=True, capture_output=True)
    else:
        # Fallback: our own synth plays the MIDI (no SoundFont needed). Simpler sound.
        import numpy as np
        import soundfile as sfile

        sr = 44100
        audio = pm.synthesize(fs=sr)
        sfile.write(str(raw), np.stack([audio, audio], axis=1) * 0.3, sr)
    # Trim to the video, fade the tail, normalise loudness for a music bed.
    fade = 1.2
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-t", f"{duration:.3f}",
         "-af", f"afade=t=out:st={max(0, duration - fade):.3f}:d={fade},loudnorm=I=-18:TP=-2:LRA=9",
         "-ar", "44100", "-ac", "2", str(wav)],
        check=True,
    )
    raw.unlink(missing_ok=True)
    return wav


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    cue = json.loads(Path(sys.argv[1]).read_text())
    pm, bpm, off = compose(cue)
    wav = render(pm, Path(sys.argv[2]), float(cue["duration"]))
    print(f"{wav}  ({cue.get('style', 'drive')}, {bpm} bpm, starts {off:.2f}s into a bar, {cue['duration']}s)")
