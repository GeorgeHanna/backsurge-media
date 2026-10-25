#!/usr/bin/env python3
"""Backsurge video audio: voiceover (Kokoro TTS), sound effects and music.

Everything here is free and open source, and everything we generate is ours:
  - Voice: Kokoro-82M (Apache-2.0) through kokoro-onnx (MIT). Runs on CPU.
  - Sound effects and music: synthesised from scratch with numpy. No samples,
    no licences to track.

Usage (from video/):
  python3 tools/audio.py setup             # pip deps + download the voice model (~350 MB, once)
  python3 tools/audio.py sfx               # write public/sfx/*.wav
  python3 tools/audio.py music             # write public/music/*.wav
  python3 tools/audio.py voice <video-id>  # TTS for videos/<id>.json -> public/generated/<id>/
  python3 tools/audio.py voices            # list available voices
  python3 tools/audio.py import <id> [dir]  # YOUR recordings (recordings/<id>/01.wav …) -> public/generated/<id>/

`npm run prepare-video -- <id>` calls `voice` for you.
"""

from __future__ import annotations

import json
import math
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
CACHE = Path.home() / ".cache" / "backsurge-video" / "kokoro"
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
MODEL = CACHE / "kokoro-v1.0.onnx"
VOICES = CACHE / "voices-v1.0.bin"
# Cloud sessions can't download GitHub release files, so the model can also come from a
# folder: $KOKORO_DIR, or tts/ in a clone of GeorgeHanna/backsurge-media next to this repo.
# The int8 model (~88 MB) is used there because GitHub rejects files over 100 MB.
LOCAL_DIRS = [
    Path(p)
    for p in (
        os.environ.get("KOKORO_DIR", ""),
        str(ROOT.parent / "tts"),
        "/home/claude/backsurge-media/tts",
    )
    if p
]


def _model_files() -> tuple[Path, Path] | None:
    """Return (model, voices) from the cache or a local folder, or None."""
    for d in [CACHE, *LOCAL_DIRS]:
        voices = d / "voices-v1.0.bin"
        if not voices.exists():
            continue
        for name in ("kokoro-v1.0.onnx", "kokoro-v1.0.fp16.onnx", "kokoro-v1.0.int8.onnx"):
            if (d / name).exists() and (d / name).stat().st_size > 1_000_000:
                return d / name, voices
    return None

SR = 44100  # sfx + music sample rate


# ─────────────────────────────── helpers ────────────────────────────────

def _np():
    import numpy as np  # imported lazily so `setup` works before numpy exists

    return np


def write_wav(path: Path, data, sr: int) -> None:
    import soundfile as sf

    np = _np()
    data = np.asarray(data, dtype=np.float32)
    peak = float(np.max(np.abs(data))) or 1.0
    if peak > 0.98:
        data = data * (0.98 / peak)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), data, sr, subtype="PCM_16")


# ──────────────────────────────── setup ─────────────────────────────────

def cmd_setup() -> None:
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "--quiet", "kokoro-onnx", "soundfile", "numpy"]
        + (["--break-system-packages"] if sys.prefix == sys.base_prefix else [])
    )
    CACHE.mkdir(parents=True, exist_ok=True)
    import urllib.request

    found = _model_files()
    if found:
        print(f"ok  {found[0]}")
        print("Voice model ready.")
        return
    try:
        for f in (MODEL, VOICES):
            print(f"get {f.name} ...")
            urllib.request.urlretrieve(MODEL_URL + f.name, f)
        print("Voice model ready.")
    except Exception as e:  # e.g. cloud sessions where GitHub releases are blocked
        for f in (MODEL, VOICES):
            f.unlink(missing_ok=True)
        print(f"Voice model download failed ({e}). Put kokoro-v1.0.int8.onnx and "
              "voices-v1.0.bin in tts/ of GeorgeHanna/backsurge-media (cloned next to this "
              "repo) or in $KOKORO_DIR.")


# ──────────────────────────────── voice ─────────────────────────────────

def _kokoro():
    from kokoro_onnx import Kokoro

    found = _model_files()
    if not found:
        sys.exit("Voice model missing. Run: npm run audio:setup")
    return Kokoro(str(found[0]), str(found[1]))


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p for p in parts if p]


