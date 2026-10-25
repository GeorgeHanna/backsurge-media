#!/usr/bin/env node
// Render videos to out/<id>-<format>.mp4.
//   npm run render -- explainer             all formats in the script
//   npm run render -- explainer vertical    one format
//   npm run render -- --all
// Run `npm run prepare-video -- <id>` first so the voiceover exists.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

const args = process.argv.slice(2);
const all = args[0] === '--all';
const ids = all ? readdirSync('videos').filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : [args[0]];
const only = all ? null : args[1];
if (!ids[0]) {
	console.error('Usage: npm run render -- <video-id> [vertical|square|wide]  |  --all');
	process.exit(1);
}

for (const id of ids) {
	const script = JSON.parse(readFileSync(`videos/${id}.json`, 'utf8'));
	const formats = only ? [only] : script.formats ?? ['vertical', 'square', 'wide'];
	for (const f of formats) {
		console.log(`\n▶ ${id}-${f}`);
		execFileSync('npx', ['remotion', 'render', 'src/index.ts', `${id}-${f}`, `out/${id}-${f}.mp4`], { stdio: 'inherit' });
	}
}
