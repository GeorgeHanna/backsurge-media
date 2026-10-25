# Backsurge marketing videos

Every video is code: a short JSON script in `videos/` becomes an MP4 in three
formats, with voiceover, burned-in captions, sound effects and music. The
product is shown as an animated mockup of the real dashboard (mock data),
filmed with camera moves. Nothing is filmed, recorded or licensed.

| Piece | Tool | Licence |
|---|---|---|
| Animation + rendering | [Remotion](https://www.remotion.dev) (React → MP4) | Free for individuals and companies up to 3 people; paid company licence above that |
| Voiceover | [Kokoro-82M](https://github.com/hexgrad/kokoro) via [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx), runs on CPU | Apache-2.0 / MIT |
| Captions | Word timings from the TTS step, no speech recognition needed | ours |
| Sound effects + music | Synthesised with numpy in `tools/audio.py` | ours |
| Font | Inter (same as the site) | OFL |

## Setup (once)

```bash
cd video
npm run setup     # Node + Python packages, voice model, sound effects, FluidSynth + SoundFont, headless Chrome
```

Needs Node 22+, Python 3.10+ and ffmpeg. Every step checks first, so re-running is safe.

## Make a video (one command)

```bash
npm run make -- launch                  # launch Short: music + low-quality preview → out/preview/
npm run make -- slice-stars             # script video: voice/captions + music if needed + preview
npm run make -- explainer wide          # another format
npm run final -- launch                 # full quality → out/launch-vertical.mp4
npm run final -- explainer              # every format in the script
```

`make` only redoes what changed (voiceover when the script or recordings change, music when
the timeline changes). Previews are deliberately low quality and fast; use `final` once a
preview looks right.

## Music (generated MIDI)

`npm run music -- <id>` composes a background track for a video and writes
`public/generated/<id>/music.mid` + `music.wav`. Tempo and a start offset are picked so the
video's big moments (the drop, the end card) land on bar lines.

- **Launch Short:** cue sheet in `music/launch.json` (section times in seconds). `launch-vertical`
  plays it; `launch-nomusic-vertical` is the same Short without music.
- **Script videos:** set `"music": { "track": "midi", "style": "drive" }` and the cue sheet is
  built from the video's timeline (hook = intro, first product scene = drop, end card = outro).
- Styles: `drive` (108–126 bpm, minor), `pulse` (118–132, minor), `chill` (80–96, major).
  Change `seed` for a different variation.
- Rendered with FluidSynth and the FluidR3 General MIDI SoundFont (MIT). Without them it falls
  back to a built-in synth. Open the `.mid` in GarageBand/FL/Ableton to swap instruments.
- Every note is generated, so the music is ours: no licences, nothing for Content ID to flag.

## Your own voiceover

The AI voice is a placeholder for timing. To use your voice:

1. `npm run recording-script` writes `RECORDING-SCRIPT.md`: every line to record, numbered per video.
2. Record one file per line into `recordings/<video>/`: `01.wav`, `02.m4a`, … (phone recordings are fine).
3. `npm run prepare-video -- <video>` now uses your recordings: it trims silence, evens out the
   level (−16 LUFS) and times the captions to your voice. With `pip install faster-whisper`
   the word timing is exact; without it, sentences are matched to your pauses.
4. `npm run preview -- <video>`.

Captions show the script's words. If you say something different, update `vo` in the JSON
so the captions match. `recordings/` is not committed.

## Individual steps (what `make` runs)

```bash
npm run prepare-video -- explainer          # voiceover + caption timings → public/generated/explainer/
npm run preview -- explainer                # FAST low-quality check: out/preview/explainer-vertical.mp4
npm run preview -- explainer wide           # other formats; add a scale (e.g. 0.5) for a sharper look
npm run stills -- explainer vertical 0.2,0.5,0.9   # PNGs at 20/50/90% of every scene + a contact sheet
npm run studio                              # scrub it live in the browser
npm run render -- explainer                 # FINAL full-quality renders (do these on a proper PC)
```

Previews render at ~1/3 size with heavy compression and no film grain, so a
45-second video takes a minute or two. Only run `render` once a preview looks
right. Change the script, run `prepare-video` again if the voiceover changed,
preview again.

## Formats

| Format | Size | For |
|---|---|---|
| `vertical` | 1080×1920 | TikTok, Reels, Shorts |
| `square` | 1080×1080 | Feed posts |
| `wide` | 1920×1080 | YouTube, X, LinkedIn, the landing page |

A script renders in all three unless it sets `"formats"`. Layout per format
(content box, caption line, zoom) lives in `src/layout.ts`. Vertical keeps
clear of the platform UI at the top and bottom.

## Writing a script

```jsonc
{
  "id": "four-types",                  // file name, composition id prefix
  "title": "The 4 types of YouTube videos",
  "formats": ["vertical", "square"],   // optional
  "voice": { "voice": "am_michael", "speed": 1.15 },  // optional, see voices below
  "music": { "track": "drive", "volume": 0.2 },        // drive | chill | pulse, optional
  "captions": true,                    // default true
  "scenes": [ /* … */ ]
}
```

Each scene lasts as long as its voiceover (plus a short breath) or its
`seconds`, whichever is longer. Write numbers and URLs in `vo` the way they
should be said ("fourteen days", "backsurge dot com"); the on-screen text can
differ.

**Timing cues.** Anything with `at` takes seconds from the scene start (`0.8`,
or negative for "already happened before this scene") or a word in the
scene's voiceover: `"@click"`, `"@click:2"` (second time it's said),
`"@click+0.3"`. Hooks, steps and fixes land on their words automatically.

Every scene also takes `vo`, `seconds`, `captions` (on by default except
`hook` and `end`, whose text is already on screen), `transition: "cut"` (no
exit/enter motion, for a scene that continues the previous one) and `sfx` for
extra sound cues: `[{ "name": "riser", "at": "@watch" }]`.

| Type | Shows | Fields |
|---|---|---|
| `hook` | The opener: lines slam in on their words, the orange line shakes the frame | `lines`, `accent` (orange line indexes), `kicker?` (small label), `visual?`: `title-swap` (a video's title gets rewritten + "?"), `quadrants` (4 video types), `views-drop`, `retention` (viewers drop at 0:30), `map` + `focus` (library map, one group lit) |
| `text` | Kicker, title, subtitle | `title`, `subtitle?`, `kicker?` |
| `dashboard` | The Backsurge dashboard with mock data, filmed with camera moves | `page`, `shots`, `beats`, `notify?`, `edit?` (see below) |
| `map` | The library map building up: axes, videos, four groups | `title?`, `focus?` + `focusAt?` (light up one group), `groupsAt?` (default: when "four" is said), `build` |
| `quadrant` | Zooms the map into one group: what it means and what to do | `cluster`, `meaning`, `fixes[{text, at?}]`. Chain them with `"transition": "cut"` |
| `steps` | "How it works", each step lands on its voiceover word | `title?`, `steps[{title,text}]` |
| `change`, `alert`, `chart`, `verdict` | Single product moments as big cards | see `src/schema.ts` |
| `features` | Feature chips | `title?`, `items[]` |
| `end` | Logo, "For YouTube creators", headline, CTA + URL, or "Follow for more" | `headline?`, `kicker?` (`""` hides it), `cta?`, `sub?`, `follow?` |

### Dashboard scenes

```jsonc
{
  "type": "dashboard",
  "page": "changes",                      // overview | changes | video
  "shots": [                               // where the camera looks, and when
    { "at": 0, "focus": "cardA-top", "enter": "rise" },   // enter: tilt | rise (first shot only)
    { "at": "@one", "focus": "cardA-box" }
  ],
  "beats": { "click": "@experiment" },    // when things happen on the page
  "notify": { "at": "@email", "title": "We spotted a change…", "text": "…" },  // email notification
  "edit": { "at": "@title", "out": "@spot", "old": "…", "new": "…" },          // a phone editing a title
  "vo": "One click turns it into an experiment."
}
```

| Page | Camera regions (`focus`) | Beats |
|---|---|---|
| `overview` | `full`, `page`, `title`, `stats`, `stat-tracking`, `map`, `map-plot`, `legend`, `tracking`, `tracking-row`, `videos` | `stats` (count up), `map` (dots sweep in), `gems` (hidden gems light up), `spot` (a change is spotted: new row, counter +1) |
| `changes` | `full`, `page`, `title`, `cardA`, `cardA-top`, `cardA-table`, `cardA-box`, `cardA-verdict`, `cardB`, `cardB-thumbs`, `cardB-footer` | `click` (14-day experiment starts), `ff` ("12 days later", results fill in), `verdict` ("Winning"), `revert` (losing thumbnail restored) |
| `video` | `full`, `page`, `header`, `stats`, `chart`, `form`, `form-input`, `history`, `form+history` | `chart` (bars grow), `type` (new title typed), `submit` (changed on YouTube). `"form": "manual"` logs a change like chapters instead |

On the overview, `"highlight": "<group>"` with a `highlight` beat lights up any group (default hidden gems).

A beat left out has already happened (or never happens, for actions). To
continue a page across scenes, repeat earlier beats with negative times, e.g.
`"click": -2` in the scene after the click.

New scene type: add it to `src/schema.ts`, write the component in
`src/scenes/`, map it in `SceneView` and give it sound cues in `builtInSfx`
(both in `src/Video.tsx`).

## Example scripts

- `explainer` (~45s): the whole product on the dashboard, hook to CTA.
- `four-types` (~47s): the four types of YouTube videos and how to fix each, then Backsurge.
- `library-map` (~14s): one feature, for socials.
- `teaser` (~9s): no voice, music only. Good for ads and loops.
- `tip-one-change` (~12s): a tip with a "follow for more" ending.
- `feature-*` (11–17s each): one feature each: change log, alerts, experiments, verdicts, undo,
  library map, editing from Backsurge.
- `slice-*` (30–45s each): a 4-part informative series, one per video type (hidden gems →
  wide reach → underperformers → stars), each teasing the next. Backsurge appears once, softly.

## Image posts

`npm run posts` renders every post to `out/posts/` (1080×1350 PNG, the 4:5 size for
Instagram, LinkedIn and TikTok photo posts) plus a contact sheet per carousel. Designs live
in `src/posts/`: `kit.tsx` has the look (paper / ink / orange, heavy type, hand-drawn marker
circles, arrows and ticks in Caveat, paper grain), `posts.tsx` the content.

- `types-1…7`: carousel, the 4 types of YouTube videos and what to do with each.
- `test-1…7`: carousel, 5 rules for knowing if a title change worked.
- `single-*`: cheat sheet, hidden-gem checklist, "Day 1 numbers lie", one change at a time.

Add a post: write a component in `posts.tsx` and add it to `POSTS`.

## Brand

Colours, font and motion settings are in `src/brand.ts`, taken from
`frontend/src/routes/layout.css` and `frontend/src/lib/format.ts`. The
dashboard mockup (`src/dashboard/`) mirrors the real pages in
`frontend/src/routes/dashboard`; mock data lives in `src/dashboard/data.ts`.
If the app's UI changes, update the mockup so videos stay honest.

## Audio

```bash
python3 tools/audio.py voices        # list voices
npm run audio:sfx                    # rebuild public/sfx/*.wav
npm run audio:music                  # rebuild public/music/*.wav
```

- **Voices**: `am_michael` (default), `am_adam`, `am_eric`, `af_heart`,
  `af_bella`, `af_nicole`, `bm_george`, `bf_emma` and more. Swap per script.
  Default speed is 1.15 for a snappy read.
- **Sound effects**: whoosh, pop, click, tick, ding, notify, riser, impact,
  swipe, count. Scenes add their own cues (clicks on clicks, ticks while
  typing, a ding when a verdict lands); `sfx` in a scene adds more.
- **Music**: three loopable beds (`drive` 112 bpm, `chill` 86 bpm, `pulse`
  124 bpm). The music ducks under the voice automatically and fades out at
  the end. Tweak or add styles in `render_track()`.

## Tips for the videos themselves

- Hook in the first second, before any logo, and say "YouTube" in it.
- One idea per short video. Long explainers for the site and YouTube; cut
  single-feature clips for socials.
- Most people watch muted: keep captions on and on-screen text self-explanatory.
- Product numbers are illustrative sample data (the "Crumb Theory" sample
  baking channel). Keep claims to what the product does.
- Vary hooks, visuals and music between posts so the channel doesn't look
  mass-produced.

## Rendering without internet access to Google

Remotion downloads a headless Chrome on first render. If that is blocked,
point it at any Chrome/Chromium: `REMOTION_CHROME=/path/to/chrome npm run preview -- teaser`.

## Daily video log

One row per daily social video, so the weekly review can see which combination works. Each
new video picks a combination not used in the last 7 (see the role doc's Video playbook).

| Date | Title | Hook type | Visual style | Voice | Music | Format | Length | Pacing |
|---|---|---|---|---|---|---|---|---|
| 2026-10-25 | YouTube Search Terms: See What Viewers Typed to Find You (`search-terms`) | mistake reveal ("Your YouTube title is a guess.") | retro terminal diagnostic, phosphor green on black, VT323 + IBM Plex Mono (`src/styles/terminal/`) | Kokoro `bm_george` 1.12 | synthwave 98 bpm (numpy) + new SFX: key clicks, CRT power-on, error buzz, OK chirp, scan wipe | 16:9 wide | 61 s | calm (4 to 6 s holds), full-line captions |
| 2026-10-25 | views-stuck (Daisy) | callout | kid-drawn Daisy | none | quirky | 9:16 | 28 s | fast |