def _word_weights(k, words: list[str], lang: str) -> list[float]:
    """Spoken length of each word, measured in phonemes (better than letters)."""
    weights = []
    for w in words:
        clean = re.sub(r"[^\w'%$+\-.]", "", w) or w
        try:
            ph = k.tokenizer.phonemize(clean, lang)
            n = len(re.sub(r"\s", "", ph))
        except Exception:
            n = len(clean)
        weights.append(max(1.0, float(n)))
    return weights


def _speech_bounds(np, audio, sr: int) -> tuple[float, float]:
    """Seconds where speech actually starts and ends inside a clip."""
    win = int(sr * 0.01)
    if len(audio) < win * 2:
        return 0.0, len(audio) / sr
    frames = audio[: len(audio) // win * win].reshape(-1, win)
    rms = np.sqrt((frames**2).mean(axis=1))
    thr = max(rms.max() * 0.06, 1e-4)
    on = np.where(rms > thr)[0]
    if len(on) == 0:
        return 0.0, len(audio) / sr
    return on[0] * win / sr, (on[-1] + 1) * win / sr


def synth_line(k, text: str, voice: str, speed: float, lang: str):
    """Synthesise one voiceover line sentence by sentence.

    Returns (samples, sample_rate, words) where words carry start/end seconds.
    Kokoro does not report word timings, so we time each sentence exactly and
    spread its words over the voiced part by phoneme count. Accurate enough
    for 1–3 word caption chunks.
    """
    np = _np()
    chunks, words, t = [], [], 0.0
    sr_out = 24000
    sentences = _split_sentences(text)
    for i, sentence in enumerate(sentences):
        samples, sr_out = k.create(sentence, voice=voice, speed=speed, lang=lang)
        start, end = _speech_bounds(np, samples, sr_out)
        ws = sentence.split()
        weights = _word_weights(k, ws, lang)
        # Commas cost a little time too.
        weights = [w + (2.5 if re.search(r"[,;:—]$", ws[j]) else 0) for j, w in enumerate(weights)]
        total = sum(weights)
        cursor = t + start
        span = end - start
        for w, weight in zip(ws, weights):
            d = span * weight / total
            words.append({"text": w, "start": round(cursor, 3), "end": round(cursor + d, 3)})
            cursor += d
        chunks.append(samples)
        t += len(samples) / sr_out
        if i < len(sentences) - 1:
            gap = np.zeros(int(sr_out * 0.12), dtype=np.float32)
            chunks.append(gap)
            t += len(gap) / sr_out
    audio = np.concatenate(chunks) if chunks else np.zeros(1, dtype=np.float32)
    return audio, sr_out, words


def cmd_voices() -> None:
    k = _kokoro()
    for v in sorted(k.get_voices()):
        print(v)


def cmd_voice(video_id: str) -> None:
    script_path = ROOT / "videos" / f"{video_id}.json"
    if not script_path.exists():
        sys.exit(f"No script at {script_path}")
    script = json.loads(script_path.read_text())
    vcfg = {"voice": "am_michael", "speed": 1.15, "lang": "en-us", **script.get("voice", {})}
    out_dir = PUBLIC / "generated" / video_id
    out_dir.mkdir(parents=True, exist_ok=True)

    k = None
    report: list[str] = []
    manifest = {"id": video_id, "voice": vcfg, "scenes": []}
    for i, scene in enumerate(script["scenes"]):
        vo = (scene.get("vo") or "").strip()
        if not vo:
            manifest["scenes"].append(None)
            continue
        k = k or _kokoro()
        audio, sr, words = synth_line(k, vo, vcfg["voice"], vcfg["speed"], vcfg["lang"])
        name = f"vo-{i:02d}.wav"
        write_wav(out_dir / name, audio, sr)
        manifest["scenes"].append(
            {"file": f"generated/{video_id}/{name}", "duration": round(len(audio) / sr, 3), "words": words}
        )
        report.append(f"  scene {i:02d}  {len(audio) / sr:5.2f}s  {vo[:60]}")

    # Write first, report after: a closed pipe (| head) must never leave audio and manifest out of sync.
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=1))
    print("\n".join(report + [f"Wrote {out_dir.relative_to(ROOT)}/manifest.json"]))



# ─────────────────────────── recorded voiceover ──────────────────────────

AUDIO_EXT = (".wav", ".mp3", ".m4a", ".aac", ".ogg", ".opus", ".flac", ".webm", ".mp4", ".mov")


