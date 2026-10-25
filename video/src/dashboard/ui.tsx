import React from 'react';
import { color, font } from '../brand';
import { Cursor, LogoMark } from '../components/ui';
import { NEVER } from './anim';
import { channel } from './data';

// Building blocks styled like the real dashboard (frontend/src/routes/dashboard),
// a touch larger so they read on a phone screen.

export const T = {
	bg: color.bg,
	card: color.bgRaised,
	secondary: color.surfaceHi,
	muted: color.surface,
	border: color.border,
	fg: color.fg,
	mutedFg: '#8a919c',
	primary: color.surge,
	green: '#34d399',
	red: '#fb7185',
	sky: '#7dd3fc',
	amber: '#fbbf24',
	text: 17, // text-sm
	small: 14.5, // text-xs
	h1: 30,
	h2: 21
};

export const CHROME = 46; // browser bar
export const HEADER = 62; // app header
export const TOP = CHROME + HEADER;
export const pad = (W: number) => (W <= 900 ? 28 : 44);

export const AppCard: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode; glow?: number }> = ({ style, children, glow = 0 }) => (
	<div
		style={{
			background: T.card,
			border: `1.5px solid ${glow > 0 ? `rgba(255,137,24,${0.25 + glow * 0.5})` : T.border}`,
			borderRadius: 16,
			boxShadow: glow > 0 ? `0 0 ${40 * glow}px rgba(255,137,24,${0.25 * glow})` : undefined,
			...style
		}}
	>
		{children}
	</div>
);

export const Chip: React.FC<{ tone?: string; bg?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
	tone = T.fg,
	bg = T.secondary,
	children,
	style
}) => (
	<span
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			padding: '3px 10px',
			borderRadius: 7,
			fontSize: T.small,
			fontWeight: 600,
			color: tone,
			background: bg,
			whiteSpace: 'nowrap',
			...style
		}}
	>
		{children}
	</span>
);

export const Btn: React.FC<{ kind?: 'primary' | 'outline' | 'ghost'; children: React.ReactNode; style?: React.CSSProperties; pressed?: number }> = ({
	kind = 'outline',
	children,
	style,
	pressed = 0
}) => (
	<span
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 8,
			padding: '8px 16px',
			borderRadius: 9,
			fontSize: T.small + 0.5,
			fontWeight: 650,
			whiteSpace: 'nowrap',
			transform: `scale(${1 - pressed * 0.06})`,
			...(kind === 'primary'
				? { background: T.primary, color: '#111' }
				: kind === 'outline'
					? { border: `1.5px solid ${T.border}`, color: T.fg }
					: { color: T.mutedFg }),
			...style
		}}
	>
		{children}
	</span>
);

/** Browser window + app header around a dashboard page. */
export const AppFrame: React.FC<{ W: number; H: number; active: 'Overview' | 'Changes'; path: string; children: React.ReactNode }> = ({
	W,
	H,
	active,
	path,
	children
}) => (
	<div
		style={{
			position: 'absolute',
			left: 0,
			top: 0,
			width: W,
			height: H,
			background: T.bg,
			borderRadius: 18,
			border: `1.5px solid #2a303a`,
			overflow: 'hidden',
			boxShadow: `0 40px 120px rgba(0,0,0,0.65), 0 0 160px rgba(255,137,24,0.10)`,
			fontFamily: font.family,
			color: T.fg,
			fontSize: T.text
		}}
	>
		{/* Browser bar */}
		<div
			style={{
				height: CHROME,
				display: 'flex',
				alignItems: 'center',
				gap: 9,
				padding: '0 18px',
				background: '#0f1217',
				borderBottom: `1.5px solid ${T.border}`
			}}
		>
			{['#ff5f57', '#febc2e', '#28c840'].map((c) => (
				<span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.9 }} />
			))}
			<div
				style={{
					margin: '0 auto',
					padding: '6px 22px',
					borderRadius: 9,
					background: T.secondary,
					color: T.mutedFg,
					fontSize: T.small,
					minWidth: Math.min(420, W * 0.45),
					textAlign: 'center'
				}}
			>
				backsurge.com{path}
			</div>
			<span style={{ width: 57 }} />
		</div>
		{/* App header */}
		<div
			style={{
				height: HEADER,
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				padding: `0 ${pad(W)}px`,
				borderBottom: `1.5px solid ${T.border}`
			}}
		>
			<span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 750, fontSize: 19 }}>
				<LogoMark size={28} />
				backsurge
			</span>
			<span style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
				{(['Overview', 'Changes', 'Settings'] as const).map((n) => (
					<span
						key={n}
						style={{
							padding: '7px 13px',
							borderRadius: 8,
							fontSize: T.text - 1,
							background: n === active ? T.secondary : 'transparent',
							color: n === active ? T.fg : T.mutedFg
						}}
					>
						{n}
					</span>
				))}
			</span>
			<span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, color: T.mutedFg, fontSize: T.text - 1 }}>
				<span
					style={{
						width: 30,
						height: 30,
						borderRadius: 15,
						background: 'linear-gradient(135deg,#ffb347,#b4410c)',
						color: '#111',
						fontSize: 12,
						fontWeight: 800,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					{channel.initials}
				</span>
				{W > 900 && channel.name}
			</span>
		</div>
		<div style={{ position: 'absolute', left: 0, top: TOP, width: W, height: H - TOP }}>{children}</div>
	</div>
);

/** Absolutely placed block on a page (page coordinates are below the header). */
export const Block: React.FC<{ r: { x: number; y: number; w: number; h: number }; children: React.ReactNode; style?: React.CSSProperties }> = ({
	r,
	children,
	style
}) => <div style={{ position: 'absolute', left: r.x, top: r.y - TOP, width: r.w, height: r.h, ...style }}>{children}</div>;

/** Wraps a button so the cursor glides in and clicks it at frame `at`. */
export const Clickable: React.FC<{ at: number; children: React.ReactNode; from?: { x: number; y: number } }> = ({
	at,
	children,
	from = { x: 170, y: 140 }
}) => (
	<span style={{ position: 'relative', display: 'inline-flex' }}>
		{children}
		{at < NEVER && (
			<span style={{ position: 'absolute', left: '55%', top: '62%' }}>
				<Cursor path={[{ x: from.x, y: from.y, at: at - 22 }, { x: 0, y: 0, at: at - 3 }]} clickAt={at} size={46} />
			</span>
		)}
	</span>
);
