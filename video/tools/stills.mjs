#!/usr/bin/env node
// Quick visual check without rendering video: PNGs from each scene plus a
// contact sheet, in out/stills/. Half size by default.
//   npm run stills -- explainer                 all formats, 75% into each scene
//   npm run stills -- explainer vertical
//   npm run stills -- explainer vertical 0.2,0.5,0.9   several moments per scene
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const [id, only, at = '0.75'] = process.argv.slice(2);
const moments = at.split(',').map(Number);
if (!id) {
	console.error('Usage: npm run stills -- <video-id> [vertical|square|wide]');
	process.exit(1);
}
const script = JSON.parse(readFileSync(`videos/${id}.json`, 'utf8'));
const formats = only ? [only] : script.formats ?? ['vertical', 'square', 'wide'];
const browserExecutable = process.env.REMOTION_CHROME || null;

const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
mkdirSync('out/stills', { recursive: true });

for (const f of formats) {
	const composition = await selectComposition({ serveUrl, id: `${id}-${f}`, browserExecutable });
	const files = [];
	for (const [i, t] of composition.props.timeline.entries()) {
		for (const [k, m] of moments.entries()) {
			const frame = t.from + Math.min(t.frames - 1, Math.round(t.frames * m));
			const output = `out/stills/${id}-${f}-${String(i).padStart(2, '0')}${moments.length > 1 ? `-${k}` : ''}.png`;
			await renderStill({ serveUrl, composition, frame, output, browserExecutable, scale: 0.5, inputProps: { ...composition.props, preview: true } });
			files.push(output);
		}
	}
	const sheet = `out/stills/${id}-${f}-sheet.png`;
	const cols = moments.length > 1 ? moments.length * (f === 'wide' ? 1 : 2) : f === 'wide' ? 3 : 5;
	const w = f === 'vertical' ? 270 : f === 'square' ? 360 : 480;
	const layout = files
		.map((_, i) => {
			const r = Math.floor(i / cols);
			return `${(i % cols) * w}_${r === 0 ? '0' : Array(r).fill('h0').join('+')}`;
		})
		.join('|');
	try {
		execFileSync('ffmpeg', [
			'-y', '-loglevel', 'error',
			...files.flatMap((x) => ['-i', x]),
			'-filter_complex',
			files.map((_, i) => `[${i}:v]scale=${w}:-1[s${i}]`).join(';') +
				';' + files.map((_, i) => `[s${i}]`).join('') + `xstack=inputs=${files.length}:layout=${layout}:fill=black`,
			sheet
		]);
		console.log(`${f}: ${files.length} stills, contact sheet ${sheet}`);
	} catch {
		console.log(`${f}: ${files.length} stills in out/stills/`);
	}
}