def _find_take(folder: Path, n: int) -> Path | None:
    """Line n's recording: 01.wav, 1.m4a, line-01.mp3, … (first match)."""
    for f in sorted(folder.iterdir()):
        if f.suffix.lower() in AUDIO_EXT:
            digits = re.findall(r"\d+", f.stem)
            if digits and int(digits[-1]) == n:
                return f
    return None


def _load_clean(path: Path, sr: int = 48000):
    """Decode any audio with ffmpeg: mono, gentle high-pass, loudness to -16 LUFS."""
    np = _np()
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr),
         "-af", "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11", "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).copy(), sr


def _voiced_segments(np, audio, sr, min_gap=0.14):
    """[(start, end)] seconds of speech, split at pauses longer than min_gap."""
    win = int(sr * 0.01)
    frames = audio[: len(audio) // win * win].reshape(-1, win)
    rms = np.sqrt((frames**2).mean(axis=1))
    thr = max(np.percentile(rms, 95) * 0.08, 1e-4)
    on = rms > thr
    segs, start, gap = [], None, 0
    for i, v in enumerate(on):
        t = i * win / sr
        if v:
            if start is None:
                start = t
            gap = 0
            end = t + win / sr
        elif start is not None:
            gap += 1
            if gap * win / sr >= min_gap:
                segs.append((start, end))
                start = None
    if start is not None:
        segs.append((start, end))
    return [s for s in segs if s[1] - s[0] > 0.06]


def _align_heuristic(np, audio, sr, text, weigh):
    """Word timings without speech recognition: sentence breaks go to the
    longest pauses, words spread inside each sentence by spoken length."""
    sentences = _split_sentences(text)
    segs = _voiced_segments(np, audio, sr)
    if not segs:
        return []
    gaps = sorted(range(len(segs) - 1), key=lambda i: segs[i + 1][0] - segs[i][1], reverse=True)
    cuts = sorted(gaps[: len(sentences) - 1])
    spans, s0 = [], 0
    for c in cuts + [len(segs) - 1]:
        spans.append((segs[s0][0], segs[c][1]))
        s0 = c + 1
    while len(spans) < len(sentences):  # fewer pauses than sentences: share the last span
        a, b = spans.pop()
        mid = (a + b) / 2
        spans += [(a, mid), (mid, b)]
    words = []
    for sentence, (a, b) in zip(sentences, spans):
        ws = sentence.split()
        wts = weigh(ws)
        total = sum(wts)
        t = a
        for w, wt in zip(ws, wts):
            d = (b - a) * wt / total
            words.append({"text": w, "start": round(t, 3), "end": round(t + d, 3)})
            t += d
    return words


def _align_whisper(audio, sr, text):
    """Word timings from faster-whisper (optional: pip install faster-whisper)."""
    import difflib
    from faster_whisper import WhisperModel  # noqa: raises ImportError when missing

    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    np = _np()
    a16 = np.interp(np.arange(0, len(audio), sr / 16000), np.arange(len(audio)), audio).astype(np.float32)
    segments, _ = model.transcribe(a16, word_timestamps=True, language="en")
    heard = [w for seg in segments for w in (seg.words or [])]
    norm = lambda x: re.sub(r"[^a-z0-9]", "", x.lower())
    script = text.split()
    sm = difflib.SequenceMatcher(a=[norm(w) for w in script], b=[norm(w.word) for w in heard], autojunk=False)
    times = [None] * len(script)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            h = heard[blk.b + k]
            times[blk.a + k] = (h.start, h.end)
    if sum(t is not None for t in times) < len(script) * 0.6:
        return None  # said something quite different: fall back
    # Fill gaps between matched words by interpolation.
    known = [i for i, t in enumerate(times) if t]
    for i in range(len(times)):
        if times[i] is None:
            prev = max([k for k in known if k < i], default=None)
            nxt = min([k for k in known if k > i], default=None)
            a = times[prev][1] if prev is not None else (times[nxt][0] if nxt is not None else 0)
            b = times[nxt][0] if nxt is not None else a + 0.3
            times[i] = (a, max(a + 0.05, b))
    return [{"text": w, "start": round(t[0], 3), "end": round(t[1], 3)} for w, t in zip(script, times)]


def cmd_import(video_id: str, folder: str | None) -> None:
    """Use your own recordings instead of TTS. One file per voiced line, numbered
    in script order: recordings/<id>/01.wav, 02.m4a, … Captions keep the script's
    words, timed to your voice."""
    np = _np()
    script_path = ROOT / "videos" / f"{video_id}.json"
    script = json.loads(script_path.read_text())
    src = Path(folder) if folder else ROOT / "recordings" / video_id
    if not src.is_dir():
        sys.exit(f"No recordings folder at {src}")
    out_dir = PUBLIC / "generated" / video_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        k = _kokoro()
        weigh = lambda ws: _word_weights(k, ws, "en-us")
    except SystemExit:
        weigh = lambda ws: [max(1.0, float(len(re.sub(r"\W", "", w)))) for w in ws]

    manifest = {"id": video_id, "voice": {"source": "recorded"}, "scenes": []}
    report, line, missing = [], 0, []
    for i, scene in enumerate(script["scenes"]):
        vo = (scene.get("vo") or "").strip()
        if not vo:
            manifest["scenes"].append(None)
            continue
        line += 1
        take = _find_take(src, line)
        if not take:
            missing.append(line)
            manifest["scenes"].append(None)
            continue
        audio, sr = _load_clean(take)
        segs = _voiced_segments(np, audio, sr)
        if segs:  # trim silence, keep a short breath either side
            a = max(0, int((segs[0][0] - 0.06) * sr))
            b = min(len(audio), int((segs[-1][1] + 0.12) * sr))
            audio = audio[a:b]
        words, how = None, "pauses"
        try:
            words, how = _align_whisper(audio, sr, vo), "whisper"
        except Exception:
            words = None
        if not words:
            words, how = _align_heuristic(np, audio, sr, vo, weigh), "pauses"
        name = f"vo-{i:02d}.wav"
        write_wav(out_dir / name, audio, sr)
        manifest["scenes"].append({"file": f"generated/{video_id}/{name}", "duration": round(len(audio) / sr, 3), "words": words})
        report.append(f"  line {line:02d} ← {take.name:14s} {len(audio) / sr:5.2f}s  timed by {how}")

    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=1))
    print("\n".join(report + [f"Wrote {out_dir.relative_to(ROOT)}/manifest.json"]))
    if missing:
        print(f"Missing recordings for line(s) {', '.join(map(str, missing))}: those scenes run silent with no captions.")

