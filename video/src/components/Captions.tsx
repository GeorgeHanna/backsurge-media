import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { color, font } from '../brand';
import { useLayout } from '../layout';
import type { Word } from '../schema';

type Chunk = { words: Word[]; start: number; end: number };

/**
 * Group words into short caption chunks: at most 3 words / ~18 characters,
 * breaking early after punctuation. Short chunks read well on phones.
 */
export function chunkWords(words: Word[], maxWords = 3, maxChars = 18): Chunk[] {
	const chunks: Chunk[] = [];
	let cur: Word[] = [];
	const flush = () => {
		if (cur.length) chunks.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
		cur = [];
	};
	for (const w of words) {
		const len = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
		if (cur.length && (cur.length >= maxWords || len > maxChars)) flush();
		cur.push(w);
		if (/[.,!?;:—]$/.test(w.text)) flush();
	}
	flush();
	// Keep each chunk on screen until the next one starts (no flicker in pauses < 0.6s).
	for (let i = 0; i < chunks.length - 1; i++) {
		const gap = chunks[i + 1].start - chunks[i].end;
		if (gap < 0.6) chunks[i].end = chunks[i + 1].start;
	}
	return chunks;
}

/** Burned-in captions for one scene's voiceover. The spoken word lights up orange. */
export const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const { content, wide } = useLayout();
	const chunks = useMemo(() => chunkWords(words), [words]);
	const t = frame / fps;
	const chunk = chunks.find((c) => t >= c.start - 0.05 && t < c.end + 0.15);
	if (!chunk) return null;

	const pop = spring({ frame: frame - Math.round(chunk.start * fps), fps, config: { damping: 14, stiffness: 260, mass: 0.6 } });
	const size = wide ? 64 : 72;

	return (
		<AbsoluteFill style={{ pointerEvents: 'none' }}>
			<div
				style={{
					position: 'absolute',
					top: content.captionY,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					transform: `scale(${0.85 + 0.15 * pop})`,
					opacity: interpolate(pop, [0, 0.4], [0, 1])
				}}
			>
				<div
					style={{
						display: 'flex',
						gap: size * 0.28,
						padding: `${size * 0.16}px ${size * 0.4}px`,
						borderRadius: 22,
						background: 'rgba(5,7,11,0.72)',
						fontFamily: font.family,
						fontWeight: 850,
						fontSize: size,
						letterSpacing: '-0.02em',
						lineHeight: 1.1,
						textTransform: 'none'
					}}
				>
					{chunk.words.map((w, i) => {
						// The word being spoken is orange, spoken words white, upcoming ones dim.
						const current = chunk.words.reduce((c, x, j) => (t >= x.start - 0.03 ? j : c), -1);
						return (
							<span
								key={i}
								style={{
									color: i === current ? color.surge : i < current ? color.fg : 'rgba(228,232,239,0.45)',
									textShadow: '0 4px 18px rgba(0,0,0,0.6)'
								}}
							>
								{w.text}
							</span>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};
