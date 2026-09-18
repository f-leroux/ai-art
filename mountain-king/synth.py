"""
Synthesises a rendition of Edvard Grieg's "In the Hall of the Mountain King"
(Peer Gynt Suite No. 1, Op. 46, 1875 - public domain) from a transcription.

No samples are used: every instrument is additive/subtractive synthesis in
numpy. Eight statements of the theme with growing orchestration and a
continuous accelerando, then the hammering coda and the final crashes.

    python3 synth.py            -> audio/mountain-king.wav (+ .mp3 if ffmpeg found)
"""
import math
import os
import subprocess
import sys

import numpy as np
from scipy.signal import lfilter

SR = 44100
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio")

# ---------------------------------------------------------------- the theme
# (midi pitch, length in eighth notes); B minor, as written for cellos/basses
BAR_A1 = [(59, 1), (61, 1), (62, 1), (64, 1), (66, 1), (62, 1), (66, 2)]
BAR_A2 = [(65, 1), (61, 1), (65, 2), (64, 1), (60, 1), (64, 2)]
BAR_A4 = [(71, 1), (69, 1), (66, 1), (62, 1), (66, 2), (69, 2)]
PHRASE_A = BAR_A1 + BAR_A2 + BAR_A1 + BAR_A4
PHRASE_B = [(p + 7, d) for p, d in PHRASE_A]
THEME = PHRASE_A + PHRASE_B  # 8 bars, 32 beats

# chord roots per bar (for sustained harmony): i, i, i, V/i ... approximated
BAR_CHORDS = [
    [(47, 50, 54)], [(47, 50, 54)], [(47, 50, 54)], [(47, 50, 54)],
    [(54, 57, 61)], [(54, 57, 61)], [(54, 57, 61)], [(54, 57, 61)],
]

# statements: (tempo at start, orchestration flags)
STATEMENTS = [
    dict(bpm=112, pizz=1.0, bassoon=0.5, low8=0, wood_hi=0, timp=0.0, arco=0, horns=0, brass=0, cym=0, vel=0.30),
    dict(bpm=116, pizz=1.0, bassoon=0.7, low8=0.6, wood_hi=0, timp=0.0, arco=0, horns=0, brass=0, cym=0, vel=0.36),
    dict(bpm=122, pizz=1.0, bassoon=0.8, low8=0.8, wood_hi=0.6, timp=0.2, arco=0, horns=0, brass=0, cym=0, vel=0.44),
    dict(bpm=128, pizz=0.9, bassoon=0.9, low8=0.9, wood_hi=0.9, timp=0.4, arco=0.3, horns=0.3, brass=0, cym=0, vel=0.54),
    dict(bpm=136, pizz=0.7, bassoon=0.9, low8=1.0, wood_hi=1.0, timp=0.6, arco=0.8, horns=0.6, brass=0, cym=0, vel=0.64),
    dict(bpm=146, pizz=0.5, bassoon=0.9, low8=1.0, wood_hi=1.0, timp=0.8, arco=1.0, horns=0.8, brass=0.6, cym=0.4, vel=0.76),
    dict(bpm=158, pizz=0.3, bassoon=0.9, low8=1.0, wood_hi=1.0, timp=1.0, arco=1.0, horns=1.0, brass=0.9, cym=0.7, vel=0.88),
    dict(bpm=172, pizz=0.2, bassoon=0.9, low8=1.0, wood_hi=1.0, timp=1.0, arco=1.0, horns=1.0, brass=1.0, cym=1.0, vel=1.00),
]
CODA_BPM_START = 186
CODA_BPM_END = 204


def midi_to_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- tempo map
class Clock:
    """beats -> seconds under a piecewise-linear tempo curve."""

    def __init__(self, points):
        # points: list of (beat, bpm)
        self.points = points
        beats = np.arange(0, points[-1][0] + 1, 0.25)
        bpm = np.interp(beats, [p[0] for p in points], [p[1] for p in points])
        secs_per_beat = 60.0 / bpm
        self.beats = beats
        self.times = np.concatenate([[0.0], np.cumsum(secs_per_beat[:-1] * 0.25)])

    def t(self, beat):
        return float(np.interp(beat, self.beats, self.times))