# ───────────────────────────── sound effects ────────────────────────────

def _env(np, n: int, a: float, d: float, sr: int = SR, curve: float = 4.0):
    """Attack/decay envelope, n samples long."""
    t = np.arange(n) / sr
    att = np.clip(t / max(a, 1e-4), 0, 1)
    dec = np.exp(-curve * np.clip(t - a, 0, None) / max(d, 1e-4))
    return att * dec


def _lowpass(np, x, cutoff):
    """One-pole lowpass; cutoff may be a per-sample array (for sweeps)."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=np.float64), x.shape)
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def _noise(np, n, seed=1):
    return np.random.default_rng(seed).uniform(-1, 1, n)


def _sine(np, freq, n, phase=0.0):
    freq = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    return np.sin(phase + 2 * np.pi * np.cumsum(freq) / SR)


def _stereo(np, mono, width=0.0, seed=7):
    """Mono → stereo, optionally widened with a short decorrelating delay."""
    if width <= 0:
        return np.stack([mono, mono], axis=1)
    d = int(SR * 0.011)
    delayed = np.concatenate([np.zeros(d), mono[:-d]])
    return np.stack([mono + width * delayed, mono - width * delayed], axis=1) / (1 + width)


def make_sfx() -> dict:
    np = _np()
    fx = {}

    # Whoosh: band of noise sweeping up then fading. Scene transitions.
    n = int(SR * 0.55)
    t = np.linspace(0, 1, n)
    sweep = 300 + 5200 * np.sin(np.pi * t) ** 2
    w = _lowpass(np, _noise(np, n, 2), sweep) - _lowpass(np, _noise(np, n, 2), sweep * 0.25)
    fx["whoosh"] = _stereo(np, w * np.sin(np.pi * t) ** 1.5 * 1.6, 0.6)

    # Pop: short pitched bubble. Words and items appearing.
    n = int(SR * 0.12)
    f = 900 * np.exp(-np.arange(n) / SR * 28) + 380
    fx["pop"] = _stereo(np, _sine(np, f, n) * _env(np, n, 0.002, 0.06, curve=5) * 0.8)

    # Click: UI tap. Cursor clicks, toggles.
    n = int(SR * 0.05)
    c = _noise(np, n, 3) * _env(np, n, 0.0005, 0.008, curve=6)
    c = c - _lowpass(np, c, 2500)
    fx["click"] = _stereo(np, c * 0.9 + _sine(np, 2200, n) * _env(np, n, 0.0005, 0.01) * 0.3)

    # Tick: tiny key press. Typing.
    n = int(SR * 0.03)
    k = _noise(np, n, 4) * _env(np, n, 0.0003, 0.004, curve=6)
    fx["tick"] = _stereo(np, (k - _lowpass(np, k, 3500)) * 0.6)

    # Ding: bright success chime (two partials, slight shimmer). Wins, verdicts.
    n = int(SR * 1.2)
    e = _env(np, n, 0.003, 0.9, curve=5)
    tone = sum(a * _sine(np, f * 1.0, n) for f, a in ((1318.5, 0.5), (1975.5, 0.3), (2637.0, 0.12)))
    fx["ding"] = _stereo(np, tone * e * 0.7, 0.4)

    # Notify: two-note notification. Email alerts.
    seg = int(SR * 0.16)
    n1 = _sine(np, 987.8, seg) * _env(np, seg, 0.004, 0.12)
    n2 = _sine(np, 1318.5, int(SR * 0.5)) * _env(np, int(SR * 0.5), 0.004, 0.35)
    fx["notify"] = _stereo(np, np.concatenate([n1, n2]) * 0.6, 0.3)

    # Riser: rising filtered noise + tone into a reveal.
    n = int(SR * 1.6)
    t = np.linspace(0, 1, n)
    r = _lowpass(np, _noise(np, n, 5), 200 + 7000 * t**2) * t**2
    r += _sine(np, 120 + 600 * t**2, n) * t**3 * 0.35
    fx["riser"] = _stereo(np, r * 1.1, 0.5)

    # Impact: low boom + noise crack. Big reveals, logo hits.
    n = int(SR * 1.0)
    f = 140 * np.exp(-np.arange(n) / SR * 9) + 42
    boom = _sine(np, f, n) * _env(np, n, 0.002, 0.6, curve=4)
    crack = _lowpass(np, _noise(np, n, 6), 3000) * _env(np, n, 0.001, 0.08, curve=6)
    fx["impact"] = _stereo(np, np.tanh((boom * 1.2 + crack * 0.5) * 1.6) * 0.8, 0.2)

    # Swipe: quick downward swish. Exits, undo.
    n = int(SR * 0.25)
    t = np.linspace(0, 1, n)
    s = _lowpass(np, _noise(np, n, 8), 4000 * (1 - t) + 300) * np.sin(np.pi * t)
    fx["swipe"] = _stereo(np, s * 1.4, 0.6)

    # Count: soft blip for number counters.
    n = int(SR * 0.06)
    fx["count"] = _stereo(np, _sine(np, 1760, n) * _env(np, n, 0.001, 0.03) * 0.35)

    # Cricket: the sound of an awkward silence.
    n = int(SR * 1.6)
    t = np.arange(n) / SR
    chirp = np.sin(2 * np.pi * 4600 * t) * (np.sin(2 * np.pi * 30 * t) > 0.3)
    gate = ((t % 0.5) < 0.16).astype(float)
    fx["cricket"] = _stereo(np, chirp * gate * 0.22, 0.3)

    # Boing: a cartoon spring, for double-takes.
    n = int(SR * 0.6)
    t = np.arange(n) / SR
    f = 220 + 160 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4) + 120 * t
    fx["boing"] = _stereo(np, _sine(np, f, n) * _env(np, n, 0.005, 0.45, curve=3) * 0.7)

    # Record scratch: stops everything, for the awkward cut.
    n = int(SR * 0.42)
    t = np.linspace(0, 1, n)
    sweep = 2600 * (1 - t) ** 2 + 250
    sc = _lowpass(np, _noise(np, n, 21), sweep) * np.sin(np.pi * t) ** 0.6
    fx["scratch"] = _stereo(np, np.tanh(sc * 3) * 0.6, 0.2)

    # Paper flutter: sticky notes and spreadsheets.
    n = int(SR * 0.35)
    flaps = np.zeros(n)
    rng = np.random.default_rng(31)
    for k in range(9):
        i = int(rng.uniform(0, n - 1500))
        flaps[i : i + 1500] += _noise(np, 1500, 40 + k) * _env(np, 1500, 0.001, 0.012, curve=6)
    fx["paper"] = _stereo(np, (flaps - _lowpass(np, flaps, 900)) * 0.7, 0.6)

    # Sparkle: a bright shimmer for the reveal.
    n = int(SR * 0.9)
    sp = np.zeros(n)
    for k, f0 in enumerate([2093, 2637, 3136, 3951, 4186]):
        i = int(SR * 0.06 * k)
        m = n - i
        sp[i:] += _sine(np, f0, m) * _env(np, m, 0.002, 0.35, curve=5) * 0.2
    fx["sparkle"] = _stereo(np, sp, 0.5)

    # Wave: water swells up, crashes, hisses away. Full-screen wave transitions.
    n = int(SR * 1.3)
    t = np.linspace(0, 1, n)
    cut = 0.42
    env = np.where(t < cut, (t / cut) ** 2, np.exp(-(t - cut) * 4.5))
    sweep = np.where(t < cut, 300 + 2600 * (t / cut), 2900 * np.exp(-(t - cut) * 3) + 500)
    body = _lowpass(np, _noise(np, n, 51), sweep)
    hiss = (_noise(np, n, 52) - _lowpass(np, _noise(np, n, 52), 3000)) * np.where(t > cut, np.exp(-(t - cut) * 3), 0) * 0.35
    fx["wave"] = _stereo(np, np.tanh((body * 2.2 + hiss) * env * 1.4) * 0.8, 0.7)

    return fx


def cmd_sfx() -> None:
    out = PUBLIC / "sfx"
    for name, data in make_sfx().items():
        write_wav(out / f"{name}.wav", data, SR)
        print(f"  sfx/{name}.wav")


# ──────────────────────────────── music ─────────────────────────────────

NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def midi(name: str) -> int:
    m = re.match(r"([A-G]#?)(-?\d)", name)
    return NOTE[m.group(1)] + 12 * (int(m.group(2)) + 1)


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def _saw(np, f, n, detune=0.0, seed=0):
    """Band-limited-ish saw: sum of harmonics up to ~8 kHz."""
    t = np.arange(n) / SR
    out = np.zeros(n)
    ff = f * (1 + detune)
    k = 1
    while ff * k < 8000 and k < 40:
        out += ((-1) ** (k + 1)) * np.sin(2 * np.pi * ff * k * t + seed) / k
        k += 1
    return out * (2 / np.pi)


def render_track(style: str, bars: int = 16):
    """Simple, loopable music beds. Same tempo grid as the video (beats in seconds)."""
    np = _np()
    styles = {
        # Upbeat, confident. Default for explainers and feature clips.
        "drive": dict(bpm=112, root="A2", prog=[0, -4, 3, -2], minor=True, hats=True, kick="four", pluck=True),
        # Laid back. Talking-head style or slower explainers.
        "chill": dict(bpm=86, root="F2", prog=[0, 4, -3, 5], minor=False, hats=True, kick="half", pluck=False),
        # Short punchy loop for teasers and hooks.
        "pulse": dict(bpm=124, root="E2", prog=[0, 0, 3, -2], minor=True, hats=True, kick="four", pluck=True),
    }
    s = styles[style]
    beat = 60 / s["bpm"]
    bar = beat * 4
    n = int(SR * bar * bars)
    L = np.zeros(n)
    R = np.zeros(n)
    root = midi(s["root"])
    third = 3 if s["minor"] else 4

    def add(sig, start_s, pan=0.0, gain=1.0):
        i = int(start_s * SR)
        if i >= n:
            return
        sig = sig[: n - i] * gain
        L[i : i + len(sig)] += sig * (1 - max(pan, 0))
        R[i : i + len(sig)] += sig * (1 + min(pan, 0))

    duck = np.ones(n)  # sidechain envelope from the kick

    for b in range(bars):
        deg = s["prog"][b % len(s["prog"])]
        chord_root = root + deg
        bar_t = b * bar
        # Pad: detuned saws, lowpassed, one chord per bar.
        notes = [chord_root + 12, chord_root + 12 + third, chord_root + 19, chord_root + 24]
        pn = int(SR * bar)
        pad = sum(_saw(np, hz(m), pn, d, seed=j) for j, m in enumerate(notes) for d in (-0.004, 0.004))
        pad = _lowpass(np, pad, 1400) * 0.05
        env = np.minimum(1, np.arange(pn) / (SR * 0.25)) * np.minimum(1, (pn - np.arange(pn)) / (SR * 0.15))
        add(pad * env, bar_t, pan=-0.2)
        add(pad * env, bar_t + 0.012, pan=0.2)
        # Bass: root on eighths (drive) or quarters (chill).
        step = beat / 2 if s["kick"] == "four" else beat
        for k in range(int(bar / step)):
            bn = int(SR * step * 0.9)
            f = hz(chord_root - (12 if k % 4 else 0) + (7 if k % 8 == 6 else 0))
            tone = np.sin(2 * np.pi * f * np.arange(bn) / SR)
            tone += 0.3 * np.sin(4 * np.pi * f * np.arange(bn) / SR)
            add(np.tanh(tone * 1.5) * _env(np, bn, 0.004, step * 0.8, curve=3) * 0.22, bar_t + k * step)
        # Pluck arpeggio.
        if s["pluck"]:
            arp = [chord_root + 24, chord_root + 24 + third, chord_root + 31, chord_root + 36]
            for k in range(8):
                pn2 = int(SR * 0.3)
                m = arp[(k * 3 + b) % 4]
                p = _saw(np, hz(m), pn2) * _env(np, pn2, 0.002, 0.18, curve=5)
                add(_lowpass(np, p, 3200) * 0.07, bar_t + k * beat / 2, pan=0.35 if k % 2 else -0.35)
        # Drums.
        kicks = range(4) if s["kick"] == "four" else (0, 2.5)
        for kb in kicks:
            kn = int(SR * 0.35)
            f = 150 * np.exp(-np.arange(kn) / SR * 30) + 48
            kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(np, kn, 0.001, 0.25, curve=4)
            add(np.tanh(kick * 2) * 0.55, bar_t + kb * beat)
            i0 = int((bar_t + kb * beat) * SR)
            dn = min(int(SR * beat * 0.7), n - i0)
            if dn > 0:
                duck[i0 : i0 + dn] = np.minimum(duck[i0 : i0 + dn], 0.45 + 0.55 * (np.arange(dn) / dn) ** 0.6)
        if s["hats"]:
            for h in range(8):
                hn = int(SR * 0.06)
                hat = _noise(np, hn, b * 8 + h)
                hat = (hat - _lowpass(np, hat, 7000)) * _env(np, hn, 0.0005, 0.03, curve=6)
                add(hat * (0.09 if h % 2 else 0.05), bar_t + h * beat / 2 + beat / 4 * 0, pan=0.3)
        # Clap on 2 and 4.
        for cb in (1, 3):
            cn = int(SR * 0.18)
            clap = _lowpass(np, _noise(np, cn, b * 4 + cb + 99), 2500) * _env(np, cn, 0.001, 0.08, curve=5)
            add(clap * 0.18, bar_t + cb * beat)

    # Duck everything except kick slightly by the kick, gentle master.
    mix = np.stack([L, R], axis=1) * duck[:, None]
    mix = np.tanh(mix * 1.3) * 0.8
    # Short fades so the loop point is click-free.
    f = int(SR * 0.02)
    mix[:f] *= np.linspace(0, 1, f)[:, None]
    mix[-f:] *= np.linspace(1, 0, f)[:, None]
    return mix, s["bpm"]


def cmd_music() -> None:
    out = PUBLIC / "music"
    meta = {}
    for style in ("drive", "chill", "pulse"):
        data, bpm = render_track(style)
        data = data * (0.9 / max(float(abs(data).max()), 1e-6))
        write_wav(out / f"{style}.wav", data, SR)
        meta[style] = {"bpm": bpm, "seconds": round(len(data) / SR, 3)}
        print(f"  music/{style}.wav  {bpm} bpm  {len(data) / SR:.1f}s")
    (out / "tracks.json").write_text(json.dumps(meta, indent=1))


# ──────────────────────────────── main ──────────────────────────────────

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "setup":
        cmd_setup()
    elif cmd == "sfx":
        cmd_sfx()
    elif cmd == "music":
        cmd_music()
    elif cmd == "voices":
        cmd_voices()
    elif cmd == "voice" and len(sys.argv) > 2:
        cmd_voice(sys.argv[2])
    elif cmd == "import" and len(sys.argv) > 2:
        cmd_import(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
    else:
        print(__doc__)
        sys.exit(1)
