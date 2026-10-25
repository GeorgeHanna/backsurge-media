import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

// The "kid-drawn" world: wobbly marker lines, plain flat colours, paper, a strip
// of sea at the bottom and a sun in sunglasses. Characters live in src/kid/cast.tsx.
// Product cards stay clean (src/flat/props.tsx): drawn world vs. real tool.

export const K = {
	ink: '#1c1c1c',
	paper: '#fbf8f0',
	water: '#2f8fe6',
	waterLine: '#1b63b5',
	sun: '#ffd21f',
	sunLine: '#f2a900',
	orange: '#ff8a1c',
	orangeLine: '#d14d00',
	pink: '#ff9ab8',
	blush: '#ff8fb1',
	brown: '#9a6a46',
	sand: '#f3d27a',
	green: '#7ac74f',
	red: '#e8453c',
	purple: '#b98cff',
	white: '#ffffff'
};

/** Water surface in the kid world (frame y). Characters stand on it. */
export const SEA = 1490;

export type Face = 'happy' | 'neutral' | 'unsure' | 'shock' | 'delighted' | 'deadpan' | 'sad' | 'smug';

/** The wobble filter. Its seed changes every 4 frames so lines "boil". Put inside each <svg>. */
export const WobbleDef: React.FC<{ scale?: number }> = ({ scale = 9 }) => {
	const f = useCurrentFrame();
	const seed = Math.floor(f / 4) % 6;
	return (
		<defs>
			<filter id={`kw${scale}`} x="-15%" y="-15%" width="130%" height="130%">
				<feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed={seed} />
				<feDisplacementMap in="SourceGraphic" scale={scale} />
			</filter>
		</defs>
	);
};
export const wob = (scale = 9) => `url(#kw${scale})`;

/** Marker outline group. */
export const Ink: React.FC<{ children: React.ReactNode; w?: number; c?: string; fill?: string }> = ({ children, w = 8, c = K.ink, fill = 'none' }) => (
	<g fill={fill} stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
		{children}
	</g>
);

/** A filled shape with a marker outline. */
export const Shape: React.FC<{ d: string; fill: string; w?: number; c?: string; transform?: string }> = ({ d, fill, w = 8, c = K.ink, transform }) => (
	<path d={d} fill={fill} stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" transform={transform} />
);

/** Kid eye: white circle, dot pupil. Faces change lids/shape. */
export const Eye: React.FC<{ x: number; y: number; r: number; face: Face; look?: [number, number]; blink?: boolean }> = ({ x, y, r, face, look = [0, 0], blink }) => {
	if (blink || face === 'delighted') {
		return <path d={blink ? `M${x - r},${y} L${x + r},${y}` : `M${x - r},${y + r * 0.3} Q${x},${y - r * 0.9} ${x + r},${y + r * 0.3}`} fill="none" stroke={K.ink} strokeWidth={7} strokeLinecap="round" />;
	}
	const rr = face === 'shock' ? r * 1.25 : r;
	const [lx, ly] = look;
	return (
		<g>
			<circle cx={x} cy={y} r={rr} fill="#fff" stroke={K.ink} strokeWidth={7} />
			<circle cx={x + lx * rr * 0.35} cy={y + ly * rr * 0.35 + (face === 'deadpan' || face === 'sad' ? rr * 0.25 : 0)} r={rr * (face === 'shock' ? 0.32 : 0.45)} fill={K.ink} />
			{(face === 'deadpan' || face === 'smug') && <path d={`M${x - rr - 2},${y - rr * 0.15} L${x + rr + 2},${y - rr * 0.15}`} stroke={K.ink} strokeWidth={7} strokeLinecap="round" />}
		</g>
	);
};

