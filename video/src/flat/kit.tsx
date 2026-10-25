import '@fontsource-variable/bricolage-grotesque';
import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COW_POSES, Cow, cowHeight } from '../kid/cast';
import { KidBg, SEA, WAVE_CUT, WaveWipe } from '../kid/kit';

// The "flat" style: a soft one-colour background, a big black headline with the
// punchline on a white highlight, flat props with thick dark outlines, and a small
// full-body character in a wide shot (never a close-up, no hands: arms end in a
// plain round nub). Hooks are black with white text and a yellow highlight.

export const INK = '#1d1d1b';
export const FLAT_FONT = '"Bricolage Grotesque Variable", "Inter Variable", sans-serif';
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export type Tone = 'mint' | 'sand' | 'sky' | 'ink';
const TONES: Record<Tone, [string, string]> = {
	mint: ['#c6e5cd', '#a6d1b1'],
	sand: ['#f6e3c4', '#ebcf9f'],
	sky: ['#cfe2f6', '#aac8ea'],
	ink: ['#191917', '#0d0d0c']
};

export const FlatBg: React.FC<{ tone?: Tone; children?: React.ReactNode }> = ({ tone = 'mint', children }) => {
	const [a, b] = TONES[tone];
	const dark = tone === 'ink';
	return (
		<AbsoluteFill style={{ background: `linear-gradient(170deg, ${a}, ${b})`, fontFamily: FLAT_FONT }}>
			<AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 35% at 20% 30%, rgba(255,255,255,${dark ? 0.06 : 0.55}), transparent 70%)` }} />
			<AbsoluteFill style={{ background: `radial-gradient(ellipse 50% 30% at 85% 80%, rgba(255,255,255,${dark ? 0.04 : 0.35}), transparent 70%)` }} />
			{children}
		</AbsoluteFill>
	);
};

let measureCtx: CanvasRenderingContext2D | null = null;
/** Largest size (up to `size`) at which every line fits `maxW`, measured with the real font. */
export const fitSize = (text: string, size: number, maxW = 850) => {
	if (typeof document === 'undefined') return size;
	measureCtx ??= document.createElement('canvas').getContext('2d');
	if (!measureCtx) return size;
	measureCtx.font = `800 100px ${FLAT_FONT}`;
	const lines = text.replace(/[[\]]/g, '').split('|').map((l) => l.trim());
	const unit = Math.max(...lines.map((l) => measureCtx!.measureText(l).width / 100 - 0.035 * l.length + 0.3));
	return Math.min(size, Math.floor(maxW / (unit * 1.07)));
};

/** "Did it work? | [No idea.]": words in brackets sit on the highlight; "|" breaks the line. */
export const Headline: React.FC<{ text: string; at?: number; out?: number; top?: number; size?: number; dark?: boolean; align?: 'left' | 'center'; marker?: boolean }> = ({
	text,
	at = 0,
	out,
	top = 380,
	size = 108,
	dark,
	align = 'left',
	marker
}) => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	size = fitSize(text, size, align === 'center' ? 920 : 850);
	const words: { w: string; hl: boolean }[] = [];
	const breaks = new Set<number>();
	let hl = false;
	for (const raw of text.split(' ')) {
		if (raw === '|') {
			breaks.add(words.length);
			continue;
		}
		let w = raw;
		if (w.startsWith('[')) {
			hl = true;
			w = w.slice(1);
		}
		const end = w.endsWith(']');
		if (end) w = w.slice(0, -1);
		words.push({ w, hl });
		if (end) hl = false;
	}
	const exit = out === undefined ? 0 : interpolate(f, [out, out + 6], [0, 1], clamp);
	const lastPlain = words.filter((w) => !w.hl).length;
	const hlBg = dark || marker ? '#ffd43b' : '#fff';
	return (
		<div
			style={{
				position: 'absolute',
				left: 80,
				right: align === 'center' ? 80 : 150,
				top,
				textAlign: align,
				fontFamily: FLAT_FONT,
				fontSize: size,
				fontWeight: 800,
				lineHeight: 1.08,
				letterSpacing: '-0.035em',
				color: dark ? '#fff' : INK,
				opacity: 1 - exit,
				transform: `translateY(${-exit * 30}px)`
			}}
		>
			{words.map(({ w, hl }, i) => {
				const d = at + i * 2.5;
				const p = spring({ frame: f - d, fps, config: { damping: 12, stiffness: 260, mass: 0.5 } });
				const h0 = at + lastPlain * 2.5 + 4 + (i - lastPlain) * 2;
				const hp = hl ? interpolate(f, [h0, h0 + 4], [0, 1], clamp) : 0;
				const nextHl = words[i + 1]?.hl && hl && !breaks.has(i + 1);
				return (
					<React.Fragment key={i}>
						{breaks.has(i) && <br />}
						<span
							style={{
								display: 'inline-block',
								padding: hl ? '0 0.12em' : undefined,
								marginRight: nextHl ? 0 : '0.24em',
								paddingRight: nextHl ? '0.24em' : hl ? '0.12em' : undefined,
								marginLeft: hl && (!words[i - 1]?.hl || breaks.has(i)) ? '-0.1em' : undefined,
								color: hl && dark ? INK : undefined,
								backgroundImage: hl ? `linear-gradient(${hlBg}, ${hlBg})` : undefined,
								backgroundRepeat: 'no-repeat',
								backgroundSize: `${hp * 100}% 88%`,
								backgroundPosition: 'left 60%',
								opacity: Math.min(1, p * 2),
								transform: `translateY(${(1 - p) * 40}px) scale(${0.7 + 0.3 * p})`,
								transformOrigin: '50% 100%'
							}}
						>
							{w}
						</span>
					</React.Fragment>
				);
			})}
		</div>
	);
};

export const Shadow: React.FC<{ x: number; y: number; w: number; k?: number }> = ({ x, y, w, k = 1 }) => (
	<div style={{ position: 'absolute', left: x - (w * k) / 2, top: y - 14, width: w * k, height: 28, borderRadius: '50%', background: 'rgba(29,29,27,0.16)' }} />
);

/** A white card with the style's thick outline and hard shadow. */
export const FlatCard: React.FC<{ w: number; children: React.ReactNode; pad?: number; bg?: string; style?: React.CSSProperties }> = ({ w, children, pad = 26, bg = '#fff', style }) => (
	<div style={{ width: w, background: bg, border: `7px solid ${INK}`, borderRadius: 28, padding: pad, boxShadow: `10px 12px 0 rgba(29,29,27,0.16)`, fontFamily: FLAT_FONT, color: INK, boxSizing: 'border-box', ...style }}>
		{children}
	</div>
);

export const Pill: React.FC<{ bg?: string; children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ bg = '#fff', children, size = 32, style }) => (
	<span style={{ display: 'inline-block', fontSize: size, fontWeight: 800, background: bg, border: `5px solid ${INK}`, borderRadius: 999, padding: '4px 20px', whiteSpace: 'nowrap', color: INK, ...style }}>{children}</span>
);

/** "?" marks popping above a point. */
export const Huh: React.FC<{ at: number; x: number; y: number; dark?: boolean }> = ({ at, x, y, dark }) => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	return (
		<>
			{[
				{ dx: -130, dy: 40, r: -14, s: 1 },
				{ dx: 0, dy: 0, r: 8, s: 1.3 },
				{ dx: 130, dy: 50, r: 16, s: 0.9 }
			].map((q, i) => {
				if (f < at + i * 6) return null;
				const p = spring({ frame: f - at - i * 6, fps, config: { damping: 8, stiffness: 260, mass: 0.5 } });
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x + q.dx - 40,
							top: y + q.dy + Math.sin((f + i * 20) / 8) * 6,
							fontFamily: FLAT_FONT,
							fontSize: 130 * q.s,
							fontWeight: 800,
							color: dark ? '#ffd43b' : '#fff',
							WebkitTextStroke: `7px ${INK}`,
							paintOrder: 'stroke fill',
							transform: `scale(${p}) rotate(${q.r}deg)`,
							zIndex: 50
						}}
					>
						?
					</div>
				);
			})}
		</>
	);
};

/** Little four-point stars bursting around a point. */
export const Sparkles: React.FC<{ at: number; x: number; y: number; spread?: number }> = ({ at, x, y, spread = 280 }) => {
	const f = useCurrentFrame();
	if (f < at) return null;
	const d = f - at;
	return (
		<>
			{[
				[-1, -0.6, 0],
				[1, -0.5, 3],
				[1.1, 0.6, 6],
				[-1.1, 0.7, 2],
				[0.1, -1, 5]
			].map(([dx, dy, delay], i) => {
				const t = Math.max(0, d - delay);
				const s = interpolate(t, [0, 6, 18], [0, 1.2, 0], clamp);
				return (
					<svg key={i} width="80" height="80" viewBox="-40 -40 80 80" style={{ position: 'absolute', left: x + dx * spread - 40, top: y + dy * spread - 40, transform: `scale(${s}) rotate(${t * 6}deg)`, zIndex: 55 }}>
						<path d="M0,-34 Q6,-6 34,0 Q6,6 0,34 Q-6,6 -34,0 Q-6,-6 0,-34 Z" fill="#ffd43b" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
					</svg>
				);
			})}
		</>
	);
};

// ── The person ─────────────────────────────────────────────────────────────

export type Face = 'happy' | 'neutral' | 'unsure' | 'shock' | 'delighted' | 'deadpan' | 'sad' | 'smug';
export type Pose = 'idle' | 'wave' | 'point' | 'pointUp' | 'cheer' | 'shrug' | 'present' | 'slump';

/** Arm angles (degrees outward from hanging straight down) for each pose. */
export const POSES: Record<Pose, (f: number) => [number, number]> = {
	idle: (f) => [10 + Math.sin(f / 14) * 2, 10 + Math.sin(f / 14 + 1) * 2],
	slump: () => [3, 3],
	wave: (f) => [10, 148 + Math.sin(f / 3) * 18],
	point: () => [10, 78],
	pointUp: () => [10, 130],
	present: () => [24, 96],
	cheer: (f) => [150 + Math.sin(f / 2.5) * 10, 150 + Math.sin(f / 2.5 + 1.5) * 10],
	shrug: () => [62, 62]
};

export type Look = { skin: string; hair: string; shirt: string; pants: string; phones?: boolean };
export const SAM: Look = { skin: '#f3c6a0', hair: '#3b2416', shirt: '#ff6f4d', pants: '#2c3e7a', phones: true };

export const Person: React.FC<{
	x: number; // centre
	base: number; // feet line
	h?: number;
	look?: Look;
	face: Face;
	arms: [number, number];
	eyes?: [number, number];
	hops?: number[]; // frames to hop at
	sweat?: boolean;
	scale?: number; // pop-in scale
}> = ({ x, base, h = 560, look: L = SAM, face, arms, eyes = [0, 0], hops = [], sweat, scale = 1 }) => {
	const f = useCurrentFrame();
	const w = h * (240 / 520);
	let lift = 0;
	let squash = Math.sin(f / 10) * 0.006;
	for (const t of hops) {
		const d = f - t;
		if (d >= 0 && d < 18) {
			lift += Math.sin((d / 18) * Math.PI) * h * 0.14;
			squash += d < 3 ? 0.05 * (d / 3) : d > 15 ? 0.06 * ((18 - d) / 3) : -0.03;
		} else if (d < 0 && d > -4) squash += 0.05 * ((4 + d) / 4);
	}
	const blink = f % 100 >= 92 && f % 100 < 96 && face !== 'shock';
	const [ex, ey] = eyes;
	const E = [98, 142];
	const brows: Partial<Record<Face, [string, string]>> = {
		neutral: ['M86,96 L110,94', 'M130,94 L154,96'],
		happy: ['M86,94 Q98,86 110,92', 'M130,92 Q142,86 154,94'],
		delighted: ['M86,88 Q98,78 110,86', 'M130,86 Q142,78 154,88'],
		unsure: ['M86,98 L110,90', 'M130,90 L154,98'],
		shock: ['M86,82 Q98,72 110,80', 'M130,80 Q142,72 154,82'],
		deadpan: ['M86,102 L110,102', 'M130,102 L154,102'],
		sad: ['M86,92 L110,100', 'M130,100 L154,92'],
		smug: ['M86,100 L110,100', 'M130,92 Q142,84 154,92']
	};
	const mouth: Record<Face, React.ReactNode> = {
		happy: <path d="M104,150 Q120,166 136,150" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />,
		neutral: <path d="M108,154 L132,154" stroke={INK} strokeWidth="6" strokeLinecap="round" />,
		deadpan: <path d="M106,156 L134,156" stroke={INK} strokeWidth="6" strokeLinecap="round" />,
		unsure: <path d="M104,156 Q112,148 120,156 Q128,164 136,154" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />,
		shock: <ellipse cx="120" cy="158" rx="11" ry="14" fill={INK} />,
		delighted: <path d="M100,146 Q120,178 140,146 Z" fill={INK} stroke={INK} strokeWidth="5" strokeLinejoin="round" />,
		sad: <path d="M106,160 Q120,148 134,160" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />,
		smug: <path d="M106,154 Q124,160 136,146" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
	};
	const arm = (side: 0 | 1) => {
		const sx = side ? 160 : 80;
		const a = side ? -arms[1] : arms[0];
		return (
			<g transform={`rotate(${a} ${sx} 222)`}>
				<line x1={sx} y1="222" x2={sx} y2="338" stroke={INK} strokeWidth="40" strokeLinecap="round" />
				<line x1={sx} y1="222" x2={sx} y2="338" stroke={L.shirt} strokeWidth="27" strokeLinecap="round" />
				<circle cx={sx} cy="350" r="14" fill={L.skin} stroke={INK} strokeWidth="6" />
			</g>
		);
	};
	return (
		<>
			<Shadow x={x} y={base} w={w * 0.85} k={(1 - lift / h) * scale} />
			<div
				style={{
					position: 'absolute',
					left: x - w / 2,
					top: base - h - lift,
					width: w,
					height: h,
					transform: `scale(${(1 + squash) * scale}, ${(1 - squash) * scale})`,
					transformOrigin: '50% 100%'
				}}
			>
				<svg viewBox="0 0 240 520" width={w} height={h} style={{ overflow: 'visible' }}>
					{/* legs + shoes */}
					<rect x="84" y="330" width="32" height="170" rx="12" fill={L.pants} stroke={INK} strokeWidth="7" />
					<rect x="124" y="330" width="32" height="170" rx="12" fill={L.pants} stroke={INK} strokeWidth="7" />
					<path d="M74,512 Q74,488 100,488 L118,488 L118,512 Z" fill="#fff" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
					<path d="M166,512 Q166,488 140,488 L122,488 L122,512 Z" fill="#fff" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
					{/* arms sit behind the torso */}
					{arm(0)}
					{arm(1)}
					<rect x="62" y="196" width="116" height="156" rx="40" fill={L.shirt} stroke={INK} strokeWidth="7" />
					<path d="M82,346 L158,346" stroke={INK} strokeWidth="6" strokeLinecap="round" opacity="0.25" />
					{/* neck + headphones */}
					<rect x="106" y="170" width="28" height="34" rx="8" fill={L.skin} stroke={INK} strokeWidth="6" />
					{L.phones && (
						<>
							<path d="M80,206 Q120,246 160,206" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
							<rect x="64" y="190" width="26" height="36" rx="10" fill="#26324a" stroke={INK} strokeWidth="6" />
							<rect x="150" y="190" width="26" height="36" rx="10" fill="#26324a" stroke={INK} strokeWidth="6" />
						</>
					)}
					{/* head */}
					<circle cx="56" cy="118" r="13" fill={L.skin} stroke={INK} strokeWidth="6" />
					<circle cx="184" cy="118" r="13" fill={L.skin} stroke={INK} strokeWidth="6" />
					<ellipse cx="120" cy="112" rx="64" ry="70" fill={L.skin} stroke={INK} strokeWidth="7" />
					<path d="M57,104 Q52,38 120,36 Q190,38 183,106 Q174,76 150,72 Q132,86 104,72 Q78,74 57,104 Z" fill={L.hair} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
					{/* face */}
					{E.map((x0, i) =>
						blink || face === 'delighted' ? (
							<path key={i} d={face === 'delighted' && !blink ? `M${x0 - 9},${122} Q${x0},${110} ${x0 + 9},${122}` : `M${x0 - 8},${118} L${x0 + 8},${118}`} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
						) : face === 'shock' ? (
							<g key={i}>
								<circle cx={x0} cy="116" r="13" fill="#fff" stroke={INK} strokeWidth="5" />
								<circle cx={x0 + ex * 3} cy={116 + ey * 3} r="6" fill={INK} />
							</g>
						) : (
							<ellipse key={i} cx={x0 + ex * 5} cy={118 + ey * 5} rx="7" ry="9" fill={INK} />
						)
					)}
					{face === 'deadpan' && E.map((x0, i) => <path key={i} d={`M${x0 - 11},${112} L${x0 + 11},${112}`} stroke={INK} strokeWidth="5" strokeLinecap="round" />)}
					{brows[face] && brows[face]!.map((d, i) => <path key={i} d={d} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />)}
					<path d="M117,124 Q127,134 117,140" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
					{(face === 'happy' || face === 'delighted') && (
						<>
							<ellipse cx="80" cy="140" rx="12" ry="7" fill="#ff9e8a" />
							<ellipse cx="160" cy="140" rx="12" ry="7" fill="#ff9e8a" />
						</>
					)}
					{mouth[face]}
					{sweat && <path d="M176,72 Q186,92 176,100 Q166,92 176,72 Z" fill="#8fd3ff" stroke={INK} strokeWidth="5" />}
				</svg>
			</div>
		</>
	);
};

// ── The beat engine ────────────────────────────────────────────────────────

export type Layout = 'stage' | 'focus' | 'solo' | 'center' | 'none';
type Key<T> = T | [number, T][]; // a value, or keyframes [[localFrame, value], ...]
const pick = <T,>(k: Key<T>, lf: number): T => {
	if (!Array.isArray(k) || (k.length && !Array.isArray(k[0]))) return k as T;
	let v = (k as [number, T][])[0][1];
	for (const [t, val] of k as [number, T][]) if (lf >= t) v = val;
	return v;
};

export type Beat = {
	id: string;
	len: number;
	tone?: Tone;
	text?: string;
	size?: number;
	top?: number;
	layout?: Layout;
	face?: Key<Face>;
	pose?: Key<Pose>;
	eyes?: Key<[number, number]>;
	hops?: number[];
	sweat?: boolean;
	sun?: Face;
	wave?: boolean; // wave transition into this beat (automatic when the background changes)
};

export type World = 'flat' | 'kid';
/** Where the person and the prop sit, per layout. */
export const LAYOUT = {
	stage: { person: { x: 250, base: 1400, h: 560 }, prop: { x: 440, w: 490, base: 1400 } },
	focus: { person: { x: 170, base: 1610, h: 330 }, prop: { x: 80, w: 850, top: 520 } },
	solo: { person: null, prop: { x: 80, w: 850, top: 520 } },
	center: { person: { x: 540, base: 1400, h: 600 }, prop: null },
	none: { person: null, prop: null }
} as const;

/** The kid world: Daisy floats on the sea (x = centre, base = board bottom, h = width). */
export const KID_LAYOUT = {
	stage: { person: { x: 240, base: SEA + 24, h: 420 }, prop: { x: 450, w: 480, base: 1420 } },
	focus: { person: { x: 540, base: SEA + 30, h: 330 }, prop: { x: 80, w: 850, top: 500 } },
	solo: { person: null, prop: { x: 80, w: 850, top: 500 } },
	center: { person: { x: 540, base: SEA + 30, h: 620 }, prop: null },
	none: { person: null, prop: null }
} as const;
const layoutsFor = (world: World) => (world === 'kid' ? KID_LAYOUT : LAYOUT);

export const starts = (beats: Beat[]) => {
	const out: Record<string, number> = {};
	let t = 0;
	for (const b of beats) {
		out[b.id] = t;
		t += b.len;
	}
	return { S: out, total: t };
};

export type PropSpec = {
	from: string; // beat id
	to?: string; // last beat id (inclusive), default = from
	layout: 'stage' | 'focus' | 'solo' | 'free';
	at?: number; // extra delay after the beat starts
	x?: number;
	top?: number;
	base?: number;
	C: React.FC<{ w: number }>;
};

export type Sfx = { name: string; at: number; v: number };

const BeatPerson: React.FC<{ beats: Beat[]; S: Record<string, number>; world: World }> = ({ beats, S, world }) => {
	const LAY = layoutsFor(world);
	const POSE_FN = world === 'kid' ? COW_POSES : POSES;
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const idx = Math.max(0, beats.findIndex((b) => f >= S[b.id] && f < S[b.id] + b.len));
	const b = beats[idx];
	const lf = f - S[b.id];
	const L = LAY[b.layout ?? 'stage'].person;
	const prev = idx > 0 ? LAY[beats[idx - 1].layout ?? 'stage'].person : null;
	if (!L) return null;
	// Glide from the previous layout's spot, or pop in if there wasn't one.
	const m = spring({ frame: lf, fps, config: { damping: 16, stiffness: 160 } });
	const x = prev ? prev.x + (L.x - prev.x) * m : L.x;
	const base = prev ? prev.base + (L.base - prev.base) * m : L.base;
	const h = prev ? prev.h + (L.h - prev.h) * m : L.h;
	const scale = prev ? 1 : spring({ frame: lf, fps, config: { damping: 9, stiffness: 200, mass: 0.6 } });
	// Arms ease between poses.
	const poseK = b.pose ?? 'idle';
	const cur = POSE_FN[pick(poseK, lf)](f);
	const keys = Array.isArray(poseK) ? (poseK as [number, Pose][]) : [[0, poseK as Pose] as [number, Pose]];
	const kIdx = keys.reduce((a, [t], i) => (lf >= t ? i : a), 0);
	const tKey = keys[kIdx][0];
	const before = kIdx > 0 ? POSE_FN[keys[kIdx - 1][1]](f) : idx > 0 ? POSE_FN[pick(beats[idx - 1].pose ?? 'idle', 9999)](f) : cur;
	const blend = easeOut(Math.min(1, (lf - tKey) / 6));
	const params = cur.map((c, i) => before[i] + (c - before[i]) * blend);
	const arms: [number, number] = [params[0], params[1]];
	if (world === 'kid') {
		let lift = 0;
		for (const t of (b.hops ?? []).map((t) => S[b.id] + t)) {
			const d = f - t;
			if (d >= 0 && d < 18) lift += Math.sin((d / 18) * Math.PI) * h * 0.18;
		}
		const ch = cowHeight(h);
		return (
			<div style={{ position: 'absolute', left: x - h / 2, top: base - ch - lift, transform: `scale(${scale})`, transformOrigin: '50% 100%', zIndex: 20 }}>
				<Cow width={h} face={pick(b.face ?? 'happy', lf)} params={params} look={pick(b.eyes ?? [0, 0], lf)} sweat={b.sweat} />
			</div>
		);
	}
	return (
		<Person
			x={x}
			base={base}
			h={h}
			face={pick(b.face ?? 'happy', lf)}
			arms={arms}
			eyes={pick(b.eyes ?? [0, 0], lf)}
			hops={(b.hops ?? []).map((t) => S[b.id] + t)}
			sweat={b.sweat}
			scale={scale}
		/>
	);
};

const Bg: React.FC<{ world: World; tone: Tone; sun?: Face; children?: React.ReactNode }> = ({ world, tone, sun, children }) =>
	world === 'kid' && tone !== 'ink' ? <KidBg sun={sun ?? 'happy'}>{children}</KidBg> : <FlatBg tone={tone}>{children}</FlatBg>;

/** Renders a clip from beats (backgrounds, headlines, person), props and sound. */
export const FlatClip: React.FC<{ beats: Beat[]; props: PropSpec[]; sfx: Sfx[]; extras?: React.ReactNode; music?: string; musicVolume?: number; world?: World }> = ({
	beats,
	props,
	sfx,
	extras,
	music,
	musicVolume = 0.4,
	world = 'flat'
}) => {
	const LAY = layoutsFor(world);
	const { S } = starts(beats);
	const byId = Object.fromEntries(beats.map((b) => [b.id, b]));
	// Full-screen wave transitions (kid world): when the background changes, or on request.
	const waves = world === 'kid' ? beats.filter((b, i) => i > 0 && (b.wave || (b.tone ?? 'mint') !== (beats[i - 1].tone ?? 'mint'))).map((b) => b.id) : [];
	const waveSfx: Sfx[] = waves.map((id) => ({ name: 'wave', at: S[id] - WAVE_CUT + 2, v: 0.6 }));
	return (
		<AbsoluteFill style={{ fontFamily: FLAT_FONT }}>
			{music && <Audio src={staticFile(music)} volume={musicVolume} />}
			{beats.map((b) => (
				<Sequence key={b.id} from={S[b.id]} durationInFrames={b.len} name={b.id}>
					<Bg world={world} tone={b.tone ?? 'mint'} sun={b.sun}>
						{b.text && (
							<Headline
								text={b.text}
								at={waves.includes(b.id) ? 8 : 2}
								out={b.len - 6}
								size={b.size ?? (b.tone === 'ink' ? 118 : 108)}
								top={b.top ?? (b.tone === 'ink' ? 400 : b.layout === 'focus' || b.layout === 'solo' ? 260 : world === 'kid' ? 470 : 380)}
								dark={b.tone === 'ink'}
								marker={world === 'kid'}
							/>
						)}
					</Bg>
				</Sequence>
			))}
			{props.map((p, i) => {
				const from = S[p.from] + (p.at ?? 0);
				const last = byId[p.to ?? p.from];
				const end = S[last.id] + last.len;
				const lay = p.layout === 'free' ? null : LAY[p.layout].prop;
				const x = p.x ?? lay?.x ?? 0;
				const w = lay?.w ?? 850;
				const top = p.top ?? (lay && 'top' in lay ? lay.top : undefined);
				const base = p.base ?? (lay && 'base' in lay ? lay.base : undefined);
				return (
					<Sequence key={i} from={from} durationInFrames={end - from} layout="none">
						<PopIn at={0} out={end - from - 6} x={x} y={top} base={top === undefined ? base : undefined}>
							<p.C w={w} />
						</PopIn>
					</Sequence>
				);
			})}
			<BeatPerson beats={beats} S={S} world={world} />
			{extras}
			{waves.map((id) => (
				<Sequence key={`wave-${id}`} from={S[id] - WAVE_CUT} durationInFrames={34} layout="none">
					<WaveWipe />
				</Sequence>
			))}
			{[...sfx, ...waveSfx].map((s, i) => (
				<Sequence key={i} from={Math.max(0, Math.round(s.at))} durationInFrames={75} layout="none">
					<Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.v} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};

/** Pops a prop in (overshoot) and out. Anchored by top, or by its bottom edge (base). */
export const PopIn: React.FC<{ at: number; out?: number; x: number; y?: number; base?: number; children: React.ReactNode; origin?: string }> = ({ at, out, x, y, base, children, origin = '50% 100%' }) => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	if (f < at) return null;
	const p = spring({ frame: f - at, fps, config: { damping: 10, stiffness: 220, mass: 0.6 } });
	const o = out === undefined ? 0 : interpolate(f, [out, out + 6], [0, 1], clamp);
	if (o >= 1) return null;
	return (
		<div style={{ position: 'absolute', left: x, top: y, bottom: base === undefined ? undefined : 1920 - base, transform: `scale(${p * (1 - o)})`, transformOrigin: origin }}>{children}</div>
	);
};
