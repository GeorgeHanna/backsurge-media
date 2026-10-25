import React from 'react';
import { font } from '../brand';

// Believable YouTube thumbnails for the sample channel, "Frame Rate" (filmmaking
// and creator gear: a niche every YouTuber recognises). Drawn as one 16:9 SVG,
// in the style real thumbnails use: a creator cut out with a white outline, big
// stroked text, a hero object, an arrow or circle, and the duration badge.

export const CHANNEL = { name: 'Frame Rate', initials: 'FR', subs: '214K subscribers' };

type Expr = 'shock' | 'smile' | 'point' | 'frown';
type Prop = 'camera' | 'phone' | 'mic' | 'ring' | 'laptop' | 'none';
type Design = {
	title: string; // the video's title in feeds
	text: string; // big text on the thumbnail
	bg: [string, string];
	face?: { skin: string; hair: string; shirt: string; expr: Expr; side: 'left' | 'right' };
	prop: Prop;
	extra?: 'arrow' | 'circle' | 'vs' | 'split' | 'price';
	textColor?: string;
	views: string;
	age: string;
	duration: string;
};

export const THUMBS: Design[] = [
	{ title: 'How I light my videos for $40', text: '$40 LIGHT', bg: ['#1b2a6b', '#0a0f2c'], face: { skin: '#e8b48f', hair: '#2b1a12', shirt: '#ff5a1f', expr: 'shock', side: 'left' }, prop: 'ring', extra: 'arrow', views: '48K views', age: '2 years ago', duration: '12:48' },
	{ title: 'Budget camera vs $3,000 camera', text: 'WORTH IT?', bg: ['#0f6b5c', '#062b26'], prop: 'camera', extra: 'vs', views: '131K views', age: '1 year ago', duration: '18:02' },
	{ title: 'Why your videos look cheap (5 fixes)', text: 'LOOKS CHEAP?', bg: ['#6b1b4a', '#2a0a1d'], face: { skin: '#8d5a3b', hair: '#140c08', shirt: '#2fb6ff', expr: 'frown', side: 'right' }, prop: 'phone', extra: 'circle', views: '9.4K views', age: '10 months ago', duration: '14:07' },
	{ title: 'Best mic under $100 (blind test)', text: 'UNDER $100', bg: ['#4a2d0b', '#1a0f03'], prop: 'mic', extra: 'price', views: '27K views', age: '1 year ago', duration: '11:36' },
	{ title: 'I edited every day for 30 days', text: '30 DAYS', bg: ['#2a1360', '#0e0626'], face: { skin: '#f1c7a3', hair: '#c9862f', shirt: '#22c55e', expr: 'smile', side: 'right' }, prop: 'laptop', views: '64K views', age: '3 years ago', duration: '21:15' },
	{ title: 'My entire YouTube setup', text: 'MY SETUP', bg: ['#123a5c', '#06141f'], face: { skin: '#c68a62', hair: '#1f140e', shirt: '#ffd400', expr: 'point', side: 'left' }, prop: 'camera', extra: 'arrow', views: '22K views', age: '2 years ago', duration: '16:44' },
	{ title: 'Fix bad audio in 60 seconds', text: 'FIX THIS', bg: ['#5c1212', '#220505'], prop: 'mic', extra: 'circle', views: '5.1K views', age: '8 months ago', duration: '6:12' },
	{ title: 'Color grading in 5 minutes', text: 'BEFORE / AFTER', bg: ['#0b3b4a', '#041a21'], prop: 'none', extra: 'split', views: '38K views', age: '1 year ago', duration: '9:58' }
];

const d = (seed: number) => THUMBS[((seed % THUMBS.length) + THUMBS.length) % THUMBS.length];

// ── pieces (all in a 320×180 box) ──────────────────────────────────────────

const OUTLINE = 'drop-shadow(2.4px 0 0 #fff) drop-shadow(-2.4px 0 0 #fff) drop-shadow(0 2.4px 0 #fff) drop-shadow(0 -2.4px 0 #fff) drop-shadow(0 4px 6px rgba(0,0,0,0.6))';

