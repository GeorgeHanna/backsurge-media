#!/usr/bin/env node
// Compose background music for a video, timed to its scenes.
//   npm run music -- launch                 uses music/launch.json (hand-made cue sheet)
//   npm run music -- explainer              builds the cue sheet from the video's timeline
// Output: public/generated/<id>/music.wav + music.mid (open the .mid in a DAW to change instruments).
import { bundle } from '@remotion/bundler';
import { selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const py = process.env.PYTHON || 'python3';
const ids = process.argv.slice(2);
if (!ids.length) {
	console.error('Usage: npm run music -- <id> [<id> …]');
	process.exit(1);
}
let serveUrl = null;
for (const id of ids) {
	const out = `public/generated/${id}`;
	mkdirSync(out, { recursive: true });
	let sheet = `music/${id}.json`;
	if (!existsSync(sheet)) {
		// Derive sections from the rendered timeline: hook = intro, the first product
		// scene = drop (the scene before it lifts), end card = outro.
		const script = JSON.parse(readFileSync(`videos/${id}.json`, 'utf8'));
		serveUrl ??= await bundle({ entryPoint: path.resolve('src/index.ts') });
		const fmt = (script.formats ?? ['vertical'])[0];
		const comp = await selectComposition({ serveUrl, id: `${id}-${fmt}`, browserExecutable: process.env.REMOTION_CHROME || null });
		const tl = comp.props.timeline;
		const sec = (f) => +(f / comp.fps).toFixed(3);
		const scenes = script.scenes;
		let drop = scenes.findIndex((s, i) => i >= 2 && ['dashboard', 'map', 'quadrant', 'chart', 'verdict'].includes(s.type));
		if (drop < 0) drop = Math.min(2, scenes.length - 1);
		const end = scenes.length - 1;
		const sections = [{ at: 0, part: 'intro' }];
		if (tl[1] && drop > 1) sections.push({ at: sec(tl[1].from), part: 'build' });
		if (drop - 1 >= 1 && drop - 1 > 1) sections.push({ at: sec(tl[drop - 1].from), part: 'lift' });
		if (drop < end) sections.push({ at: sec(tl[drop].from), part: 'drop' });
		const brk = Math.floor((drop + end) / 2);
		if (brk > drop + 1 && brk < end) sections.push({ at: sec(tl[brk].from), part: 'break' });
		if (end > 0) sections.push({ at: sec(tl[end].from), part: 'outro' });
		const cue = { duration: sec(comp.durationInFrames), style: script.music?.style ?? (script.music?.track !== 'midi' ? script.music?.track : undefined) ?? 'drive', seed: 1, sections, hits: [] };
		sheet = `${out}/cue.json`;
		writeFileSync(sheet, JSON.stringify(cue, null, 1));
	}
	execFileSync(py, ['tools/midi_music.py', sheet, out], { stdio: 'inherit' });
}
