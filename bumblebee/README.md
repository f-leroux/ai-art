# Flight of the Bumblebee — a neon courier chase

A multi-scene, music-reactive video drawn in JavaScript. A courier drone the
size of a bee launches from a rooftop hive, dives a skyscraper canyon, skims
an underpass, raids a holographic flower market, outruns a security swatter,
glides above the clouds and climbs home for the final chord.

Every scene is cut on a boundary in the music (see `CONFIG.cues`), and the
analysis drives the picture continuously:

- **pitch register** (spectral centroid) → the drone's altitude and steering
- **onsets** → rotor flash, torch-style neon flares, trail sparks
- **accents** (the strongest fifth of the onsets) → camera bumps, chromatic
  aberration, glitch slices, the swatter's lunges, flowers blooming
- **note density** → speed lines, forward travel, rotor blur
- **loudness** → glow level, the hologram's smile

The fonts are embedded as data URIs so the page is self-contained.

```bash
node render.mjs contact           # stills at chosen seconds -> out/stills
node render.mjs full 30 18        # -> out/bumblebee.mp4
```

Music: Rimsky-Korsakov (1900), piano performance by Gregor Quendel
(classicals.de). Check the recording's licence before commercial use.
