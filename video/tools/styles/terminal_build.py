#!/usr/bin/env python3
"""Build audio + timeline for a "terminal" style video (src/styles/terminal/<id>.json).

  python3 tools/styles/terminal_build.py search-terms

Writes:
  public/generated/<id>/mix.wav               voice + synthwave bed + new sound effects, -14 LUFS
  src/styles/terminal/<id>.timeline.json      scene/line/caption timing for the Remotion component

Everything is generated here: Kokoro voice, numpy music and sound effects (ours, no licences).
Needs: kokoro-onnx, numpy, soundfile, pyloudnorm (pip install pyloudnorm).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
import audio  # noqa: E402  (synth_line, _kokoro)

SR = 48000
FPS = 30
CPS = 34.0  # typing speed, characters per second
rng = np.random.default_rng(11)


# ───────────────────────────── helpers ─────────────────────────────

def resample(x: np.ndarray, sr_in: int) -> np.ndarray:
    if sr_in == SR:
        return x.astype(np.float32)
    n = int(len(x) * SR / sr_in)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def env(n, a, d, curve=5.0):
    t = np.arange(n) / SR
    e = np.exp(-t * curve / max(d, 1e-3))
    att = int(a * SR)
    if att > 0:
        e[:att] *= np.linspace(0, 1, att)
    return e


def lowpass(x, cutoff):
    # one-pole, fine for colour
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def lp_fast(x, cutoff):
    """FFT brick-ish lowpass for long signals."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x)).astype(np.float32)


def saw(f, n, detune=0.0):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for d in (-detune, 0, detune):
        ph = (t * f * (1 + d)) % 1.0
        out += 2 * ph - 1
    return out / 3


def sq(f, n):
    t = np.arange(n) / SR
    return np.sign(np.sin(2 * np.pi * f * t))


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(buf, clip, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(clip))
    buf[i:j] += clip[: j - i] * gain


# ─────────────────────────── sound effects ───────────────────────────
# A new set for this style: mechanical key clicks, CRT power-on, error buzz,
# success chirp, warning double-beep, scanline wipe.

def sfx_key():
    n = int(0.035 * SR)
    noise = rng.standard_normal(n)
    body = np.sin(2 * np.pi * rng.uniform(1800, 2600) * np.arange(n) / SR)
    x = (noise * 0.6 + body * 0.4) * env(n, 0.0005, 0.012)
    thock = np.sin(2 * np.pi * rng.uniform(160, 220) * np.arange(n) / SR) * env(n, 0.001, 0.02) * 0.5
    return (x + thock).astype(np.float32) * 0.5


def sfx_power_on():
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (70 - 30 * t) * t) * env(n, 0.002, 0.18)
    whine = np.sin(2 * np.pi * (6000 + 9000 * t) * t) * 0.04 * np.exp(-t * 3)
    hiss = lp_fast(rng.standard_normal(n).astype(np.float32), 3000) * env(n, 0.01, 0.4) * 0.25
    return (thump + whine + hiss).astype(np.float32) * 0.8


def sfx_buzz():
    n = int(0.42 * SR)
    x = sq(98, n) * 0.5 + sq(147, n) * 0.3
    x = lp_fast(x.astype(np.float32), 1600)
    gate = (np.floor(np.arange(n) / SR / 0.07) % 2 == 0) * 0.7 + 0.3
    return (x * gate * env(n, 0.003, 0.5, 3)).astype(np.float32) * 0.6


def sfx_ok():
    out = []
    for f, d in ((hz(84), 0.07), (hz(91), 0.16)):
        n = int(d * SR)
        t = np.arange(n) / SR
        out.append((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env(n, 0.002, d, 3))
    return np.concatenate(out).astype(np.float32) * 0.35


def sfx_warn():
    n = int(0.09 * SR)
    b = sq(hz(81), n) * env(n, 0.002, 0.09, 2) * 0.25
    gap = np.zeros(int(0.06 * SR))
    return lp_fast(np.concatenate([b, gap, b]).astype(np.float32), 4000)


def sfx_wipe():
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n).astype(np.float32)
    sweep = np.sin(2 * np.pi * (200 + 4000 * (t / t[-1]) ** 2) * t) * 0.15
    x = lp_fast(noise, 5000) * 0.35 + sweep
    return (x * np.sin(np.pi * t / t[-1])).astype(np.float32) * 0.5


