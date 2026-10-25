#!/usr/bin/env node
// Writes RECORDING-SCRIPT.md: every voiceover line to record, numbered the way
// `npm run prepare-video` expects the files (recordings/<id>/01.wav, 02.wav, …).
//   npm run recording-script                 all videos
//   npm run recording-script -- slice- feature-   only ids starting with these
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const prefixes = process.argv.slice(2);
const ids = readdirSync('videos')
	.filter((f) => f.endsWith('.json'))
	.map((f) => f.slice(0, -5))
	.filter((id) => !prefixes.length || prefixes.some((p) => id.startsWith(p)))
	.sort((a, b) => (a.startsWith('slice') === b.startsWith('slice') ? a.localeCompare(b) : a.startsWith('slice') ? -1 : 1));

const onScreen = (s) =>
	s.type === 'hook' ? s.lines.join(' ') : s.type === 'text' ? [s.title, s.subtitle].filter(Boolean).join(' / ') : s.type === 'end' ? s.headline ?? '' : s.type === 'quadrant' ? `${s.meaning} (${s.fixes.map((f) => f.text).join(', ')})` : `[${s.type}${s.page ? `: ${s.page}` : ''}]`;

let md = `# Voiceover script

Generated from \`videos/*.json\` by \`npm run recording-script\`. Edit the scripts there, not here.

**How to record**
- One file per numbered line, saved as \`recordings/<video>/01.wav\`, \`02.wav\`, … (m4a/mp3 from your phone is fine).
- Talk like you're showing a friend, not reading. Small stumbles are fine; re-record a line if it's really off.
- A second of silence at the start and end is fine, it gets trimmed. Pauses between sentences help the caption timing.
- Stick close to the words: captions show the script text. If you change a line, change \`vo\` in the JSON too.
- Then: \`npm run prepare-video -- <video>\` and \`npm run preview -- <video>\`.
`;
for (const id of ids) {
	const v = JSON.parse(readFileSync(`videos/${id}.json`, 'utf8'));
	const lines = v.scenes.filter((s) => s.vo);
	if (!lines.length) continue;
	const words = lines.reduce((n, s) => n + s.vo.split(/\s+/).length, 0);
	md += `\n---\n\n## ${v.title}\n\n\`${id}\` · ${lines.length} lines · about ${Math.round(words / 2.9)}s of talking\n\n`;
	lines.forEach((s, i) => {
		md += `**${String(i + 1).padStart(2, '0')}** — ${s.vo}\n\n<sub>On screen: ${onScreen(s)}</sub>\n\n`;
	});
}
writeFileSync('RECORDING-SCRIPT.md', md);
console.log(`RECORDING-SCRIPT.md: ${ids.length} videos`);
