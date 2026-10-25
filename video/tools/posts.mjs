#!/usr/bin/env node
// Render the image posts to out/posts/ at full size (1080×1350 PNG), plus a
// contact sheet per carousel. Stills are cheap, so these are final quality.
//   npm run posts                 all posts
//   npm run posts -- types        only ids containing "types"
import { bundle } from '@remotion/bundler';
import { getCompositions, renderStill } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const filter = process.argv[2] ?? '';
const browserExecutable = process.env.REMOTION_CHROME || null;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const posts = (await getCompositions(serveUrl, { browserExecutable })).filter((c) => c.id.startsWith('post-') && c.id.includes(filter));
mkdirSync('out/posts', { recursive: true });

const groups = {};
for (const composition of posts) {
	const output = `out/posts/${composition.id.replace(/^post-/, '')}.png`;
	await renderStill({ serveUrl, composition, output, browserExecutable, imageFormat: 'png' });
	const g = composition.id.match(/^post-(types|test|single)/)?.[1] ?? 'other';
	(groups[g] ??= []).push(output);
	console.log(output);
}
for (const [g, files] of Object.entries(groups)) {
	if (files.length < 2) continue;
	const sheet = `out/posts/_sheet-${g}.png`;
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap((f) => ['-i', f]), '-filter_complex',
		files.map((_, i) => `[${i}:v]scale=360:-1[s${i}]`).join(';') + ';' + files.map((_, i) => `[s${i}]`).join('') + `hstack=inputs=${files.length}`, sheet]);
	console.log(`contact sheet: ${sheet}`);
}
