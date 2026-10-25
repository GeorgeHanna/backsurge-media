import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { mulberry32 } from '../layout';

// Building blocks for image posts (carousels and single images), 1080×1350.
// The look: flat, high-contrast print. Paper, ink and one loud orange, big
// heavy type, hand-drawn marker notes and a little paper grain. No gradients,
// no glow: it should look made by a person, not generated.

export const POST = { w: 1080, h: 1350, pad: 84 };

export const P = {
	paper: '#F3EFE6',
	ink: '#111111',
	inkSoft: '#3d3a35',
	paperSoft: '#bdb7ab',
	orange: '#FF8918',
	line: '#d9d2c3',
	// Group colours, darkened so they hold up on paper.
	star: '#13853c',
	hidden_gem: '#c26a00',
	wide_reach: '#0a6fb5',
	underperformer: '#d0143c'
} as const;

export const groupColor = {
	star: P.star,
	hidden_gem: P.hidden_gem,
	wide_reach: P.wide_reach,
	underperformer: P.underperformer
} as const;
// Brighter versions for dark (ink) backgrounds.
export const groupColorOnInk = { star: '#3ccb6b', hidden_gem: '#ffae2b', wide_reach: '#4bb8ff', underperformer: '#ff4d6d' } as const;

export const FONT = '"Inter Variable", Inter, system-ui, sans-serif';
export const HAND = '"Caveat", "Segoe Print", cursive';

type Theme = 'paper' | 'ink' | 'orange';
const THEME: Record<Theme, { bg: string; fg: string; soft: string; accent: string }> = {
	paper: { bg: P.paper, fg: P.ink, soft: P.inkSoft, accent: P.orange },
	ink: { bg: P.ink, fg: P.paper, soft: P.paperSoft, accent: P.orange },
	orange: { bg: P.orange, fg: P.ink, soft: '#3a2207', accent: P.ink }
};
export const theme = (t: Theme) => THEME[t];

/** A post page: background, grain, footer with handle and page count. */
export const Page: React.FC<{
	theme: Theme;
	page?: [number, number];
	swipe?: boolean;
	handle?: string;
	children: React.ReactNode;
}> = ({ theme: t, page, swipe, handle = '@backsurge', children }) => {
	const c = THEME[t];
	return (
		<AbsoluteFill style={{ background: c.bg, color: c.fg, fontFamily: FONT }}>
			<AbsoluteFill
				style={{
					backgroundImage: `url(${staticFile('noise.png')})`,
					backgroundRepeat: 'repeat',
					opacity: t === 'ink' ? 0.09 : 0.14,
					mixBlendMode: t === 'ink' ? 'screen' : 'multiply'
				}}
			/>
			<AbsoluteFill style={{ padding: POST.pad, paddingBottom: POST.pad + 70 }}>{children}</AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: POST.pad,
					right: POST.pad,
					bottom: 56,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					fontSize: 26,
					fontWeight: 700,
					color: c.soft
				}}
			>
				<span>{handle}</span>
				<span style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
					{page && (
						<span style={{ fontVariantNumeric: 'tabular-nums' }}>
							{page[0]}/{page[1]}
						</span>
					)}
					{swipe && <span style={{ fontFamily: HAND, fontSize: 44, color: c.fg, fontWeight: 700 }}>swipe →</span>}
				</span>
			</div>
		</AbsoluteFill>
	);
};

/** Huge headline. */
export const Big: React.FC<{ size?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ size = 112, children, style }) => (
	<div style={{ fontSize: size, fontWeight: 900, lineHeight: 0.98, letterSpacing: '-0.045em', ...style }}>{children}</div>
);

/** Highlighter stroke behind a few words. */
export const Hi: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = P.orange, children }) => (
	<span
		style={{
			backgroundImage: `linear-gradient(${color}, ${color})`,
			backgroundSize: '100% 42%',
			backgroundPosition: '0 82%',
			backgroundRepeat: 'no-repeat',
			padding: '0 0.08em',
			boxDecorationBreak: 'clone',
			WebkitBoxDecorationBreak: 'clone'
		}}
	>
		{children}
	</span>
);

/** Small uppercase label. */
export const Tag: React.FC<{ bg: string; fg: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ bg, fg, children, style }) => (
	<span
		style={{
			display: 'inline-block',
			padding: '10px 20px',
			background: bg,
			color: fg,
			fontSize: 26,
			fontWeight: 800,
			letterSpacing: '0.12em',
			textTransform: 'uppercase',
			...style
		}}
	>
		{children}
	</span>
);

/** Handwritten note. */
export const Note: React.FC<{ size?: number; color?: string; rotate?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
	size = 56,
	color,
	rotate = -3,
	style,
	children
}) => (
	<div style={{ fontFamily: HAND, fontWeight: 700, fontSize: size, lineHeight: 1.0, color, transform: `rotate(${rotate}deg)`, ...style }}>{children}</div>
);