# ---------------------------------------------------------------- instruments
def env_adsr(n, a, d, s, r, sr=SR):
    a_n, d_n, r_n = int(a * sr), int(d * sr), int(r * sr)
    e = np.ones(n, dtype=np.float32) * s
    a_n = min(a_n, n)
    e[:a_n] = np.linspace(0, 1, a_n, endpoint=False)
    d_end = min(a_n + d_n, n)
    if d_end > a_n:
        e[a_n:d_end] = np.linspace(1, s, d_end - a_n, endpoint=False)
    r_n = min(r_n, n)
    if r_n > 0:
        e[n - r_n:] *= np.linspace(1, 0, r_n)
    return e


def additive(f, n, harmonics, vibrato=0.0, vib_rate=5.5, detune=0.0):
    t = np.arange(n) / SR
    out = np.zeros(n, dtype=np.float32)
    voices = [0.0] if detune == 0 else [-detune, 0.0, detune]
    for dv in voices:
        fi = f * (1 + dv) * (1 + vibrato * np.sin(2 * np.pi * vib_rate * t + np.random.rand() * 6.28))
        phase = 2 * np.pi * np.cumsum(fi) / SR + np.random.rand() * 6.28
        for h, amp in harmonics:
            if f * h > 17000:
                break
            out += (amp * np.sin(phase * h)).astype(np.float32)
    return out / len(voices)


def lowpass(x, cutoff):
    # one-pole lowpass
    rc = 1.0 / (2 * math.pi * cutoff)
    dt = 1.0 / SR
    alpha = dt / (rc + dt)
    return lfilter([alpha], [1, -(1 - alpha)], x).astype(np.float32)


def pizz(f, dur, vel):
    n = int(min(dur, 0.7) * SR)
    t = np.arange(n) / SR
    harm = [(h, 1.0 / h ** 1.1) for h in range(1, 9)]
    x = additive(f, n, harm)
    e = np.exp(-t * (7.0 + f / 80)) * (1 - np.exp(-t * 900))
    body = lowpass(x * e, 1800 + f * 2)
    return body * vel


def bassoon(f, dur, vel):
    n = int(dur * 0.62 * SR)
    harm = [(h, (1.0 / h ** 0.7) * (0.55 if h % 2 == 0 else 1.0)) for h in range(1, 10)]
    x = additive(f, n, harm, vibrato=0.003, vib_rate=5.0)
    x = lowpass(x, 1400)
    return x * env_adsr(n, 0.012, 0.05, 0.75, 0.04) * vel * 0.9


def clarinet(f, dur, vel):
    n = int(dur * 0.6 * SR)
    harm = [(h, 1.0 / h ** 0.9) for h in range(1, 12, 2)] + [(h, 0.12 / h) for h in range(2, 12, 2)]
    x = additive(f, n, harm, vibrato=0.002)
    x = lowpass(x, 3200)
    return x * env_adsr(n, 0.01, 0.04, 0.8, 0.03) * vel * 0.7


def oboe(f, dur, vel):
    n = int(dur * 0.6 * SR)
    harm = [(h, 1.0 / h ** 0.5) for h in range(1, 14)]
    x = additive(f, n, harm, vibrato=0.004, vib_rate=6.0)
    x = lowpass(x, 3800)
    return x * env_adsr(n, 0.015, 0.05, 0.75, 0.03) * vel * 0.45


def arco(f, dur, vel):
    n = int(dur * 0.92 * SR)
    harm = [(h, 1.0 / h) for h in range(1, 20)]
    x = additive(f, n, harm, vibrato=0.006, vib_rate=5.5, detune=0.004)
    x = lowpass(x, 2600 + f)
    return x * env_adsr(n, 0.045, 0.08, 0.85, 0.06) * vel * 0.55


def horn(f, dur, vel):
    n = int(dur * 0.95 * SR)
    harm = [(h, 1.0 / h ** 1.3) for h in range(1, 12)]
    x = additive(f, n, harm, vibrato=0.002, detune=0.002)
    x = lowpass(x, 1500 + f)
    return x * env_adsr(n, 0.03, 0.1, 0.8, 0.08) * vel * 0.6


