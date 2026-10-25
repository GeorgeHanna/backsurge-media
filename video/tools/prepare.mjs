#!/usr/bin/env node
// Voiceover + caption timings for one or more videos.
//   npm run prepare-video -- explainer slice-stars
//   npm run prepare-video -- --all
// If recordings/<id>/ exists, your own recordings are used (one file per voiced
// line: 01.wav, 02.m4a, …). Otherwise a placeholder AI voice is generated.
// Sound effects and music are generated once if missing.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const py = process.env.PYTHON || 'python3';
const run = (...args) => execFileSync(py, ['tools/audio.py', ...args], { stdio: 'inherit' });

if (!existsSync('public/sfx/whoosh.wav')) run('sfx');
if (!existsSync('public/music/drive.wav')) run('music');

let ids = process.argv.slice(2);
if (ids.length === 0 || ids[0] === '--all') ids = readdirSync('videos').filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
for (const id of ids) {
	const recorded = existsSync(`recordings/${id}`);
	console.log(`\n▶ ${id} (${recorded ? 'your recordings' : 'placeholder AI voice'})`);
	run(recorded ? 'import' : 'voice', id);
}
