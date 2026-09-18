# Doodles for the Apprentice — photographs brought to life

The style of Kevin Ngo's doodle pieces: real photographs, pinned to pastel
paper, with doodles drawn over them in JavaScript that turn each object into
something else. Here the doodles draw themselves stroke by stroke on the
notes of the finale of Dukas's *L'apprenti sorcier*.

- a coffee cup becomes the gondola of a hot-air balloon (the spoon is the anchor)
- a tray of ancient coins becomes a choir, each face singing on the notes
- a rocket launch pad becomes a beach party, and the rocket a firework that
  goes up on the piccolo shriek
- a cat becomes the Master Sorcerer, who snaps his paw on the final chord and
  erases the lot

## How it works

`index.html` holds a small stroke engine: every doodle is an ordered list of
ink strokes, coloured-pencil fills and hand-lettered captions in the photo's
own pixel space. Progress through the list follows the note onsets found by
the audio analysis (and never falls behind a per-scene deadline), so the
drawing happens on the music. Finished doodles then animate: the balloon
bobs, the singers open their mouths on onsets, fireworks burst on accents.

Swap in your own photographs by changing `PHOTO_SRC` / `PHOTO_SIZE` and
writing a new doodle function in photo coordinates. The sample photographs
here are the scikit-image test images (coffee, coins, rocket, chelsea);
replace them with licensed images before commercial use.

```bash
node render.mjs contact 26,46,66,116
node render.mjs full 30 18     # -> out/doodles.mp4
```
