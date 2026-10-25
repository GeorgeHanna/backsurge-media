import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { color, motion } from '../brand';
import { Card } from '../components/ui';
import { clamp, useLayout, useRise } from '../layout';
import { sequenceFrames } from '../cues';
import type { Scene, Word } from '../schema';

type P<T extends Scene['type']> = { scene: Extract<Scene, { type: T }>; frames: number; words?: Word[] };

/** Centres a scene inside the format's content box, at the format's zoom. */
const Center: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 36 }) => {
	const { content, zoom } = useLayout();
	return (
		<AbsoluteFill
			style={{
				zoom,
				top: content.top / zoom,
				height: content.height / zoom,
				left: content.left / zoom,
				width: content.width / zoom,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				textAlign: 'center',
				gap
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

export const Text: React.FC<P<'text'>> = ({ scene }) => {
	const { format } = useLayout();
	const size = { vertical: 80, square: 80, wide: 92 }[format];
	const k = useRise(0);
	const t = useRise(4);
	const s = useRise(10);
	return (
		<Center>
			{scene.kicker && (
				<div style={{ ...k, fontSize: 34, fontWeight: 700, color: color.surge, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
					{scene.kicker}
				</div>
			)}
			<div style={{ ...t, fontSize: size, fontWeight: 850, letterSpacing: '-0.04em', lineHeight: 1.05 }}>{scene.title}</div>
			{scene.subtitle && <div style={{ ...s, fontSize: size * 0.42, color: color.fgSoft, lineHeight: 1.35, maxWidth: 900 }}>{scene.subtitle}</div>}
		</Center>
	);
};

/** "How it works": numbered steps appear one after another. */
export const Steps: React.FC<P<'steps'>> = ({ scene, frames, words }) => {
	const { wide, square } = useLayout();
	const { fps } = useVideoConfig();
	const frame = useCurrentFrame();
	const n = scene.steps.length;
	const times = sequenceFrames(scene.steps.map((s) => s.title), words, fps, 6, Math.round((frames * 0.7) / scene.steps.length));
	const stepAt = (i: number) => times[i];
	const title = useRise(0);
	return (
		<Center gap={wide ? 64 : square ? 28 : 44}>
			{scene.title && <div style={{ ...title, fontSize: 64, fontWeight: 850, letterSpacing: '-0.03em' }}>{scene.title}</div>}
			<div style={{ display: 'flex', flexDirection: wide ? 'row' : 'column', gap: square ? 20 : 32, width: '100%' }}>
				{scene.steps.map((s, i) => {
					const p = interpolate(frame - stepAt(i), [0, 12], [0, 1], clamp);
					const active = frame >= stepAt(i) && (i === n - 1 || frame < stepAt(i + 1));
					return (
						<Card
							key={i}
							glow={active}
							style={{
								flex: 1,
								display: 'flex',
								flexDirection: wide ? 'column' : 'row',
								alignItems: wide ? 'flex-start' : 'center',
								gap: 32,
								padding: square ? 30 : 44,
								textAlign: 'left',
								opacity: interpolate(p, [0, 1], [0.0, active ? 1 : 0.55]),
								transform: `translateX(${wide ? 0 : (1 - p) * -60}px) translateY(${wide ? (1 - p) * 60 : 0}px)`,
								borderColor: active ? `${color.surge}88` : color.border
							}}
						>
							<div
								style={{
									width: 84,
									height: 84,
									borderRadius: 42,
									flexShrink: 0,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: 44,
									fontWeight: 800,
									background: active ? color.surge : color.surfaceHi,
									color: active ? '#111' : color.fgSoft
								}}
							>
								{i + 1}
							</div>
							<div>
								<div style={{ fontSize: wide ? 42 : 48, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{s.title}</div>
								<div style={{ fontSize: 34, color: color.fgSoft, marginTop: 8 }}>{s.text}</div>
							</div>
						</Card>
					);
				})}
			</div>
		</Center>
	);
};

/** Feature chips popping in. */
export const Features: React.FC<P<'features'>> = ({ scene }) => {
	const frame = useCurrentFrame();
	const title = useRise(0);
	return (
		<Center gap={56}>
			{scene.title && <div style={{ ...title, fontSize: 76, fontWeight: 850, letterSpacing: '-0.035em', lineHeight: 1.05 }}>{scene.title}</div>}
			<div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22 }}>
				{scene.items.map((item, i) => {
					const d = 8 + i * motion.stagger * 2;
					const p = interpolate(frame - d, [0, 8], [0, 1], clamp);
					return (
						<div
							key={i}
							style={{
								fontSize: 42,
								fontWeight: 700,
								padding: '20px 34px',
								borderRadius: 999,
								background: color.surfaceHi,
								border: `2px solid ${color.border}`,
								opacity: p,
								transform: `scale(${0.6 + 0.4 * (1 - Math.pow(1 - p, 3)) + Math.sin(p * Math.PI) * 0.08})`
							}}
						>
							<span style={{ color: color.surge, marginRight: 14 }}>●</span>
							{item}
						</div>
					);
				})}
			</div>
		</Center>
	);
};

export { Center };