const Face: React.FC<{ f: NonNullable<Design['face']>; x: number }> = ({ f, x }) => {
	const shock = f.expr === 'shock';
	const brow = shock ? -4 : f.expr === 'frown' ? 2 : -1;
	return (
		<g transform={`translate(${x},22)`} style={{ filter: OUTLINE }}>
			{/* shoulders + shirt */}
			<path d="M-6,170 C-4,128 20,116 50,114 C80,116 104,128 106,170 Z" fill={f.shirt} />
			<path d="M38,104 L62,104 L60,120 Q50,126 40,120 Z" fill={f.skin} filter="brightness(0.85)" />
			{/* ears */}
			<ellipse cx="22" cy="64" rx="6" ry="9" fill={f.skin} />
			<ellipse cx="78" cy="64" rx="6" ry="9" fill={f.skin} />
			{/* head */}
			<ellipse cx="50" cy="62" rx="28" ry="36" fill={f.skin} />
			{/* hair */}
			<path d="M21,58 C18,26 38,16 52,18 C70,18 84,30 79,58 C76,44 66,36 50,36 C36,36 26,42 21,58 Z" fill={f.hair} />
			{/* brows */}
			<path d={`M30,${48 + brow} Q38,${43 + brow} 45,${47 + brow}`} stroke={f.hair} strokeWidth="4.5" fill="none" strokeLinecap="round" />
			<path d={`M55,${47 + brow} Q62,${43 + brow} 70,${48 + brow}`} stroke={f.hair} strokeWidth="4.5" fill="none" strokeLinecap="round" />
			{/* eyes */}
			{[38, 62].map((ex) => (
				<g key={ex}>
					<ellipse cx={ex} cy="58" rx={shock ? 6 : 5} ry={shock ? 6 : 4} fill="#fff" />
					<circle cx={ex + (f.side === 'left' ? 1.2 : -1.2)} cy="58.5" r={shock ? 3 : 2.6} fill="#1a1a1a" />
					<circle cx={ex + (f.side === 'left' ? 2 : -0.4)} cy="57.3" r="0.9" fill="#fff" />
				</g>
			))}
			{/* nose */}
			<path d="M50,62 Q47,72 51,74" stroke="rgba(0,0,0,0.25)" strokeWidth="2" fill="none" strokeLinecap="round" />
			{/* mouth */}
			{shock && (
				<g>
					<ellipse cx="50" cy="84" rx="9" ry="10" fill="#3a0d0d" />
					<path d="M42,79 Q50,76 58,79 L58,81 Q50,79 42,81 Z" fill="#fff" />
				</g>
			)}
			{f.expr === 'smile' && <path d="M38,80 Q50,94 62,80 Q50,86 38,80 Z" fill="#3a0d0d" stroke="#3a0d0d" strokeWidth="1.5" strokeLinejoin="round" />}
			{f.expr === 'point' && <path d="M40,82 Q50,90 61,81" stroke="#3a0d0d" strokeWidth="3.5" fill="none" strokeLinecap="round" />}
			{f.expr === 'frown' && <path d="M40,88 Q50,80 60,88" stroke="#3a0d0d" strokeWidth="3.5" fill="none" strokeLinecap="round" />}
			{/* pointing hand */}
			{f.expr === 'point' && (
				<g transform={f.side === 'left' ? 'translate(84,104)' : 'translate(-30,104) scale(-1,1) translate(-44,0)'}>
					<rect x="0" y="0" width="22" height="18" rx="7" fill={f.skin} />
					<rect x="16" y="3" width="30" height="8" rx="4" fill={f.skin} />
				</g>
			)}
		</g>
	);
};

const Camera: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
	<g transform={`translate(${x},${y}) scale(${s})`} style={{ filter: 'drop-shadow(0 5px 6px rgba(0,0,0,0.6))' }}>
		<rect x="0" y="14" width="110" height="68" rx="10" fill="#24272c" />
		<path d="M30,14 L38,2 L72,2 L80,14 Z" fill="#2e3238" />
		<rect x="0" y="14" width="26" height="68" rx="10" fill="#1a1c20" />
		<circle cx="68" cy="50" r="31" fill="#15171a" />
		<circle cx="68" cy="50" r="24" fill="#0a0b0d" stroke="#3c4148" strokeWidth="3" />
		<circle cx="68" cy="50" r="14" fill="#1b2a52" />
		<circle cx="62" cy="44" r="5" fill="#9fb6ff" opacity="0.7" />
		<circle cx="98" cy="24" r="4" fill="#ff3b3b" />
	</g>
);

