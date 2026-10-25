# Marketing videos: working notes for Claude

Read README.md first; it documents the scene types, cues and dashboard pages.

- **Daily social videos must vary (George, 2026-10-25).** The marketing director's role doc
  (Claude Docs `66bcffce-9721-43de-8be1-85bb7834d957`, "Video playbook") wins over this file
  for daily videos. Only two things are fixed: a very strong hook bordering on provocative,
  and a real tip that helps creators improve their channel or videos. Everything else rotates:
  visual style, palette, fonts, voice, music, sound effects, format, length and pacing. The
  kid-drawn Daisy world and the black/white/yellow hook below are ONE style among many, not
  the default; don't make two videos in a row that look alike. Build new styles as new
  components (e.g. `src/styles/<name>/`) and log each video's combination in README's table.

- **Start every session with `npm run setup`** (idempotent), then use `npm run make -- <id>`
  (preview) and `npm run final -- <id>` (full quality, only when George asks).
- **Previews are always low quality** (`make` does this: ~1/3 size, heavy compression, no
  grain). Use `npm run stills` for single frames. Full quality (`final`) only when George asks;
  run it in the background and don't poll it.
- `make` regenerates voiceover and music when their inputs change; if running steps by hand,
  run `npm run prepare-video -- <id>` after changing any `vo`.
- Run `python3 tools/check-cues.py` after editing scripts (word cues and hook timing).
- Every video: a hook in the first second that says "YouTube", snappy pacing
  (scenes of 2–5 s), captions on, end card with backsurge.com.
- The dashboard mockup in `src/dashboard/` must match the real app
  (`frontend/src/routes/dashboard`, `frontend/src/lib/components/app`). Show
  only features that exist.
- No real YouTube UI, logos or real creators. "YouTube" as a word is fine.
- To look at a preview, pull frames with ffmpeg into a contact sheet, e.g.
  `ffmpeg -i out/preview/x-vertical.mp4 -vf "fps=2,scale=135:-1,tile=16x6" -frames:v 1 sheet.png`.
- Sample channel is "Frame Rate" (filmmaking/creator gear). Never go back to the baking theme.
- Thumbnails come from `src/components/Thumb.tsx` (`Thumb`, `VideoCard`): keep them looking like
  real YouTube thumbnails in a feed.
- Shorts: keep text inside the safe area (y 250–1440, x 70–930). Links in Shorts descriptions
  aren't clickable, so the URL goes on screen.
- Generated music: `npm run music -- <id>`; cue sheets in `music/`. Music is ours (no licences).
- Hand-built Shorts (not JSON scripts): `launch` (src/launch/) and the flat-style clips in
  src/flat/clips.tsx (`did-it-work`, `which-videos`, `change-history`). Cue sheets in
  music/<id>.json (style "quirky", "silence" sections; section times = beat starts / 30).
- **Cartoon style = kid-drawn (src/kid/), never close-ups.** George rejected "Dave" (close-ups),
  the limbless bean, "Sam" (generic person) and crayon textures. Now: simple child-like marker
  drawings (wobbly "boiling" lines via `WobbleDef`, plain flat colours, no texture) on paper with
  a sea strip and a sun in sunglasses (its mouth follows the beat: `sun` on a beat).
  **Daisy the surfer cow** is the narrator: she explains things to the viewer, and copy talks to
  "you" ("You change the title. Then you wait."). She is not the YouTuber and is never
  introduced ("viewers don't care"): she's just there. Go straight from the hook into the meat. Poses via `COW_POSES`; faces happy/
  neutral/unsure/shock/delighted/deadpan/sad/smug. No hands. The other animals in
  src/kid/cast.tsx (mole, rooster, goldfish, snail; `cast-sheet` still) are parked: not used now.
  Full-screen changes (hook → drawing, into the end card) get a big kid-drawn wave wipe with a
  "wave" sound, automatic when the background changes, or `wave: true` on a beat.
  Product UI cards stay clean (src/flat/props.tsx). Hooks: black, white text, yellow highlight.
  Headlines: Bricolage Grotesque 800, punchline in [brackets] on a yellow marker highlight,
  "|" = line break, auto-fitted, keep lines short. Clips are beat lists for `FlatClip` with
  `world="kid"`; layouts `center` (Daisy alone), `stage` (Daisy left, small card right), `focus`
  (big card, Daisy below). **Pacing: fast.** Screens with little text 2–2.5 s (60–75 frames);
  only title/thumbnail edits (`VideoEdit`, ~3–4 s) and animated results get longer. Clips 30–40 s.
- Music for these clips: George loves the "Banjo-Kazooie-ish" quirky soundtrack (style "quirky").
  Cue sheets come from the beat lengths: `tools/flat-music.py` (make.mjs runs it).
- Verticals (problems we solve), ranked: 1 "did my change work?" (experiments + verdicts),
  2 "which old videos are worth fixing?" (library map), 3 "what did I change, when?" (change
  log), 4 "someone changed my video" (email alerts), 5 "it flopped, what was the old title?"
  (one-click undo), 6 manual changes you log yourself (e.g. chapters) tracked too.
