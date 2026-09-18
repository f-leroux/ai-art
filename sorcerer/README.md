# The Sorcerer's Apprentice — objects coming alive

A multi-scene music video in the pastel-paper style of Kevin Ngo's doodle
pieces: photo-shaded household objects (kettle, teacups, alarm clock, toaster,
radio, sock, boots) brought to life by sketchy ink limbs and faces, coloured
pencil fills, and hand-lettered sound effects.

An apprentice mouse enchants the kettle to do the washing up. The kettle
wakes, the cups follow, the whole shelf joins a parade, the kettles multiply,
the kitchen floods, everything circles the drain, and the Master comes home
and snaps his fingers on the final chord.

Music: the finale of Dukas's *L'apprenti sorcier* (1897), cut from a longer
radio recording (8:06 to 10:20 of the source file). The scene cues in
`CONFIG.cues` are set on that recording's own boundaries: the theme's
return, the multiplication hit at 40.2 s, the piccolo shriek at 88.5 s, the
door at 104 s, the final chord at 128.6 s.

What listens to the music:

- onsets → every living object hops; kettles and cups bob, the toaster pops
- accents → the clock rings, flowers of sparkles, splashes
- note count / time → how many kettles exist in the multiplication scene
- loudness → wave height, camera breathing, the radio's notes
- high band → the kettle whistle ("FWEEE!") and steam

```bash
node render.mjs contact 3,30,70,129
node render.mjs full 30 18          # -> out/sorcerer.mp4
```