def brass(f, dur, vel):
    n = int(dur * 0.7 * SR)
    t = np.arange(n) / SR
    harm = [(h, 1.0 / h ** 0.75) for h in range(1, 18)]
    x = additive(f, n, harm, vibrato=0.003, detune=0.003)
    # brightness opens up after the attack
    bright = lowpass(x, 5000)
    dark = lowpass(x, 1200)
    mix = np.clip(t / 0.06, 0, 1)
    x = dark * (1 - mix) + bright * mix
    return x * env_adsr(n, 0.02, 0.06, 0.8, 0.05) * vel * 0.7


def timpani(f, vel, roll=False):
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    fi = f * (1 + 0.6 * np.exp(-t * 40))
    phase = 2 * np.pi * np.cumsum(fi) / SR
    x = np.sin(phase) + 0.35 * np.sin(phase * 1.5) + 0.2 * np.sin(phase * 2.2)
    noise = np.random.randn(n) * np.exp(-t * 60) * 0.6
    x = (x * np.exp(-t * 5.5) + lowpass(noise.astype(np.float32), 900)) * (1 - np.exp(-t * 2000))
    return (x * vel * 1.3).astype(np.float32)


def cymbal(vel, length=2.6):
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = np.random.randn(n).astype(np.float32)
    hi = noise - lowpass(noise, 3500)
    x = hi * (np.exp(-t * 1.8) * 0.8 + np.exp(-t * 12) * 1.2)
    return (x * vel * 0.55).astype(np.float32)


def bass_drum(vel):
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    fi = 55 * (1 + 1.5 * np.exp(-t * 30))
    x = np.sin(2 * np.pi * np.cumsum(fi) / SR) * np.exp(-t * 7)
    return (x * vel * 1.4).astype(np.float32)


# ---------------------------------------------------------------- mixer
class Mix:
    def __init__(self, seconds):
        self.n = int(seconds * SR)
        self.L = np.zeros(self.n, dtype=np.float32)
        self.R = np.zeros(self.n, dtype=np.float32)

    def add(self, x, t0, pan=0.0, gain=1.0):
        i = int(t0 * SR)
        if i >= self.n:
            return
        m = min(len(x), self.n - i)
        if m <= 0:
            return
        gl = gain * math.cos((pan + 1) * math.pi / 4)
        gr = gain * math.sin((pan + 1) * math.pi / 4)
        self.L[i:i + m] += x[:m] * gl
        self.R[i:i + m] += x[:m] * gr


def reverb(x, mix=0.22):
    combs = [(1557, 0.79), (1617, 0.78), (1491, 0.80), (1422, 0.77), (1277, 0.81), (1356, 0.79)]
    wet = np.zeros_like(x)
    for d, g in combs:
        b = np.zeros(d + 1)
        b[0] = 1
        a = np.zeros(d + 1)
        a[0] = 1
        a[d] = -g
        wet += lfilter(b, a, x).astype(np.float32)
    wet /= len(combs)
    for d in (225, 556):
        g = 0.5
        b = np.zeros(d + 1)
        b[0] = -g
        b[d] = 1
        a = np.zeros(d + 1)
        a[0] = 1
        a[d] = -g
        wet = lfilter(b, a, wet).astype(np.float32)
    wet = lowpass(wet, 5000)
    return x * (1 - mix) + wet * mix