// ── Hand-drawn marks ─────────────────────────────────────────────────────────

function smooth(pts: [number, number][]) {
	// Catmull-Rom through the points, as cubic Béziers.
	let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(0, i - 1)];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[Math.min(pts.length - 1, i + 2)];
		const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
		const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
		d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
	}
	return d;
}

/** A marker loop around a w×h box (drawn a bit past one full turn, like by hand). */
export const Circle: React.FC<{ w: number; h: number; color?: string; seed?: number; width?: number; style?: React.CSSProperties }> = ({
	w,
	h,
	color = P.orange,
	seed = 1,
	width = 7,
	style
}) => {
	const r = mulberry32(seed);
	const pts: [number, number][] = [];
	const n = 26;
	const start = r() * Math.PI * 2;
	for (let i = 0; i <= n; i++) {
		const a = start + (i / n) * Math.PI * 2 * 1.12;
		const k = 1 + (r() - 0.5) * 0.07 + (i / n) * 0.05;
		pts.push([w / 2 + Math.cos(a) * (w / 2) * k, h / 2 + Math.sin(a) * (h / 2) * k]);
	}
	return (
		<svg width={w} height={h} style={{ position: 'absolute', overflow: 'visible', pointerEvents: 'none', ...style }}>
			<path d={smooth(pts)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
};

/** A marker arrow from (x1,y1) to (x2,y2), bowed by `bend`. Positioned in its parent. */
export const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; bend?: number; color?: string; width?: number }> = ({
	x1,
	y1,
	x2,
	y2,
	bend = 0.25,
	color = P.orange,
	width = 7
}) => {
	const mx = (x1 + x2) / 2 - (y2 - y1) * bend;
	const my = (y1 + y2) / 2 + (x2 - x1) * bend;
	const ang = Math.atan2(y2 - my, x2 - mx);
	const head = 30;
	const h1 = [x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45)];
	const h2 = [x2 - head * Math.cos(ang + 0.5), y2 - head * Math.sin(ang + 0.5)];
	return (
		<svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }} width={1} height={1}>
			<path
				d={`M${x1},${y1} Q${mx},${my} ${x2},${y2} M${h1[0]},${h1[1]} L${x2},${y2} L${h2[0]},${h2[1]}`}
				fill="none"
				stroke={color}
				strokeWidth={width}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

/** A wobbly underline, w wide. */
export const Underline: React.FC<{ w: number; color?: string; seed?: number; style?: React.CSSProperties }> = ({ w, color = P.orange, seed = 3, style }) => {
	const r = mulberry32(seed);
	const pts: [number, number][] = Array.from({ length: 7 }, (_, i) => [(i / 6) * w, 8 + (r() - 0.5) * 9 + (i / 6) * 4]);
	return (
		<svg width={w} height={24} style={{ display: 'block', overflow: 'visible', ...style }}>
			<path d={smooth(pts)} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
		</svg>
	);
};

/** A marker tick or cross in a hand-drawn box. */
export const CheckBox: React.FC<{ checked?: boolean; cross?: boolean; color?: string; ink?: string; size?: number; seed?: number }> = ({
	checked,
	cross,
	color = P.orange,
	ink = P.ink,
	size = 54,
	seed = 5
}) => {
	const r = mulberry32(seed);
	const j = () => (r() - 0.5) * 5;
	const s = size;
	return (
		<svg width={s} height={s} style={{ flexShrink: 0, overflow: 'visible' }}>
			<path d={`M${4 + j()},${4 + j()} L${s - 4 + j()},${5 + j()} L${s - 5 + j()},${s - 4 + j()} L${5 + j()},${s - 5 + j()} Z`} fill="none" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
			{checked && <path d={`M${s * 0.18},${s * 0.52} L${s * 0.42},${s * 0.78} L${s * 0.98},${s * 0.02}`} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />}
			{cross && <path d={`M${s * 0.1},${s * 0.1} L${s * 0.9},${s * 0.9} M${s * 0.88},${s * 0.12} L${s * 0.12},${s * 0.88}`} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" />}
		</svg>
	);
};

/** The 2×2 map as a little icon, with one quarter filled. */
export const QuadIcon: React.FC<{ fill: keyof typeof groupColor; size?: number; ink?: string; colors?: Record<string, string> }> = ({
	fill,
	size = 120,
	ink = P.ink,
	colors = groupColor
}) => {
	const cells: (keyof typeof groupColor)[] = ['hidden_gem', 'star', 'underperformer', 'wide_reach'];
	return (
		<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, width: size, height: size }}>
			{cells.map((c) => (
				<div key={c} style={{ border: `4px solid ${c === fill ? colors[c] : ink}`, background: c === fill ? colors[c] : 'transparent', opacity: c === fill ? 1 : 0.35 }} />
			))}
		</div>
	);
};
