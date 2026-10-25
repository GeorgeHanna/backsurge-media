#!/usr/bin/env node
// One command per video: voiceover + caption timings (if needed), music (if the
// video uses generated music), then a render.
//   npm run make -- <id> [vertical|square|wide]        low-quality preview → out/preview/
//   npm run final -- <id> [vertical|square|wide]       full quality       → out/
// <id> is a script in videos/<id>.json, or a hand-built Short from the custom map below.
// Steps are skipped when their output is newer than their input.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const args = process.argv.slice(2);
const final = args.includes('--final');
const [id, format] = args.filter((a) => !a.startsWith('--'));
if (!id) {
	console.error('Usage: npm run make -- <id> [format]   |   npm run final -- <id> [format]');
	process.exit(1);
}
// Use the browser setup found (see tools/setup.sh) if Remotion can't fetch its own.
if (!process.env.REMOTION_CHROME && existsSync('.chrome-path')) {
	let p = readFileSync('.chrome-path', 'utf8').trim();
	if (!existsSync(p)) {
		// The npm Chromium unpacks into /tmp, which can be wiped: unpack it again.
		const dir = `${process.env.HOME}/.cache/backsurge-video/chromium`;
		p = execFileSync('node', ['-e', "import('@sparticuz/chromium').then(async m=>console.log(await m.default.executablePath()))"], { cwd: dir }).toString().trim();
	}
	process.env.REMOTION_CHROME = p;
}
const run = (cmd, a) => execFileSync(cmd, a, { stdio: 'inherit', env: process.env });
const newer = (out, ...ins) => existsSync(out) && ins.every((i) => !existsSync(i) || statSync(out).mtimeMs >= statSync(i).mtimeMs);

const custom = {
	launch: { comp: 'launch', formats: ['vertical'], music: 'music/launch.json' },
	...Object.fromEntries(['did-it-work', 'which-videos', 'change-history', 'views-stuck'].map((id) => [id, { comp: id, formats: ['vertical'], music: `music/${id}.json` }]))
};
let comp = id;
let formats;
if (custom[id]) {
	const c = custom[id];
	comp = c.comp;
	formats = c.formats;
	if (existsSync('tools/flat-music.py')) run('python3', ['tools/flat-music.py', id]); // cue sheets follow the beat lengths
	if (!newer(`public/generated/${id}/music.wav`, c.music, 'tools/midi_music.py')) run('node', ['tools/music.mjs', id]);
} else {
	const file = `videos/${id}.json`;
	const script = JSON.parse(readFileSync(file, 'utf8'));
	formats = script.formats ?? ['vertical', 'square', 'wide'];
	if (script.scenes.some((s) => s.vo) && !newer(`public/generated/${id}/manifest.json`, file, `recordings/${id}`)) run('node', ['tools/prepare.mjs', id]);
	if (script.music?.track === 'midi' && !newer(`public/generated/${id}/music.wav`, file, `public/generated/${id}/manifest.json`, 'tools/midi_music.py'))
		run('node', ['tools/music.mjs', id]);
}
for (const f of format ? [format] : final ? formats : ['vertical']) {
	if (final) run('npx', ['remotion', 'render', 'src/index.ts', `${comp}-${f}`, `out/${id}-${f}.mp4`, '--log=error']);
	else run('node', ['tools/preview.mjs', comp, f]);
	console.log(final ? `Final: out/${id}-${f}.mp4` : `Preview: out/preview/${comp}-${f}.mp4`);
}
