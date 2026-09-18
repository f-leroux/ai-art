# Doodles for the Apprentice — seventeen photographs come alive

The style of Kevin Ngo's doodle pieces: real photographs, pinned to pastel
paper, with doodles drawn over them in JavaScript that turn each object into
something else. Here the doodles draw themselves stroke by stroke on the
notes of the finale of Dukas's *L'apprenti sorcier*, and the objects act out
the story together.

## The story, object by object

| photo | becomes | role in the story |
|---|---|---|
| pencil | the Apprentice (its sharpened tip is his hat) | causes the trouble, rides the ark, gets the THWACK |
| toothbrush | the enchanted broom | cut in two; both halves get up; multiplies on every accent |
| scissors | a stork (rings for eyes, blades for a beak) | the "axe": it has just snipped the broom in two, then flees |
| mug | a wishing well | the brooms fill it until it overflows and floods the desk |
| teapot | an elephant | hoses the well with its trunk, making things worse |
| clothes peg | a crocodile | cruises the flood snapping at brooms |
| running shoe | the ark | the Apprentice's boat, with a life ring doodled over the brand mark |
| banana | a dolphin | leaps beside the ark |
| two lemons | two ducklings | paddle along, later ride the turtle |
| light bulb | a jellyfish | glows on the notes under the water |
| broccoli | a tree on an island | dry land: the crab has made it, the snail is on its way |
| croissant | a crab | first onto the island |
| tape measure | a snail (the tape is its stretched neck) | "hurry!" |
| umbrella | a sea turtle | ferries the ducklings |
| fork | Neptune's trident | the sea-king rises on the piccolo shriek |
| skeleton key | the Master Sorcerer | comes down from the top of the paper when the music stops dead |
| whisk | the whirlpool | spins at his gesture and drains the flood; the brooms spiral into it |

Then the doodles un-draw themselves, the objects lie about as plain
photographs again, and the final chord is a THWACK. The end card pins all
seventeen doodled photographs to the board.

## How it works

`index.html` holds a small stroke engine: every doodle is an ordered list of
ink strokes, coloured-pencil fills and hand-lettered captions in the photo's
own pixel space (`PHOTO_SIZE`). Progress through the list follows the note
onsets found by the audio analysis (and never falls behind a per-scene
deadline), so the drawing happens on the music. Finished doodles then
animate by stroke group: arms swing buckets on the notes, the trunk sprays,
the Master's brows lower on the two soft chords, the whirlpool spins.
Photo cards themselves bob on the water, hop on onsets, multiply on accents
and spiral into the drain.

What listens to the music:

- onsets → strokes appear; brooms hop; the jellyfish glows; buckets swing
- accents → a new broom appears; splashes at the waterline; lightning in the storm
- the flood is cut on the recording's own boundaries (`CONFIG.cues`, below)

## The recording and its licence — read this before commercial use

Music: Dukas, *L'apprenti sorcier* (1897; the composition is public domain).
Recording: Dimitri Mitropoulos conducting the Minneapolis Symphony
Orchestra, 1941, Columbia 78 set X-212, transferred by Bob Varney and
published on archive.org as
<https://archive.org/details/SorcerersApprentice> with a CC0 tag.
`audio/apprentice-finale.mp3` is 379.6 s → 582.0 s of that file (the finale:
the theme's return, the multiplication, the flood, the Master's return and
the final chord), plus 4 s of silence for the end card — 3:26 in all.

Status, honestly:

- **EU / UK / France:** public domain. Sound recordings published before
  1963 had a 50-year term that expired before the 2013 extension, so a 1941
  recording is free of performers' and producers' rights.
- **United States:** *not* public domain. Under the Music Modernization Act
  a 1941 recording stays protected until 2042 (100 years). The uploader's
  CC0 tag covers only his transfer, not Columbia's rights.

So this cut is cleared for a European audience and *not* for a US one.
Every truly free option was checked: Musopen answers with a Cloudflare
challenge from this environment (HTTP 403); Wikimedia Commons has no
orchestral recording of the piece (only a 48-second organ transcription);
the modern archive.org recordings (Scherchen, Toscanini) are licensed
non-commercial; IMSLP's recordings (Solti 1957, Fiedler 1954, Ansermet 1954)
are marked "Public Domain — Non-PD US", i.e. exactly the same status as
this one, and its download needs a browser. The only worldwide-clear file
found is Quinn Mason's synthesized rendering on IMSLP (CC BY 4.0), which is
not an orchestra. If you need US clearance, drop a Musopen recording in
`audio/`, and re-cut the cues as below.

## Re-cutting the cues for another recording

The cues in `CONFIG.cues` are seconds into the audio file. They were found
by running an RMS / spectral-flux timeline over the recording (1 s and
0.25 s steps) and reading off the boundaries — the same method as the
previous session:

| cue | s | what the timeline shows |
|---|---|---|
| theme | 0.9 | first pp note of the returning broom theme |
| rise | 8.9 | first mf entry |
| multiply | 25.9 | tutti hit at −8 dB |
| overflow | 38.9 | the orchestra stays loud from here |
| flood | 68.4 | plateau at −15 dB inside the flood |
| island | 101.9 | a one-beat breath (−20 dB) before the last surge |
| shriek | 136.4 | the piccolo / cymbal peak (highest 2.5–9 kHz energy) |
| master | 147.0 | the flood stops dead (−62 dB) |
| brow1, brow2 | 153.65, 157.4 | two soft chords in the silence |
| drain | 161.8 | the slow coda begins |
| hush | 187.4 | the coda fades to fragments |
| thwack | 198.65 | the final chord |
| end | 200.4 | silence |

To do it for another file: decode to mono with ffmpeg, compute RMS in dB
per 0.25 s window, and look for the same landmarks (the quiet theme return,
the first big tutti, the long loud plateau, the dead stop, the final chord).
Set `cueDuration` to the file's duration so the cues are not rescaled.

## Photographs

All seventeen photographs are from Unsplash and Pexels under licences that
allow commercial use; photographer, source page, licence and any rotation
applied are listed in [`photos/SOURCES.md`](photos/SOURCES.md).

## Rendering

```bash
npm i playwright-core                # plus a Chromium; set CHROMIUM=/path/to/chrome if needed
pip install imageio-ffmpeg           # or set FFMPEG=/path/to/ffmpeg
node render.mjs contact              # stills at key moments -> out/stills
node render.mjs contact 4,33,80,150  # stills at chosen seconds
node render.mjs full 30 18           # full video at 30 fps, CRF 18 -> out/doodles.mp4
```

Or open `index.html` in a browser and press Play; drop in another audio
file to see the same doodles drawn to different notes.