/** Kid mouth, centred at x,y, about w wide. */
export const Mouth: React.FC<{ x: number; y: number; w: number; face: Face }> = ({ x, y, w, face }) => {
	const h = w / 2;
	const p: Record<Face, string> = {
		happy: `M${x - h},${y - 4} Q${x},${y + h * 0.8} ${x + h},${y - 4}`,
		neutral: `M${x - h * 0.6},${y} L${x + h * 0.6},${y}`,
		deadpan: `M${x - h * 0.7},${y + 2} L${x + h * 0.7},${y + 2}`,
		unsure: `M${x - h},${y + 2} Q${x - h / 2},${y - 8} ${x},${y + 2} Q${x + h / 2},${y + 12} ${x + h},${y}`,
		sad: `M${x - h * 0.8},${y + 10} Q${x},${y - h * 0.5} ${x + h * 0.8},${y + 10}`,
		smug: `M${x - h * 0.7},${y + 2} Q${x + h * 0.2},${y + 10} ${x + h},${y - 10}`,
		shock: '',
		delighted: `M${x - h},${y - 6} Q${x},${y + h * 1.3} ${x + h},${y - 6} Z`
	};
	if (face === 'shock') return <ellipse cx={x} cy={y + 6} rx={w * 0.18} ry={w * 0.24} fill={K.ink} />;
	return <path d={p[face]} fill={face === 'delighted' ? K.ink : 'none'} stroke={K.ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />;
};

/** The sun in sunglasses; its mouth follows the beat's mood. */
export const Sun: React.FC<{ face?: Face; size?: number }> = ({ face = 'happy', size = 220 }) => {
	const f = useCurrentFrame();
	const spin = f * 0.4;
	return (
		<svg viewBox="0 0 240 240" width={size} height={size} style={{ overflow: 'visible' }}>
			<WobbleDef scale={6} />
			<g filter={wob(6)}>
				<Ink c={K.sunLine} w={8}>
					{Array.from({ length: 9 }, (_, i) => {
						const a = ((i / 9) * 360 + spin) * (Math.PI / 180);
						const r2 = 104 + (i % 2) * 14;
						return <path key={i} d={`M${120 + Math.cos(a) * 80},${120 + Math.sin(a) * 80} L${120 + Math.cos(a) * r2},${120 + Math.sin(a) * r2}`} />;
					})}
				</Ink>
				<circle cx="120" cy="120" r="62" fill={K.sun} stroke={K.sunLine} strokeWidth="8" />
				<Ink w={6}>
					<path d="M74,108 L166,104" />
				</Ink>
				<path d="M78,108 Q74,136 100,136 Q120,134 116,106 M128,105 Q126,134 150,134 Q170,132 164,104" fill={K.ink} stroke={K.ink} strokeWidth="6" strokeLinejoin="round" />
				<Mouth x={120} y={156} w={46} face={face === 'shock' ? 'shock' : face} />
			</g>
		</svg>
	);
};

/** Paper, the sea strip and the sun. */
export const KidBg: React.FC<{ sun?: Face | null; children?: React.ReactNode }> = ({ sun = 'happy', children }) => {
	const f = useCurrentFrame();
	const sway = Math.sin(f / 20) * 10;
	const top = SEA - 20;
	const wave = `M-40,${top + sway * 0.4} Q120,${top - 40 + sway} 260,${top + 6} Q420,${top + 40 - sway} 560,${top} Q720,${top - 36 + sway} 860,${top + 4} Q980,${top + 30 - sway} 1120,${top - 6} L1120,1960 L-40,1960 Z`;
	return (
		<AbsoluteFill style={{ background: K.paper }}>
			<svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }}>
				<WobbleDef scale={9} />
				<g filter={wob(9)}>
					<path d={wave} fill={K.water} stroke={K.waterLine} strokeWidth="9" strokeLinejoin="round" />
					<Ink c={K.waterLine} w={8}>
						<path d={`M90,${SEA + 130} q30,-20 60,0 q30,20 60,0`} />
						<path d={`M560,${SEA + 200} q30,-20 60,0 q30,20 60,0`} />
						<path d={`M300,${SEA + 330} q30,-20 60,0`} />
						<path d={`M820,${SEA + 100} q30,-20 60,0`} />
					</Ink>
				</g>
			</svg>
			{sun && (
				<div style={{ position: 'absolute', left: 860, top: 70 }}>
					<Sun face={sun} size={200} />
				</div>
			)}
			{children}
		</AbsoluteFill>
	);
};

/** Blinks every ~3 s for 4 frames, offset per character. */
export const useBlink = (offset = 0) => {
	const f = useCurrentFrame() + offset;
	return f % 96 >= 90 && f % 96 < 94;
};

/**
 * A big kid-drawn wave that rises over the whole screen, then falls away to reveal
 * the next scene. Local frames 0–32; fully covered around frame 14 (the cut).
 */
export const WAVE_CUT = 14;
export const WaveWipe: React.FC = () => {
	const f = useCurrentFrame();
	const easeIn = (t: number) => t * t;
	const top = f < WAVE_CUT ? 2160 - (2160 + 160) * (1 - Math.pow(1 - f / WAVE_CUT, 2)) : -160 + 2500 * easeIn(Math.min(1, (f - WAVE_CUT) / 18));
	if (f > WAVE_CUT + 18) return null;
	const humps = 3;
	const hw = 1200 / humps;
	let d = `M-60,${top + 40}`;
	for (let k = 0; k < humps; k++) {
		const x = -60 + k * hw;
		const up = top - 190 - (k % 2) * 70;
		d += ` Q${x + hw * 0.3},${up} ${x + hw * 0.72},${up + 70} Q${x + hw * 0.84},${up + 130} ${x + hw * 0.64},${up + 150} Q${x + hw * 0.9},${top + 70} ${x + hw},${top + 40}`;
	}
	d += ` L1140,${top + 2700} L-60,${top + 2700} Z`;
	return (
		<AbsoluteFill style={{ zIndex: 200, pointerEvents: 'none' }}>
			<svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
				<WobbleDef scale={10} />
				<g filter={wob(10)}>
					<path d={d} fill={K.water} stroke={K.waterLine} strokeWidth="10" strokeLinejoin="round" />
					{Array.from({ length: humps }, (_, k) => {
						const x = -60 + k * hw + hw * 0.42;
						const y = top - 150 - (k % 2) * 70;
						return (
							<g key={k}>
								<circle cx={x} cy={y} r="34" fill="#fff" stroke={K.waterLine} strokeWidth="7" />
								<circle cx={x + 64} cy={y - 26} r="22" fill="#fff" stroke={K.waterLine} strokeWidth="6" />
								<circle cx={x - 56} cy={y - 6} r="16" fill="#fff" stroke={K.waterLine} strokeWidth="6" />
							</g>
						);
					})}
					<Ink c={K.waterLine} w={9}>
						{[260, 620, 980, 1340].map((dy, i) => (
							<path key={i} d={`M${120 + (i % 2) * 380},${top + dy} q40,-26 80,0 q40,26 80,0 M${640 - (i % 2) * 300},${top + dy + 150} q40,-26 80,0`} />
						))}
					</Ink>
				</g>
			</svg>
		</AbsoluteFill>
	);
};