# ---------------------------------------------------------------- the score
def compose():
    np.random.seed(7)
    # tempo curve over global beats
    beats_per_statement = 32
    points = []
    for i, s in enumerate(STATEMENTS):
        points.append((i * beats_per_statement, s["bpm"]))
    coda_start = len(STATEMENTS) * beats_per_statement
    coda_beats = 4 * 8 + 4 + 12  # hammering (8 bars) + rush (1 bar) + final hits/hold
    points.append((coda_start, CODA_BPM_START))
    points.append((coda_start + coda_beats, CODA_BPM_END))
    clock = Clock(points)
    total = clock.t(coda_start + coda_beats) + 6.0
    mix = Mix(total)
    cues = {"statements": [], "coda": None, "final_hits": [], "end": None}

    def note_at(beat):
        return clock.t(beat)

    for si, s in enumerate(STATEMENTS):
        base = si * beats_per_statement
        cues["statements"].append(round(note_at(base), 3))
        vel = s["vel"]
        beat = 0.0
        for idx, (p, d) in enumerate(THEME):
            t0 = note_at(base + beat)
            t1 = note_at(base + beat + d * 0.5)
            dur = t1 - t0
            f = midi_to_hz(p)
            accent = 1.15 if (beat % 1.0) == 0 else 1.0
            v = vel * accent
            if s["pizz"]:
                mix.add(pizz(f, dur, v * s["pizz"]), t0, pan=-0.35)
                if s["low8"]:
                    mix.add(pizz(f / 2, dur, v * s["low8"] * 0.9), t0, pan=-0.5)
            if s["bassoon"]:
                mix.add(bassoon(f, dur, v * s["bassoon"] * 0.8), t0, pan=0.25)
            if s["wood_hi"]:
                mix.add(clarinet(f * 2, dur, v * s["wood_hi"] * 0.55), t0, pan=0.35)
                if si >= 3:
                    mix.add(oboe(f * 2, dur, v * s["wood_hi"] * 0.5), t0, pan=-0.2)
            if s["arco"]:
                mix.add(arco(f * 2, dur, v * s["arco"] * 0.8), t0, pan=-0.3)
                mix.add(arco(f, dur, v * s["arco"] * 0.6), t0, pan=0.3)
                if si >= 5:
                    mix.add(arco(f * 4, dur, v * s["arco"] * 0.35), t0, pan=-0.1)
            if s["brass"]:
                mix.add(brass(f * 2, dur, v * s["brass"] * 0.7), t0, pan=0.15)
                mix.add(brass(f / 2, dur, v * s["brass"] * 0.6), t0, pan=-0.15)
            beat += d * 0.5
        # sustained horns / chords on each beat
        if s["horns"]:
            for bar in range(8):
                chord = BAR_CHORDS[bar][0]
                for b in range(4):
                    t0 = note_at(base + bar * 4 + b)
                    t1 = note_at(base + bar * 4 + b + 1)
                    for k, p in enumerate(chord):
                        mix.add(horn(midi_to_hz(p + 12), (t1 - t0), vel * s["horns"] * (0.5 if b % 2 else 0.7)), t0, pan=(k - 1) * 0.3)
        # timpani / cymbals
        if s["timp"]:
            for bar in range(8):
                root = 35 if bar < 4 else 42
                for b in range(4):
                    if b in (0, 2) or (s["timp"] >= 0.8):
                        t0 = note_at(base + bar * 4 + b)
                        mix.add(timpani(midi_to_hz(root), vel * s["timp"] * (1.0 if b == 0 else 0.7)), t0, pan=0.1)
        if s["cym"]:
            for bar in range(0, 8, 2 if s["cym"] < 1 else 1):
                t0 = note_at(base + bar * 4)
                mix.add(cymbal(vel * s["cym"] * 0.5, 1.6), t0, pan=0.4)
                mix.add(bass_drum(vel * s["cym"]), t0, pan=0.0)

    # ---- coda: hammering chords, a chromatic rush, three crashes, a held chord
    cb = coda_start
    cues["coda"] = round(note_at(cb), 3)
    vel = 1.0
    bm = [47, 50, 54, 59, 62, 66, 71]
    fs = [42, 46, 49, 54, 58, 61, 66]
    # 8 bars: chords on the eighth-note pattern  X X X . X X X .   alternating Bm / F#
    for bar in range(8):
        chord = bm if bar % 2 == 0 else fs
        pattern = [0, 0.5, 1.0, 2.0, 2.5, 3.0] if bar < 6 else [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]
        for b in pattern:
            t0 = note_at(cb + bar * 4 + b)
            t1 = note_at(cb + bar * 4 + b + 0.5)
            dur = t1 - t0
            for k, p in enumerate(chord):
                f = midi_to_hz(p)
                mix.add(brass(f, dur, vel * 0.5), t0, pan=(k % 3 - 1) * 0.35)
                mix.add(arco(f, dur, vel * 0.5), t0, pan=-(k % 3 - 1) * 0.3)
            mix.add(timpani(midi_to_hz(35 if bar % 2 == 0 else 42), vel * 0.9), t0)
            if b == 0:
                mix.add(cymbal(0.6, 1.2), t0, pan=0.3)
                mix.add(bass_drum(1.0), t0)
    # chromatic rush up over one bar (sixteenths)
    rb = cb + 32
    for i in range(16):
        t0 = note_at(rb + i * 0.25)
        t1 = note_at(rb + (i + 1) * 0.25)
        f = midi_to_hz(59 + i)
        mix.add(arco(f * 2, (t1 - t0), 0.8), t0, pan=-0.2)
        mix.add(brass(f, (t1 - t0), 0.6), t0, pan=0.2)
        mix.add(clarinet(f * 2, (t1 - t0), 0.6), t0, pan=0.4)
    # three crashes and the held chord
    fb = rb + 4
    hits = [0, 2, 4]
    for h in hits:
        t0 = note_at(fb + h)
        cues["final_hits"].append(round(t0, 3))
        t1 = note_at(fb + h + 1.2)
        for k, p in enumerate(bm + [p + 12 for p in bm[:4]]):
            f = midi_to_hz(p)
            mix.add(brass(f, (t1 - t0), 1.0), t0, pan=(k % 3 - 1) * 0.4)
            mix.add(arco(f, (t1 - t0), 0.8), t0, pan=-(k % 3 - 1) * 0.3)
        mix.add(cymbal(1.0, 2.4), t0, pan=0.3)
        mix.add(bass_drum(1.3), t0)
        mix.add(timpani(midi_to_hz(35), 1.2), t0)
    # timpani roll under the last chord
    t_last = note_at(fb + 6)
    cues["final_hits"].append(round(t_last, 3))
    hold = 4.2
    for k, p in enumerate(bm + [p + 12 for p in bm[:5]]):
        f = midi_to_hz(p)
        mix.add(brass(f, hold, 1.0), t_last, pan=(k % 3 - 1) * 0.4)
        mix.add(arco(f, hold, 0.9), t_last, pan=-(k % 3 - 1) * 0.3)
        mix.add(horn(f, hold, 0.8), t_last, pan=(k % 2) * 0.4 - 0.2)
    mix.add(cymbal(1.2, 3.5), t_last, pan=0.3)
    mix.add(bass_drum(1.4), t_last)
    roll_t = t_last
    while roll_t < t_last + hold - 0.4:
        mix.add(timpani(midi_to_hz(35), 0.5 + 0.5 * (roll_t - t_last) / hold), roll_t)
        roll_t += 0.045
    mix.add(cymbal(1.3, 4.0), t_last + hold - 0.6, pan=-0.2)
    mix.add(bass_drum(1.5), t_last + hold - 0.6)
    mix.add(timpani(midi_to_hz(35), 1.4), t_last + hold - 0.6)
    cues["end"] = round(t_last + hold + 2.5, 3)
    return mix, cues


def master(mix):
    L = reverb(mix.L)
    R = reverb(mix.R)
    st = np.stack([L, R], axis=1)
    # gentle drive + normalisation
    st = np.tanh(st * 1.6) / math.tanh(1.6)
    peak = np.max(np.abs(st)) or 1.0
    st = st / peak * 0.97
    return st


def write_wav(path, st):
    import wave

    data = (st * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    mix, cues = compose()
    st = master(mix)
    end = int(cues["end"] * SR)
    st = st[:end]
    wav = os.path.join(OUT_DIR, "mountain-king.wav")
    write_wav(wav, st)
    import json

    with open(os.path.join(OUT_DIR, "cues.json"), "w") as f:
        json.dump(cues, f, indent=1)
    print("wrote", wav, "%.1fs" % (len(st) / SR))
    ffmpeg = None
    try:
        import imageio_ffmpeg

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    ffmpeg = ffmpeg or "ffmpeg"
    mp3 = os.path.join(OUT_DIR, "mountain-king.mp3")
    try:
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "160k", mp3], check=True)
        print("wrote", mp3)
    except Exception as e:
        print("mp3 skipped:", e, file=sys.stderr)
