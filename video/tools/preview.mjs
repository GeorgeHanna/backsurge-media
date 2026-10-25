#!/usr/bin/env node
// Fast, deliberately low-quality preview render to check timing, layout and
// sound. Final renders happen with `npm run render` on a proper machine.
//   npm run preview -- explainer            vertical, ~1/3 size
//   npm run preview -- explainer wide
//   npm run preview -- explainer vertical 0.5   (bigger)
// Output: out/preview/<id>-<format>.mp4
import { execFileSync } from 'node:child_process';
import { cpus } from 'node:os';

const [id, format = 'vertical', scale = '0.3'] = process.argv.slice(2);
if (!id) {
	console.error('Usage: npm run preview -- <video-id> [vertical|square|wide] [scale]');
	process.exit(1);
}
const out = `out/preview/${id}-${format}.mp4`;
execFileSync(
	'npx',
	[
		'remotion',
		'render',
		'src/index.ts',
		`${id}-${format}`,
		out,
		`--scale=${scale}`,
		'--crf=36',
		'--jpeg-quality=55',
		'--audio-bitrate=96k',
		`--concurrency=${Math.max(2, cpus().length)}`,
		'--props={"preview":true}',
		'--log=error'
	],
	{ stdio: 'inherit' }
);
console.log(`Preview: ${out}`);