const Phone: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
	<g transform={`translate(${x},${y}) scale(${s}) rotate(-10)`} style={{ filter: 'drop-shadow(0 5px 6px rgba(0,0,0,0.6))' }}>
		<rect x="0" y="0" width="54" height="104" rx="10" fill="#111" />
		<rect x="4" y="5" width="46" height="94" rx="7" fill="#3a8dde" />
		<rect x="4" y="5" width="46" height="94" rx="7" fill="url(#thPhoneSky)" />
		<circle cx="27" cy="10" r="2" fill="#000" />
	</g>
);

const Mic: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
	<g transform={`translate(${x},${y}) scale(${s}) rotate(14)`} style={{ filter: 'drop-shadow(0 5px 6px rgba(0,0,0,0.6))' }}>
		<rect x="18" y="96" width="8" height="40" fill="#2a2d33" />
		<rect x="0" y="0" width="44" height="100" rx="22" fill="#2f3339" />
		<rect x="5" y="5" width="34" height="62" rx="17" fill="#9aa1ab" />
		{[14, 22, 30, 38, 46, 54].map((yy) => (
			<line key={yy} x1="7" y1={yy} x2="37" y2={yy} stroke="#5d636c" strokeWidth="2" />
		))}
		<rect x="8" y="74" width="28" height="4" rx="2" fill="#ff5a1f" />
	</g>
);

const Ring: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
	<g transform={`translate(${x},${y}) scale(${s})`}>
		<circle cx="0" cy="0" r="46" fill="none" stroke="#fff6dd" strokeWidth="11" style={{ filter: 'drop-shadow(0 0 10px #fff2c4) drop-shadow(0 0 20px #ffd98a)' }} />
		<rect x="-3" y="46" width="6" height="80" fill="#22252a" />
	</g>
);

const Laptop: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
	<g transform={`translate(${x},${y}) scale(${s})`} style={{ filter: 'drop-shadow(0 5px 6px rgba(0,0,0,0.6))' }}>
		<rect x="0" y="0" width="130" height="80" rx="6" fill="#1b1d22" />
		<rect x="5" y="5" width="120" height="70" rx="3" fill="#0e1014" />
		{[
			[10, 46, 40, '#3b82f6'],
			[52, 46, 30, '#22c55e'],
			[84, 46, 34, '#f59e0b'],
			[10, 56, 60, '#a855f7'],
			[72, 56, 46, '#ef4444']
		].map(([xx, yy, w, c], i) => (
			<rect key={i} x={xx as number} y={yy as number} width={w as number} height="7" rx="2" fill={c as string} />
		))}
		<rect x="10" y="10" width="110" height="30" rx="2" fill="#2b4a7a" />
		<line x1="66" y1="8" x2="66" y2="70" stroke="#ff3b3b" strokeWidth="2" />
		<path d="M-10,80 L140,80 L132,90 L-2,90 Z" fill="#2a2d33" />
	</g>
);

const BigText: React.FC<{ text: string; x: number; y: number; anchor: 'start' | 'middle' | 'end'; color?: string; maxW: number }> = ({
	text,
	x,
	y,
	anchor,
	color = '#ffd400',
	maxW
}) => {
	const size = Math.min(44, (maxW / Math.max(4, text.length)) * 1.75);
	return (
		<text
			x={x}
			y={y}
			textAnchor={anchor}
			fontFamily={font.family}
			fontWeight={900}
			fontSize={size}
			letterSpacing="-0.5"
			fill={color}
			stroke="#000"
			strokeWidth={size * 0.16}
			strokeLinejoin="round"
			paintOrder="stroke"
			transform={`rotate(-4 ${x} ${y})`}
			style={{ filter: 'drop-shadow(0 3px 0 rgba(0,0,0,0.85))' }}
		>
			{text}
		</text>
	);
};

const RedArrow: React.FC<{ x: number; y: number; rot: number }> = ({ x, y, rot }) => (
	<g transform={`translate(${x},${y}) rotate(${rot})`} style={{ filter: 'drop-shadow(0 0 0 #fff) drop-shadow(1.6px 0 0 #fff) drop-shadow(-1.6px 0 0 #fff) drop-shadow(0 1.6px 0 #fff) drop-shadow(0 -1.6px 0 #fff)' }}>
		<path d="M0,-6 L34,-6 L34,-16 L56,0 L34,16 L34,6 L0,6 Z" fill="#ff1f1f" />
	</g>
);