def sfx_slam():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    k = np.sin(2 * np.pi * (110 * np.exp(-t * 18) + 45) * t) * env(n, 0.001, 0.35)
    crunch = lp_fast(rng.standard_normal(n).astype(np.float32), 2500) * env(n, 0.001, 0.08) * 0.5
    return (k + crunch).astype(np.float32) * 0.9


# ─────────────────────────────── music ───────────────────────────────

def synthwave(duration: float, bpm: float, seed: int, quiet_until: float):
    r = np.random.default_rng(seed)
    n = int(duration * SR)
    beat = 60 / bpm
    bar = beat * 4
    mix = np.zeros(n, dtype=np.float32)
    # i - VI - III - VII in A minor
    prog = [(57, [0, 3, 7]), (53, [0, 4, 7]), (60, [0, 4, 7]), (55, [0, 4, 7])]
    kick_n = int(0.3 * SR)
    tk = np.arange(kick_n) / SR
    kick = (np.sin(2 * np.pi * (50 + 90 * np.exp(-tk * 30)) * tk) * env(kick_n, 0.001, 0.25)).astype(np.float32)
    sn_n = int(0.25 * SR)
    snare = (lp_fast(r.standard_normal(sn_n).astype(np.float32), 7000) * env(sn_n, 0.001, 0.12)
             + np.sin(2 * np.pi * 190 * np.arange(sn_n) / SR) * env(sn_n, 0.001, 0.06) * 0.5).astype(np.float32)
    hat_n = int(0.05 * SR)
    hat = (np.diff(r.standard_normal(hat_n + 1)) * env(hat_n, 0.0005, 0.02)).astype(np.float32) * 0.25

    t = 0.0
    bi = 0
    while t < duration:
        root, chord = prog[bi % 4]
        bn = int(bar * SR)
        # pad: detuned saws, slow attack
        pad = np.zeros(bn)
        for iv in chord:
            pad += saw(hz(root + iv), bn, 0.004)
        pad = lp_fast(pad.astype(np.float32), 1400) * env(bn, 0.25, bar * 3, 1) * 0.10
        place(mix, pad, t)
        # bass: 8th-note octave pulse
        for e in range(8):
            m = root - 24 + (12 if e % 2 else 0)
            en = int(beat / 2 * SR)
            b = lp_fast(saw(hz(m), en, 0.002).astype(np.float32), 700) * env(en, 0.003, beat / 2, 2) * 0.22
            place(mix, b, t + e * beat / 2)
        # arp: 16ths over chord, enters after the hook
        if t >= quiet_until:
            for s in range(16):
                iv = chord[(s * 2 + (s // 4)) % 3] + (12 if s % 8 >= 4 else 0)
                en = int(beat / 4 * SR)
                a = sq(hz(root + 12 + iv), en) * env(en, 0.002, beat / 4, 4) * 0.035
                place(mix, lp_fast(a.astype(np.float32), 3500), t + s * beat / 4)
        # drums
        for q in range(4):
            bt = t + q * beat
            place(mix, kick, bt, 0.55)
            if q in (1, 3):
                place(mix, snare, bt, 0.28 if t >= quiet_until else 0.15)
            for h in range(2):
                place(mix, hat, bt + h * beat / 2, 1.0 if h else 0.6)
        t += bar
        bi += 1
    # simple stereo-ish echo on the whole bed
    d = int(beat * 0.75 * SR)
    mix[d:] += mix[:-d] * 0.18
    # fade out last 2 s
    fo = int(2.0 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo)
    return mix


# ───────────────────────────── timeline ─────────────────────────────

def clean(w: str) -> str:
    return re.sub(r"[^\w']", "", w).lower()


def resolve(at, words, scene_name):
    if isinstance(at, (int, float)):
        return float(at)
    m = re.match(r"@([\w']+)(?::(\d+))?([+-][\d.]+)?$", at)
    if not m:
        sys.exit(f"bad cue {at} in {scene_name}")
    target, nth, off = clean(m.group(1)), int(m.group(2) or 1), float(m.group(3) or 0)
    hits = [w for w in words if clean(w["text"]) == target]
    if len(hits) < nth:
        sys.exit(f"cue {at} not found in {scene_name}: {[w['text'] for w in words]}")
    return hits[nth - 1]["start"] + off


def captions_for(words, offset):
    words = [dict(w) for w in words]
    for i in range(len(words) - 2):  # captions show the URL, not how it is said
        if [clean(w["text"]) for w in words[i:i + 3]] == ["backsurge", "dot", "com"]:
            words[i]["text"], words[i]["end"] = "backsurge.com", words[i + 2]["end"]
            words[i + 1:i + 3] = []
            break
    caps, cur = [], []
    for w in words:
        cur.append(w)
        end_sentence = re.search(r"[.!?]$", w["text"])
        if end_sentence or len(cur) >= 12 or (re.search(r",$", w["text"]) and len(cur) >= 4):
            caps.append({"text": " ".join(x["text"] for x in cur), "start": round(cur[0]["start"] + offset, 3),
                         "end": round(cur[-1]["end"] + offset, 3)})
            cur = []
    if cur:
        caps.append({"text": " ".join(x["text"] for x in cur), "start": round(cur[0]["start"] + offset, 3),
                     "end": round(cur[-1]["end"] + offset, 3)})
    return caps


def main(vid: str):
    spec_path = ROOT / "src" / "styles" / "terminal" / f"{vid}.json"
    spec = json.loads(spec_path.read_text())
    v = spec["voice"]
    k = audio._kokoro()
    out_dir = ROOT / "public" / "generated" / vid
    out_dir.mkdir(parents=True, exist_ok=True)

    meter = pyln.Meter(SR)
    scenes, captions = [], []
    vo_track_parts = []
    t = 0.0
    for i, sc in enumerate(spec["scenes"]):
        vo, sr_in, words = audio.synth_line(k, sc["vo"], v["voice"], v["speed"], v["lang"])
        vo = resample(vo, sr_in)
        # trim leading silence so the hook speaks on frame 0
        win = int(0.01 * SR)
        rms = np.sqrt(np.convolve(vo**2, np.ones(win) / win, mode="same"))
        lead = int(np.argmax(rms > rms.max() * 0.05))
        lead = max(0, lead - int(0.02 * SR))
        vo = vo[lead:]
        shift = lead / SR
        for w in words:
            w["start"] = round(max(0.0, w["start"] - shift), 3)
            w["end"] = round(max(0.0, w["end"] - shift), 3)
        vo_dur = len(vo) / SR
        lines = []
        last = 0.0
        for ln in sc.get("lines", []):
            at = resolve(ln["at"], words, f"scene {i}")
            typed = 0.0 if ln.get("instant") or ln["kind"] in ("hook", "hookerr", "errbig", "okbig", "table", "row", "row1", "check") else len(ln["text"]) / CPS
            lines.append({**ln, "t": round(at, 3), "type": round(typed, 3)})
            last = max(last, at + typed)
        breath = 0.35 if i == 0 else 0.55
        dur = max(vo_dur + breath, sc.get("seconds", 0), last + 0.9)
        dur = round(dur * FPS) / FPS
        scenes.append({"start": round(t, 4), "dur": dur, "head": sc.get("head"), "end": sc.get("end", False), "lines": lines})
        captions += captions_for(words, t)
        vo_track_parts.append((t, vo))
        t += dur
    total = t

    # voice track at -16 LUFS
    vo_track = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for st, clip in vo_track_parts:
        place(vo_track, clip, st)
    loud = meter.integrated_loudness(vo_track[: int(total * SR)])
    vo_track *= 10 ** ((-16 - loud) / 20)

    # sound effects
    sfx = np.zeros_like(vo_track)
    place(sfx, sfx_power_on(), 0.0, 0.55)
    for si, sc in enumerate(scenes):
        if si > 0:
            place(sfx, sfx_wipe(), sc["start"] - 0.08, 0.6)
        for ln in sc["lines"]:
            at = sc["start"] + ln["t"]
            kind = ln["kind"]
            if ln["type"] > 0:
                nkeys = int(ln["type"] * CPS)
                for c in range(nkeys):
                    if ln["text"][c] == " " and rng.random() < 0.5:
                        continue
                    place(sfx, sfx_key(), at + c / CPS + rng.uniform(-0.006, 0.006), rng.uniform(0.18, 0.32))
            if kind in ("hookerr", "errbig"):
                place(sfx, sfx_slam(), at, 0.7)
                place(sfx, sfx_buzz(), at, 0.45)
            elif kind == "err":
                place(sfx, sfx_buzz(), at, 0.35)
            elif kind in ("ok", "okbig"):
                place(sfx, sfx_ok(), at + ln["type"], 0.8)
            elif kind == "warn":
                place(sfx, sfx_warn(), at, 0.9)
            elif kind in ("row", "row1", "table", "check"):
                place(sfx, sfx_key(), at, 0.5)
                place(sfx, sfx_key(), at + 0.03, 0.4)
        if sc["end"]:
            place(sfx, sfx_slam(), sc["start"] + 0.05, 0.5)

    # music, ducked under the voice
    mus = synthwave(len(vo_track) / SR, spec["music"]["bpm"], spec["music"]["seed"], quiet_until=scenes[0]["dur"])
    mus = mus[: len(vo_track)]
    lm = meter.integrated_loudness(mus[: int(total * SR)])
    mus *= 10 ** ((-27 - lm) / 20)
    win = int(0.05 * SR)
    vo_env = np.sqrt(np.convolve(vo_track**2, np.ones(win) / win, mode="same"))
    duck_target = np.where(vo_env > 0.01, 0.55, 1.0)
    # smooth the duck (attack/release ~150 ms)
    sm = int(0.15 * SR)
    duck = np.convolve(duck_target, np.ones(sm) / sm, mode="same").astype(np.float32)
    end_start = next((s["start"] for s in scenes if s["end"]), total)
    lift = np.ones_like(duck)
    lift[int(end_start * SR):] = 1.6  # music swells under the end card
    mix = vo_track + mus * duck * lift + sfx * 0.5
    mix = mix[: int(total * SR)]

    # master: -14 LUFS, then a soft limiter under -1.5 dBFS
    lmix = meter.integrated_loudness(mix)
    mix *= 10 ** ((-14 - lmix) / 20)
    ceiling = 10 ** (-1.5 / 20)
    over = np.abs(mix) > ceiling * 0.8
    knee = ceiling * 0.8
    mix = np.where(over, np.sign(mix) * (knee + (ceiling - knee) * np.tanh((np.abs(mix) - knee) / (ceiling - knee))), mix)
    final_l = meter.integrated_loudness(mix)
    stereo = np.stack([mix, mix], axis=1)
    sf.write(out_dir / "mix.wav", stereo, SR, subtype="PCM_16")

    timeline = {
        "id": vid, "title": spec["title"], "format": spec["format"], "fps": FPS,
        "durationInFrames": int(round(total * FPS)), "audio": f"generated/{vid}/mix.wav",
        "scenes": scenes, "captions": captions,
    }
    (ROOT / "src" / "styles" / "terminal" / f"{vid}.timeline.json").write_text(json.dumps(timeline, indent=1))
    print(f"{vid}: {total:.2f}s, {len(scenes)} scenes, mix {final_l:.1f} LUFS, peak {20*np.log10(np.abs(mix).max()):.2f} dBFS")


if __name__ == "__main__":
    main(sys.argv[1])
