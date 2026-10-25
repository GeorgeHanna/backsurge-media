# backsurge-media

Everything for Backsurge's organic marketing, in one public repo.

- `video/` the Remotion project that builds the daily videos (start with `video/README.md` and `video/CLAUDE.md`)
- `media/YYYY-MM/` finished renders, posted to Buffer through jsDelivr links pinned to a commit sha
- `tts/` Kokoro voice model files (never deleted)

Link format: `https://cdn.jsdelivr.net/gh/GeorgeHanna/backsurge-media@<sha>/media/<file>`
Delete renders older than 30 days from `media/`.
