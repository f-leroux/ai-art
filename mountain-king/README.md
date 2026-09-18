# Hall of the Mountain King — a music-reactive shadow-theatre video

A generative music video drawn entirely in JavaScript on a canvas. Nothing in
the picture is an image: the troll hall, torches, the horde, Peer Gynt, the
Mountain King, the falling rock and the spectrum crystals are all computed
every frame from an analysis of the music.

## How it reacts to the music

`index.html` decodes the track and analyses it once, up front:

- **RMS loudness**, smoothed into a 0..1 *intensity* curve: drives the number
  of trolls, the light level, camera speed, god-rays, and when the King rises.
- **Band energies** (bass / mid / high): torch flicker, glow size.
- **Spectral-flux onsets**: every troll stomps (squash and stretch) and the
  torches flare on each note; **bass onsets** shake the camera.
- **Crashes** (loud, broadband, isolated hits): full-frame flash, cracks in the
  cave wall, rockfall, and the King's roar.
- **40-bin log spectrum**: the foreground crystals glow with it.

Because the analysis is precomputed and every drawing uses seeded noise, a
frame is a pure function of time. That is what makes the offline render
deterministic and lets the same page play live in a browser.

## Files

- `index.html` — the video. Open it, press Play, or drop in any audio file.
- `synth.py` — renders the public-domain score to `audio/` (no samples;
  additive synthesis in numpy). `pip install numpy scipy imageio-ffmpeg`.
- `render.mjs` — headless frame capture + ffmpeg mux to MP4.

## Rendering an MP4

```bash
npm i playwright-core            # plus a Chromium; set CHROMIUM=/path/to/chrome if needed
pip install imageio-ffmpeg       # or set FFMPEG=/path/to/ffmpeg
node render.mjs contact          # stills at key moments -> out/stills
node render.mjs full 30 18       # full video at 30 fps, CRF 18 -> out/mountain-king.mp4
```

## Using it for another track

Point `CONFIG.audio` at the new file (or drop it on the page), and set
`CONFIG.title`, `CONFIG.composer` and `CONFIG.credit`. The choreography is
derived from the analysis, so a different piece produces a different chase:
a slow build keeps the hall dark and the eyes blinking, a hard drop brings the
horde out at once.
