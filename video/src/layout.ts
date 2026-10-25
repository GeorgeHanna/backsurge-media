import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { motion } from './brand';

export const FORMATS = {
	vertical: { width: 1080, height: 1920 }, // TikTok, Reels, Shorts
	square: { width: 1080, height: 1080 }, // feed posts
	wide: { width: 1920, height: 1080 } // YouTube, X, LinkedIn, landing page
} as const;
export type Format = keyof typeof FORMATS;

/**
 * Where things go in each format. Everything is designed on a 1080px short
 * side, so sizes in px work in all three. Vertical keeps clear of the
 * platform UI (top bar, caption + buttons at the bottom right).
 */
export function useLayout() {
	const { width, height } = useVideoConfig();
	const format: Format = height > width ? 'vertical' : width > height ? 'wide' : 'square';
	const box = {
		vertical: { top: 260, bottom: 1340, left: 70, right: 1010, captionY: 1430 },
		square: { top: 70, bottom: 820, left: 70, right: 1010, captionY: 905 },
		wide: { top: 80, bottom: 860, left: 160, right: 1760, captionY: 935 }
	}[format];
	// Scene content is drawn at this zoom: bigger on phones, where it is seen small.
	const zoom = { vertical: 1.25, square: 1, wide: 1.15 }[format];
	return {
		format,
		zoom,
		// Content box in the zoomed coordinate system scenes draw in.
		inner: { width: (box.right - box.left) / zoom, height: (box.bottom - box.top) / zoom },
		width,
		height,
		vertical: format === 'vertical',
		wide: format === 'wide',
		square: format === 'square',
		content: { ...box, width: box.right - box.left, height: box.bottom - box.top }
	};
}

/** 0 → 1 spring, starting `delay` frames into the scene. */
export function useEnter(delay = 0, cfg: 'spring' | 'springSoft' | 'springPop' = 'spring') {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	return spring({ frame: frame - delay, fps, config: motion[cfg] });
}

/** Standard "rise in" style for an element that appears `delay` frames in. */
export function useRise(delay = 0, distance = 40) {
	const p = useEnter(delay);
	return {
		opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' }),
		transform: `translateY(${(1 - p) * distance}px)`
	} as const;
}

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Seeded random, so every render draws the same thing. */
export function mulberry32(seed: number) {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}
