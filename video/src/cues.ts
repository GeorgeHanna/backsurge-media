import type { Word } from './schema';

/**
 * When something happens inside a scene. Either seconds from the scene start
 * (0.8), or a word in the scene's voiceover:
 *   "@click"      when "click" is said (first time)
 *   "@click:2"    second time it is said
 *   "@click+0.3"  0.3 s after it is said
 * Word cues fall back to the default when there is no voiceover yet.
 */
export type Cue = number | string;

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Frames before the word that visuals land, so they arrive with the word, not after it. */
const LEAD = 2;

export function cueFrame(at: Cue | undefined, words: Word[] | undefined, fps: number, fallback: number): number {
	if (at === undefined || at === null) return fallback;
	if (typeof at === 'number') return Math.round(at * fps);
	const m = at.match(/^@([^:+\-]+)(?::(\d+))?([+-][\d.]+)?$/);
	if (!m) return fallback;
	const target = norm(m[1]);
	const nth = Number(m[2] ?? 1);
	const offset = Number(m[3] ?? 0);
	let seen = 0;
	for (const w of words ?? []) {
		if (norm(w.text) === target && ++seen === nth) return Math.max(0, Math.round((w.start + offset) * fps) - LEAD);
	}
	return fallback;
}

/**
 * Frames for a list of items that should land as the voiceover reaches them:
 * each item lands on the first word of its text, searching forward from the
 * previous item. Unmatched items are spaced out after the previous one.
 */
export function sequenceFrames(texts: string[], words: Word[] | undefined, fps: number, first: number, spacing: number): number[] {
	let from = 0;
	let prev = first - spacing;
	return texts.map((text) => {
		const target = norm(text.split(/\s+/)[0] ?? '');
		const idx = words ? words.findIndex((w, j) => j >= from && norm(w.text) === target) : -1;
		let f: number;
		if (words && idx >= 0) {
			from = idx + 1;
			f = Math.max(0, Math.round(words[idx].start * fps) - LEAD);
		} else {
			f = prev + spacing;
		}
		prev = Math.max(f, prev + 3);
		return prev;
	});
}