/** A YouTube-style thumbnail. `seed` picks the design; `label` overrides its big text. */
export const Thumb: React.FC<{
	seed: number;
	label?: string;
	width: number;
	duration?: string;
	radius?: number;
	style?: React.CSSProperties;
	watched?: number; // 0..1 red "watched" bar
}> = ({ seed, label, width, duration, radius, style, watched }) => {
	const t = d(seed);
	const text = label ?? t.text;
	const dur = duration ?? t.duration;
	const faceLeft = t.face?.side === 'left';
	const id = `th${seed}`;
	return (
		<svg
			viewBox="0 0 320 180"
			width={width}
			height={(width * 9) / 16}
			style={{ display: 'block', borderRadius: radius ?? Math.max(4, width * 0.035), overflow: 'hidden', flexShrink: 0, ...style }}
		>
			<defs>
				<radialGradient id={`${id}bg`} cx="50%" cy="40%" r="80%">
					<stop offset="0%" stopColor={t.bg[0]} />
					<stop offset="100%" stopColor={t.bg[1]} />
				</radialGradient>
				<radialGradient id={`${id}bokeh`}>
					<stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
					<stop offset="100%" stopColor="#fff" stopOpacity="0" />
				</radialGradient>
				<linearGradient id="thPhoneSky" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#ffb347" />
					<stop offset="100%" stopColor="#7b3fd1" />
				</linearGradient>
			</defs>
			<rect width="320" height="180" fill={`url(#${id}bg)`} />
			{/* soft background bokeh, like a real shallow-focus room */}
			{[
				[40, 30, 26],
				[280, 40, 34],
				[250, 150, 22],
				[90, 160, 30],
				[170, 20, 18]
			].map(([cx, cy, r], i) => (
				<circle key={i} cx={cx} cy={cy} r={r} fill={`url(#${id}bokeh)`} />
			))}
			{t.extra === 'split' && (
				<>
					{/* the same sunset shot, flat on the left, graded on the right */}
					<defs>
						<linearGradient id="thSkyFlat" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#9aa3ad" />
							<stop offset="100%" stopColor="#c9c5bd" />
						</linearGradient>
						<linearGradient id="thSkyGraded" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#1b2c6b" />
							<stop offset="55%" stopColor="#ff5a1f" />
							<stop offset="100%" stopColor="#ffc24a" />
						</linearGradient>
					</defs>
					<rect x="0" y="0" width="160" height="180" fill="url(#thSkyFlat)" />
					<rect x="160" y="0" width="160" height="180" fill="url(#thSkyGraded)" />
					<circle cx="160" cy="118" r="30" fill="#e5e1d8" />
					<path d="M160,88 A30,30 0 0 1 160,148 Z" fill="#fff1b8" />
					<path d="M0,180 L0,132 L50,96 L92,128 L130,104 L160,124 L160,180 Z" fill="#7d8287" />
					<path d="M160,180 L160,124 L196,100 L236,130 L282,92 L320,120 L320,180 Z" fill="#1a0f2e" />
					<path d="M160,124 L130,104 L160,124 Z" fill="#1a0f2e" />
					<line x1="160" y1="0" x2="160" y2="180" stroke="#fff" strokeWidth="4" />
				</>
			)}
			{/* hero object */}
			{t.prop === 'camera' && <Camera x={t.face ? (faceLeft ? 175 : 30) : t.extra === 'vs' ? 18 : 110} y={t.face ? 70 : 62} s={t.face ? 1.05 : 1.15} />}
			{t.prop === 'camera' && t.extra === 'vs' && <Phone x={232} y={70} s={0.95} />}
			{t.prop === 'phone' && <Phone x={faceLeft ? 220 : 40} y={70} />}
			{t.prop === 'mic' && <Mic x={t.face ? (faceLeft ? 230 : 40) : 200} y={44} s={1.05} />}
			{t.prop === 'ring' && <Ring x={faceLeft ? 236 : 84} y={78} s={0.95} />}
			{t.prop === 'laptop' && <Laptop x={faceLeft ? 172 : 22} y={84} s={1.05} />}
			{/* creator */}
			{t.face && <Face f={t.face} x={faceLeft ? 6 : 214} />}
			{/* accents */}
			{t.extra === 'vs' && (
				<g transform="translate(184,96) rotate(-8)">
					<circle r="22" fill="#ff1f1f" stroke="#fff" strokeWidth="4" />
					<text y="8" textAnchor="middle" fontFamily={font.family} fontWeight={900} fontSize="22" fill="#fff">
						VS
					</text>
				</g>
			)}
			{t.extra === 'arrow' && <RedArrow x={faceLeft ? 150 : 140} y={130} rot={faceLeft ? 10 : 170} />}
			{t.extra === 'circle' && (
				<ellipse cx={t.prop === 'mic' ? 222 : faceLeft ? 252 : 72} cy={110} rx="46" ry="52" fill="none" stroke="#ff1f1f" strokeWidth="6" style={{ filter: 'drop-shadow(0 0 0.5px #fff)' }} />
			)}
			{t.extra === 'price' && (
				<g transform="translate(60,128) rotate(-10)">
					<rect x="-46" y="-22" width="92" height="44" rx="8" fill="#22c55e" stroke="#000" strokeWidth="4" />
					<text y="11" textAnchor="middle" fontFamily={font.family} fontWeight={900} fontSize="30" fill="#fff" stroke="#000" strokeWidth="4" paintOrder="stroke">
						$79
					</text>
				</g>
			)}
			{/* big text */}
			<BigText
				text={text}
				x={t.extra === 'split' ? 160 : t.face ? (faceLeft ? 312 : 10) : t.prop === 'mic' ? 12 : 160}
				y={t.extra === 'split' ? 44 : 46}
				anchor={t.extra === 'split' || (!t.face && t.prop !== 'mic') ? 'middle' : t.face && faceLeft ? 'end' : 'start'}
				color={t.textColor}
				maxW={t.extra === 'split' || (!t.face && t.prop !== 'mic') ? 300 : 190}
			/>
			{/* duration badge + watched bar, like the real thing */}
			{dur && (
				<g>
					<rect x={320 - 8 - dur.length * 7.4 - 8} y={180 - 8 - 17} width={dur.length * 7.4 + 8} height="17" rx="3.5" fill="rgba(0,0,0,0.82)" />
					<text x={320 - 8 - 4} y={180 - 8 - 4.5} textAnchor="end" fontFamily={font.family} fontWeight={600} fontSize="12.5" fill="#fff">
						{dur}
					</text>
				</g>
			)}
			{watched !== undefined && (
				<g>
					<rect x="0" y="176" width="320" height="4" fill="rgba(255,255,255,0.35)" />
					<rect x="0" y="176" width={320 * watched} height="4" fill="#ff0033" />
				</g>
			)}
		</svg>
	);
};

/**
 * A video as it appears in a YouTube feed: thumbnail, channel avatar, title,
 * channel name, views and age. Generic styling, no YouTube branding.
 */
export const VideoCard: React.FC<{
	seed: number;
	width: number;
	title?: string;
	meta?: string;
	dark?: boolean;
	style?: React.CSSProperties;
	watched?: number;
	titleStyle?: React.CSSProperties;
}> = ({ seed, width, title, meta, style, watched, titleStyle }) => {
	const t = d(seed);
	const k = width / 320;
	return (
		<div style={{ width, fontFamily: font.family, ...style }}>
			<Thumb seed={seed} width={width} radius={12 * k} watched={watched} />
			<div style={{ display: 'flex', gap: 12 * k, marginTop: 10 * k }}>
				<div
					style={{
						width: 36 * k,
						height: 36 * k,
						borderRadius: '50%',
						flexShrink: 0,
						background: 'linear-gradient(135deg, #ff5a1f, #ffb347)',
						color: '#111',
						fontSize: 13 * k,
						fontWeight: 900,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					{CHANNEL.initials}
				</div>
				<div style={{ minWidth: 0 }}>
					<div style={{ fontSize: 17 * k, fontWeight: 700, lineHeight: 1.25, color: '#f1f1f1', ...titleStyle }}>{title ?? t.title}</div>
					<div style={{ fontSize: 13.5 * k, color: '#aaa', marginTop: 4 * k }}>{meta ?? `${CHANNEL.name} · ${t.views} · ${t.age}`}</div>
				</div>
			</div>
		</div>
	);
};
