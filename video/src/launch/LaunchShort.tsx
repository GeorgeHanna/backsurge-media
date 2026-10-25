import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { clusters, color, font, type ClusterId } from '../brand';
import { LIBRARY, quadrant, TITLES } from '../components/MapPlot';
import { Thumb, VideoCard } from '../components/Thumb';
import { LogoMark } from '../components/ui';
import { mulberry32 } from '../layout';

// The channel launch Short (1080×1920, ~24s). Text and sound effects only:
// no voice, no music (music gets added on YouTube). Built for a muted,
// scrolling viewer:
//   0s   pattern interrupt: a wall of old videos + "Your old videos aren't dead."
//   2s   curiosity: one video is loved but hidden. Why?
//   5s   the fix: rewrite the title (satisfying, concrete)
//   8.5s payoff: did it work? the line jumps (example data, labelled)
//   12.5s scale: every video, sorted (map explodes into four groups), then each
//        group lights up with what it is and what to do
//   19.5s proof it's easy: spots changes, verdicts, undo
//   23s  low-friction CTA, then it fades back into the wall so the loop is seamless.
//
// Everything sits in the Shorts safe area: clear of the top bar, the caption
// and buttons at the bottom, and the button column on the right.

const SAFE = { top: 250, bottom: 1440, left: 70, right: 930 };
const CX = (SAFE.left + SAFE.right) / 2;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const prog = (f: number, a: number, d: number) => Math.min(1, Math.max(0, (f - a) / d));

export const LAUNCH = { fps: 30, frames: 810 };
const B = { gem: 60, title: 150, result: 255, map: 375, montage: 585, cta: 690 };

// ── Text that slams in ─────────────────────────────────────────────────────

const Slam: React.FC<{
	at: number;
	size?: number;
	color?: string;
	y: number;
	children: React.ReactNode;
	out?: number;
	weight?: number;
	glow?: boolean;
}> = ({ at, size = 120, color: c = color.fg, y, children, out, weight = 900, glow }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	if (frame < at) return null;
	const p = spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 240, mass: 0.7 } });
	const o = out !== undefined ? interpolate(frame, [out, out + 6], [1, 0], clamp) : 1;
	const blur = Math.max(0, (1 - p) * 14);
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.left,
				right: 1080 - SAFE.right,
				top: y,
				textAlign: 'center',
				fontFamily: font.family,
				fontSize: size,
				fontWeight: weight,
				letterSpacing: '-0.045em',
				lineHeight: 1.0,
				color: c,
				opacity: Math.min(1, p * 2) * o,
				transform: `scale(${1.7 - 0.7 * p}) translateY(${(1 - o) * -30}px)`,
				filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
				textShadow: glow ? `0 0 60px ${c}66, 0 8px 40px rgba(0,0,0,0.8)` : '0 8px 40px rgba(0,0,0,0.8)'
			}}
		>
			{children}
		</div>
	);
};

// ── Beat 1–2: the wall of old videos ───────────────────────────────────────

// A channel's "Videos" page: the back catalogue, card after card.
const Wall: React.FC = () => {
	const frame = useCurrentFrame();
	const r = mulberry32(7);
	const cols = 4;
	const rows = 9;
	const cw = 380;
	const cells = Array.from({ length: cols * rows }, (_, i) => ({
		seed: (i * 5 + 3) % 8,
		title: TITLES[(i * 7) % TITLES.length],
		meta: `Frame Rate · ${(1 + r() * 60).toFixed(1).replace('.0', '')}K views · ${1 + Math.floor(r() * 4)} years ago`,
		i
	}));
	// Dim the wall as the story moves on, and blur it behind the gem.
	const dim = interpolate(frame, [0, 20, B.gem, B.gem + 15, B.title, B.title + 10], [0.85, 0.6, 0.6, 0.3, 0.3, 0], clamp);
	const blur = interpolate(frame, [B.gem, B.gem + 15], [0, 10], clamp);
	// The wall also comes back in the last frames, for the loop.
	const back = interpolate(frame, [LAUNCH.frames - 14, LAUNCH.frames], [0, 0.85], clamp);
	const op = Math.max(dim, back);
	if (op <= 0) return null;
	const drift = (frame % LAUNCH.frames) * 2.2;
	return (
		<AbsoluteFill style={{ overflow: 'hidden', opacity: op }}>
			<div
				style={{
					position: 'absolute',
					left: -330,
					top: -700,
					display: 'grid',
					gridTemplateColumns: `repeat(${cols}, ${cw}px)`,
					gap: '34px 28px',
					transform: `perspective(1800px) rotateX(24deg) rotateZ(-9deg) translateY(${-drift + 300}px) scale(1.15)`,
					transformOrigin: '50% 50%',
					filter: `saturate(0.6) brightness(0.7)${blur > 0.5 && back === 0 ? ` blur(${blur}px)` : ''}`
				}}
			>
				{cells.map((c) => (
					<VideoCard key={c.i} seed={c.seed} width={cw} title={c.title} meta={c.meta} />
				))}
			</div>
			<AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 45% at 50% 42%, rgba(5,7,11,0.5), rgba(5,7,11,0.9))' }} />
		</AbsoluteFill>
	);
};

const Hook: React.FC = () => (
	<>
		<Slam at={3} y={660} size={118}>
			Your old videos
		</Slam>
		<Slam at={20} y={800} size={150} color={color.surge} glow>
			aren't dead.
		</Slam>
	</>
);

// ── Beat 2: the hidden gem ─────────────────────────────────────────────────

const STAT_Y = 1040;

/** The title + channel line under the gem's thumbnail, as in a YouTube feed. */
const VideoCardText: React.FC<{ w: number; title: string }> = ({ w, title }) => {
	const k = w / 760;
	return (
		<div style={{ display: 'flex', gap: 20 * k, marginTop: 18 * k, fontFamily: font.family }}>
			<div style={{ width: 64 * k, height: 64 * k, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #ff5a1f, #ffb347)', color: '#111', fontSize: 24 * k, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				FR
			</div>
			<div style={{ minWidth: 0 }}>
				<div style={{ fontSize: 40 * k, fontWeight: 700, lineHeight: 1.2, color: '#f1f1f1', minHeight: 40 * k * 1.2 }}>{title || '\u00a0'}</div>
				<div style={{ fontSize: 30 * k, color: '#aaa', marginTop: 6 * k }}>Frame Rate · 2.1K views · 2 years ago</div>
			</div>
		</div>
	);
};

const Gem: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const f = frame - B.gem;
	if (f < 0 || frame >= B.result) return null;
	const pop = spring({ frame: f, fps, config: { damping: 14, stiffness: 120, mass: 0.9 } });
	// In the title beat, the thumbnail moves up and shrinks to make room.
	const up = spring({ frame: frame - B.title, fps, config: { damping: 18, stiffness: 140 } });
	const w = 700 - 260 * up;
	const top = interpolate(pop, [0, 1], [900, 470]) - 140 * up;
	const rot = (1 - pop) * -14;
	const ring = 0.5 + 0.5 * Math.sin(f / 5);
	const out = interpolate(frame, [B.result - 8, B.result], [1, 0], clamp);
	return (
		<div
			style={{
				position: 'absolute',
				left: CX - w / 2,
				top,
				transform: `rotate(${rot}deg) scale(${0.3 + 0.7 * pop})`,
				opacity: Math.min(1, pop * 2) * out,
				filter: `drop-shadow(0 0 ${30 + 30 * ring}px rgba(255,174,43,${0.35 + 0.25 * ring}))`
			}}
		>
			<div style={{ borderRadius: 26, border: `6px solid #ffae2b`, overflow: 'hidden', background: '#0f0f0f' }}>
				<Thumb seed={0} width={w - 12} radius={18} />
			</div>
			<VideoCardText w={w} title={frame < TYPE + NEW.length * CHAR ? OLD : NEW} />
		</div>
	);
};

const Chip: React.FC<{ at: number; y: number; tone: string; big: string; small: string; out?: number }> = ({ at, y, tone, big, small, out }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	if (frame < at) return null;
	const p = spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });
	const o = out !== undefined ? interpolate(frame, [out, out + 6], [1, 0], clamp) : 1;
	return (
		<div style={{ position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: y, display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 2) * o }}>
			<div
				style={{
					display: 'flex',
					alignItems: 'baseline',
					gap: 18,
					padding: '18px 34px',
					borderRadius: 24,
					background: `${tone}1c`,
					border: `3px solid ${tone}`,
					transform: `scale(${p})`,
					fontFamily: font.family
				}}
			>
				<span style={{ fontSize: 64, fontWeight: 900, color: tone, letterSpacing: '-0.03em' }}>{big}</span>
				<span style={{ fontSize: 34, fontWeight: 700, color: color.fg }}>{small}</span>
			</div>
		</div>
	);
};

const GemText: React.FC = () => (
	<>
		<Slam at={B.gem + 8} y={300} size={96} out={B.title - 6}>
			This one's loved.
		</Slam>
		<Chip at={B.gem + 26} y={STAT_Y} tone={color.green} big="2.1×" small="your avg. likes per view" out={B.title - 6} />
		<Chip at={B.gem + 40} y={STAT_Y + 118} tone={color.red} big="0.3×" small="your avg. views" out={B.title - 6} />
		<Slam at={B.gem + 58} y={STAT_Y + 255} size={88} color={color.surge} out={B.title - 6}>
			Nobody finds it.
		</Slam>
	</>
);

// ── Beat 3: rewrite the title ──────────────────────────────────────────────

const OLD = 'My lighting setup';
const NEW = 'How I light my videos for $40';
const STRIKE = B.title + 26;
const TYPE = B.title + 40;
const CHAR = 1.25;

const TitleFix: React.FC = () => {
	const frame = useCurrentFrame();
	if (frame < B.title || frame >= B.result) return null;
	const strike = easeOut(prog(frame, STRIKE, 8));
	const typed = NEW.slice(0, Math.max(0, Math.floor((frame - TYPE) / CHAR)));
	const done = typed.length === NEW.length;
	const caret = !done && Math.floor(frame / 6) % 2 === 0;
	const card = easeOut(prog(frame, B.title + 10, 12));
	const out = interpolate(frame, [B.result - 8, B.result], [1, 0], clamp);
	const flash = done ? Math.max(0, 1 - (frame - TYPE - NEW.length * CHAR) / 18) : 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.left,
				width: SAFE.right - SAFE.left,
				top: 860,
				opacity: card * out,
				transform: `translateY(${(1 - card) * 60}px)`,
				fontFamily: font.family
			}}
		>
			<div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.14em', color: color.fgMuted, marginBottom: 18 }}>TITLE</div>
			<div style={{ position: 'relative', display: 'inline-block', fontSize: 58, fontWeight: 700, color: color.fgMuted }}>
				{OLD}
				<div style={{ position: 'absolute', left: -6, top: '54%', height: 8, width: `calc(${strike * 100}% + 12px)`, background: color.red, borderRadius: 4 }} />
			</div>
			<div
				style={{
					marginTop: 26,
					fontSize: 76,
					fontWeight: 900,
					letterSpacing: '-0.03em',
					lineHeight: 1.08,
					color: color.fg,
					minHeight: 170,
					textShadow: flash > 0 ? `0 0 ${50 * flash}px rgba(255,137,24,${flash})` : undefined
				}}
			>
				{typed}
				<span style={{ color: color.surge, opacity: caret ? 1 : 0 }}>|</span>
			</div>
		</div>
	);
};

// ── Beat 4: did it work? ───────────────────────────────────────────────────

const CHANGE_AT = 0.5; // where on the line the title changed
const Result: React.FC = () => {
	const frame = useCurrentFrame();
	const f = frame - B.result;
	if (f < 0 || frame >= B.map) return null;
	const W = SAFE.right - SAFE.left;
	const H = 420;
	const top = 700;
	const n = 80;
	const r = mulberry32(3);
	const pts = Array.from({ length: n }, (_, i) => {
		const t = i / (n - 1);
		const base = t < CHANGE_AT ? 0.3 : 0.3 + 0.32 * easeOut(Math.min(1, (t - CHANGE_AT) / 0.12));
		return [t * W, H - (base + (r() - 0.5) * 0.05) * H] as const;
	});
	const draw = interpolate(f, [14, 60], [0, 1], { ...clamp, easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) });
	const shown = Math.max(2, Math.round(draw * n));
	const d = pts.slice(0, shown).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
	const area = `${d} L${pts[shown - 1][0]},${H} L0,${H} Z`;
	const head = pts[shown - 1];
	const markerP = easeOut(prog(f, 14 + 46 * CHANGE_AT, 8));
	const countP = easeOut(prog(f, 62, 22));
	const out = interpolate(frame, [B.map - 8, B.map], [1, 0], clamp);
	const shake = f >= 62 && f < 70 ? Math.sin((f - 62) * 2.8) * (70 - f) * 1.2 : 0;
	return (
		<AbsoluteFill style={{ opacity: out, fontFamily: font.family }}>
			<Slam at={B.result + 2} y={330} size={120}>
				Did it work?
			</Slam>
			<svg width={W} height={H + 10} style={{ position: 'absolute', left: SAFE.left, top, overflow: 'visible' }}>
				<defs>
					<linearGradient id="launchFill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={color.surge} stopOpacity={0.45} />
						<stop offset="100%" stopColor={color.surge} stopOpacity={0} />
					</linearGradient>
				</defs>
				<path d={area} fill="url(#launchFill)" />
				<path d={d} fill="none" stroke={color.surge} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
				<g opacity={markerP}>
					<line x1={CHANGE_AT * W} x2={CHANGE_AT * W} y1={0} y2={H} stroke={color.fg} strokeOpacity={0.6} strokeWidth={4} strokeDasharray="14 12" />
					<text x={CHANGE_AT * W - 16} y={40} textAnchor="end" fontSize={34} fontWeight={800} fill={color.fgSoft}>
						new title
					</text>
				</g>
				<circle cx={head[0]} cy={head[1]} r={16} fill={color.surge} stroke="#fff" strokeWidth={5} opacity={draw < 1 ? 1 : 0} />
			</svg>
			{f >= 62 && (
				<div
					style={{
						position: 'absolute',
						left: SAFE.left,
						width: SAFE.right - SAFE.left,
						top: 1160,
						textAlign: 'center',
						transform: `translateX(${shake}px) scale(${0.6 + 0.4 * easeOut(prog(f, 62, 8))})`
					}}
				>
					<div style={{ fontSize: 190, fontWeight: 900, letterSpacing: '-0.05em', color: color.green, lineHeight: 1, textShadow: `0 0 70px ${color.green}55` }}>
						+{Math.round(38 * countP)}%
					</div>
					<div style={{ fontSize: 34, fontWeight: 700, color: color.fgSoft, marginTop: 6 }}>views per day · example</div>
				</div>
			)}
		</AbsoluteFill>
	);
};

// ── Beat 5: every video, sorted ────────────────────────────────────────────

/** The four groups, in the order they light up: what each is, and what to do. */
const TOUR: { id: ClusterId; what: string; todo: string }[] = [
	{ id: 'star', what: 'Loved and found.', todo: 'Leave them alone.' },
	{ id: 'hidden_gem', what: 'Loved, not found.', todo: 'New title or thumbnail.' },
	{ id: 'wide_reach', what: 'Found, not loved.', todo: 'Fix the intro.' },
	{ id: 'underperformer', what: 'Neither.', todo: 'New angle, or let go.' }
];
const TOUR_START = 52; // frames into the map beat
const TOUR_STEP = 38;
export const tourFrames = TOUR.map((_, i) => B.map + TOUR_START + i * TOUR_STEP);

const MapBurst: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const f = frame - B.map;
	if (f < 0 || frame >= B.montage) return null;
	const S = 700; // plot square
	const left = CX - S / 2;
	const top = 560;
	const burst = 16;
	const r = mulberry32(11);
	const out = interpolate(frame, [B.montage - 8, B.montage], [1, 0], clamp);
	const shock = prog(f, burst, 22);
	const groupsP = easeOut(prog(f, burst + 26, 12));
	// Which group is lit right now (-1 = none yet).
	const step = f < TOUR_START ? -1 : Math.min(TOUR.length - 1, Math.floor((f - TOUR_START) / TOUR_STEP));
	const lit = step >= 0 ? TOUR[step].id : undefined;
	const litP = step >= 0 ? easeOut(prog(f, TOUR_START + step * TOUR_STEP, 8)) : 0;
	const pulse = 1 + Math.sin(f / 4) * 0.18;
	const order: ClusterId[] = ['star', 'hidden_gem', 'wide_reach', 'underperformer'];
	return (
		<AbsoluteFill style={{ opacity: out, fontFamily: font.family }}>
			<Slam at={B.map + 2} y={290} size={96}>
				Now sort
			</Slam>
			<Slam at={B.map + 10} y={395} size={110} color={color.surge} glow>
				every video.
			</Slam>
			<div style={{ position: 'absolute', left, top, width: S, height: S }}>
				{/* quadrant tints */}
				{order.map((id) => {
					const q = quadrant(id);
					const on = id === lit;
					return (
						<div
							key={id}
							style={{
								position: 'absolute',
								left: q.x * S,
								top: q.y * S,
								width: q.w * S,
								height: q.h * S,
								background: clusters[id].color,
								opacity: groupsP * (lit ? (on ? 0.12 + 0.12 * litP : 0.05) : 0.1),
								outline: on ? `4px solid ${clusters[id].color}` : undefined,
								outlineOffset: -4,
								borderRadius: 8
							}}
						/>
					);
				})}
				<div style={{ position: 'absolute', left: LIBRARY.mx * S - 2, top: 0, width: 4, height: S, background: color.fgSoft, opacity: 0.35 * groupsP }} />
				<div style={{ position: 'absolute', top: LIBRARY.my * S - 2, left: 0, height: 4, width: S, background: color.fgSoft, opacity: 0.35 * groupsP }} />
				{/* axis hints */}
				<div style={{ position: 'absolute', left: 0, right: 0, top: S + 10, textAlign: 'right', fontSize: 26, fontWeight: 700, color: color.fgMuted, opacity: groupsP }}>views per day →</div>
				<div style={{ position: 'absolute', left: -46, top: S / 2, transform: 'rotate(-90deg)', transformOrigin: '0 0', fontSize: 26, fontWeight: 700, color: color.fgMuted, opacity: groupsP, whiteSpace: 'nowrap' }}>
					<span style={{ display: 'inline-block', transform: 'translateX(-50%)' }}>likes per view →</span>
				</div>
				{/* shockwave */}
				{shock > 0 && shock < 1 && (
					<div
						style={{
							position: 'absolute',
							left: S / 2 - 520 * shock,
							top: S / 2 - 520 * shock,
							width: 1040 * shock,
							height: 1040 * shock,
							borderRadius: '50%',
							border: `${10 * (1 - shock)}px solid ${color.surge}`,
							opacity: 1 - shock
						}}
					/>
				)}
				{/* dots: gathered in a ball, then burst to their places */}
				{LIBRARY.points.map((p, i) => {
					const a = r() * Math.PI * 2;
					const rad = 26 + r() * 50;
					const sx = 0.5 + (Math.cos(a) * rad) / S;
					const sy = 0.5 + (Math.sin(a) * rad) / S;
					const gather = easeOut(prog(f, i * 0.25, 10));
					const go = spring({ frame: f - burst - (i % 6), fps, config: { damping: 12, stiffness: 90, mass: 0.8 } });
					const x = sx + (p.nx - sx) * go;
					const y = sy + (p.ny - sy) * go;
					const on = p.cluster === lit;
					const dim = lit && !on ? 1 - litP * 0.7 : 1;
					const size = 22 * (on ? pulse * (1 + 0.25 * litP) : 1);
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: x * S - size / 2,
								top: y * S - size / 2,
								width: size,
								height: size,
								borderRadius: '50%',
								background: go < 0.15 ? color.fg : clusters[p.cluster].color,
								opacity: gather * dim,
								boxShadow: on ? `0 0 22px ${clusters[p.cluster].color}` : undefined
							}}
						/>
					);
				})}
				{/* group names in their corners */}
				{order.map((id, k) => {
					const q = quadrant(id);
					const right = id === 'star' || id === 'wide_reach';
					const topSide = id === 'star' || id === 'hidden_gem';
					const p = easeOut(prog(f, burst + 26 + k * 3, 10));
					const on = id === lit;
					const dim = lit && !on ? 0.35 : 1;
					return (
						<div
							key={id}
							style={{
								position: 'absolute',
								left: right ? undefined : q.x * S + 16,
								right: right ? S - (q.x + q.w) * S + 16 : undefined,
								top: topSide ? q.y * S + 12 : undefined,
								bottom: topSide ? undefined : S - (q.y + q.h) * S + 12,
								fontSize: 34,
								fontWeight: 900,
								color: clusters[id].color,
								opacity: p * dim,
								transform: `translateY(${(1 - p) * 16}px) scale(${on ? 1 + 0.12 * litP : 1})`,
								transformOrigin: right ? 'right center' : 'left center'
							}}
						>
							{clusters[id].label}
						</div>
					);
				})}
			</div>
			{/* what it is + what to do, for the lit group */}
			{step >= 0 && <TourCard key={step} at={B.map + TOUR_START + step * TOUR_STEP} item={TOUR[step]} top={top + S + 54} />}
		</AbsoluteFill>
	);
};

const TourCard: React.FC<{ at: number; item: (typeof TOUR)[number]; top: number }> = ({ at, item, top }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const p = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 230, mass: 0.6 } });
	const c = clusters[item.id].color;
	return (
		<div style={{ position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top, display: 'flex', justifyContent: 'center' }}>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 6,
					padding: '16px 36px',
					minWidth: 600,
					borderRadius: 24,
					background: '#12161c',
					border: `4px solid ${c}`,
					boxShadow: `0 0 50px ${c}33`,
					opacity: Math.min(1, p * 2),
					transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + 0.1 * p})`
				}}
			>
				<div style={{ fontSize: 36, fontWeight: 700, color: color.fgSoft, whiteSpace: 'nowrap' }}>{item.what}</div>
				<div style={{ fontSize: 54, fontWeight: 900, color: color.fg, whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
					<span style={{ color: c }}>→ </span>
					{item.todo}
				</div>
			</div>
		</div>
	);
};

// ── Beat 6: it does the boring part ────────────────────────────────────────

const Punch: React.FC<{ at: number; dur: number; label: string; children: React.ReactNode }> = ({ at, dur, label, children }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const f = frame - at;
	if (f < 0 || f >= dur) return null;
	const p = spring({ frame: f, fps, config: { damping: 14, stiffness: 200, mass: 0.7 } });
	const out = interpolate(f, [dur - 6, dur], [0, 1], clamp);
	return (
		<AbsoluteFill style={{ fontFamily: font.family }}>
			<div
				style={{
					position: 'absolute',
					left: SAFE.left,
					width: SAFE.right - SAFE.left,
					top: 470,
					textAlign: 'center',
					fontSize: 92,
					fontWeight: 900,
					letterSpacing: '-0.04em',
					lineHeight: 1.02,
					color: color.fg,
					opacity: Math.min(1, p * 2) * (1 - out),
					transform: `translateX(${(1 - p) * 160 - out * 200}px)`
				}}
			>
				{label}
			</div>
			<div
				style={{
					position: 'absolute',
					left: SAFE.left,
					width: SAFE.right - SAFE.left,
					top: 860,
					display: 'flex',
					justifyContent: 'center',
					opacity: Math.min(1, p * 2) * (1 - out),
					transform: `translateX(${(1 - p) * 260 - out * 300}px) rotate(${(1 - p) * 6}deg) scale(${1.0 + 0.2 * p})`
				}}
			>
				{children}
			</div>
		</AbsoluteFill>
	);
};

const PUNCH = [B.montage, B.montage + 35, B.montage + 70];

const Montage: React.FC = () => {
	const frame = useCurrentFrame();
	const card: React.CSSProperties = {
		background: '#14181f',
		border: `3px solid ${color.border}`,
		borderRadius: 34,
		padding: '34px 38px',
		boxShadow: '0 30px 90px rgba(0,0,0,0.6)'
	};
	const undoPressed = interpolate(frame - (PUNCH[2] + 14), [0, 3, 7], [0, 1, 0], clamp);
	const undone = frame >= PUNCH[2] + 18;
	return (
		<>
			<Punch at={PUNCH[0]} dur={35} label="Spots every change.">
				<div style={{ ...card, display: 'flex', gap: 26, alignItems: 'center', width: 700 }}>
					<LogoMark size={96} />
					<div>
						<div style={{ fontSize: 26, color: color.fgMuted, fontWeight: 700 }}>BACKSURGE · now</div>
						<div style={{ fontSize: 40, fontWeight: 800, color: color.fg, marginTop: 6, lineHeight: 1.15 }}>We spotted a new title</div>
						<div style={{ fontSize: 30, color: color.fgSoft, marginTop: 4 }}>on “My lighting setup”</div>
					</div>
				</div>
			</Punch>
			<Punch at={PUNCH[1]} dur={35} label="Tells you if it worked.">
				<div style={{ ...card, textAlign: 'center', width: 640 }}>
					<div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.12em', color: color.fgMuted }}>14-DAY EXPERIMENT</div>
					<div
						style={{
							display: 'inline-block',
							marginTop: 22,
							padding: '16px 40px',
							borderRadius: 999,
							fontSize: 64,
							fontWeight: 900,
							color: color.emerald,
							background: `${color.emerald}22`,
							border: `4px solid ${color.emerald}`
						}}
					>
						▲ Winning
					</div>
				</div>
			</Punch>
			<Punch at={PUNCH[2]} dur={40} label="Undo in one click.">
				<div style={{ ...card, display: 'flex', alignItems: 'center', gap: 30 }}>
					<Thumb seed={3} label={undone ? undefined : 'BEST MIC?!'} width={330} radius={14} />
					<div
						style={{
							fontSize: 54,
							fontWeight: 900,
							padding: '22px 34px',
							borderRadius: 22,
							background: undone ? color.green : color.surfaceHi,
							color: undone ? '#0b0d10' : color.fg,
							border: `3px solid ${undone ? color.green : color.border}`,
							transform: `scale(${1 - undoPressed * 0.1})`
						}}
					>
						{undone ? '✓ Restored' : '↺ Undo'}
					</div>
				</div>
			</Punch>
		</>
	);
};

// ── Beat 7: call to action ─────────────────────────────────────────────────

const URL = 'backsurge.com';
const CTA: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const f = frame - B.cta;
	if (f < 0) return null;
	const logo = spring({ frame: f, fps, config: { damping: 10, stiffness: 160, mass: 0.8 } });
	const typedN = Math.max(0, Math.floor((f - 18) / 1.6));
	const url = URL.slice(0, typedN);
	const urlDone = typedN >= URL.length;
	const sub = easeOut(prog(f, 18 + URL.length * 1.6 + 4, 10));
	const breathe = 1 + Math.sin(f / 7) * 0.025;
	const out = interpolate(frame, [LAUNCH.frames - 14, LAUNCH.frames], [1, 0], clamp);
	return (
		<AbsoluteFill style={{ fontFamily: font.family, opacity: out }}>
			<div style={{ position: 'absolute', left: 0, width: 1000, top: 430, display: 'flex', justifyContent: 'center', transform: `scale(${logo}) rotate(${(1 - logo) * -25}deg)` }}>
				<LogoMark size={190} />
			</div>
			<Slam at={B.cta + 8} y={680} size={86}>
				Find the views hiding
			</Slam>
			<Slam at={B.cta + 12} y={780} size={86}>
				in your old videos.
			</Slam>
			<div style={{ position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: 960, display: 'flex', justifyContent: 'center' }}>
				<div
					style={{
						fontSize: 96,
						fontWeight: 900,
						letterSpacing: '-0.035em',
						padding: '26px 48px',
						borderRadius: 30,
						background: urlDone ? color.surge : 'transparent',
						border: `5px solid ${color.surge}`,
						color: urlDone ? '#111' : color.surge,
						transform: `scale(${urlDone ? breathe : 1})`,
						boxShadow: urlDone ? `0 0 90px ${color.surgeGlow}` : undefined,
						minWidth: 300,
						textAlign: 'center'
					}}
				>
					{url || ' '}
					{!urlDone && <span style={{ opacity: Math.floor(f / 5) % 2 ? 0 : 1 }}>|</span>}
				</div>
			</div>
			<div style={{ position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: 1170, textAlign: 'center', opacity: sub, transform: `translateY(${(1 - sub) * 24}px)` }}>
				<div style={{ fontSize: 44, fontWeight: 800, color: color.fg }}>Free for YouTube creators</div>
				<div style={{ fontSize: 34, fontWeight: 600, color: color.fgSoft, marginTop: 10 }}>No credit card · 1-minute setup</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Sound design (no music, no voice) ──────────────────────────────────────

type S = { name: string; at: number; v: number };
const sfx = (): S[] => {
	const s: S[] = [
		{ name: 'impact', at: 3, v: 0.55 },
		{ name: 'impact', at: 20, v: 0.7 },
		{ name: 'whoosh', at: B.gem, v: 0.45 },
		{ name: 'ding', at: B.gem + 10, v: 0.35 },
		{ name: 'pop', at: B.gem + 26, v: 0.5 },
		{ name: 'pop', at: B.gem + 40, v: 0.5 },
		{ name: 'impact', at: B.gem + 58, v: 0.35 },
		{ name: 'whoosh', at: B.title, v: 0.35 },
		{ name: 'swipe', at: STRIKE, v: 0.55 },
		{ name: 'ding', at: TYPE + Math.ceil(NEW.length * CHAR) + 1, v: 0.4 },
		{ name: 'whoosh', at: B.result, v: 0.4 },
		{ name: 'riser', at: B.result + 16, v: 0.4 },
		{ name: 'click', at: B.result + Math.round(14 + 46 * CHANGE_AT), v: 0.5 },
		{ name: 'impact', at: B.result + 62, v: 0.6 },
		{ name: 'ding', at: B.result + 64, v: 0.5 },
		{ name: 'whoosh', at: B.map, v: 0.4 },
		{ name: 'riser', at: B.map, v: 0.25 },
		{ name: 'impact', at: B.map + 16, v: 0.65 },
		{ name: 'pop', at: B.map + 42, v: 0.4 },
		{ name: 'swipe', at: PUNCH[0], v: 0.4 },
		{ name: 'notify', at: PUNCH[0] + 6, v: 0.5 },
		{ name: 'swipe', at: PUNCH[1], v: 0.4 },
		{ name: 'ding', at: PUNCH[1] + 8, v: 0.45 },
		{ name: 'swipe', at: PUNCH[2], v: 0.4 },
		{ name: 'click', at: PUNCH[2] + 14, v: 0.7 },
		{ name: 'pop', at: PUNCH[2] + 18, v: 0.45 },
		{ name: 'impact', at: B.cta, v: 0.7 },
		{ name: 'ding', at: B.cta + 18 + Math.ceil(URL.length * 1.6), v: 0.5 },
		{ name: 'whoosh', at: LAUNCH.frames - 14, v: 0.3 }
	];
	for (let k = 0; k < NEW.length; k += 2) s.push({ name: 'tick', at: TYPE + Math.round(k * CHAR), v: 0.4 });
	for (let k = 0; k < URL.length; k += 1) s.push({ name: 'tick', at: B.cta + 18 + Math.round(k * 1.6), v: 0.35 });
	for (let k = 0; k < 6; k++) s.push({ name: 'count', at: B.result + 62 + k * 3, v: 0.35 });
	for (let k = 0; k < 8; k++) s.push({ name: 'tick', at: B.map + 1 + k * 2, v: 0.25 });
	tourFrames.forEach((at, i) => s.push({ name: i === 1 ? 'ding' : 'pop', at, v: i === 1 ? 0.45 : 0.4 }));
	return s;
};

// ── The Short ──────────────────────────────────────────────────────────────

/** Dark, quiet backdrop: the visuals carry the energy. */
const Backdrop: React.FC = () => {
	const frame = useCurrentFrame();
	const glow = 0.12 + 0.05 * Math.sin(frame / 20);
	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse 80% 50% at 50% 40%, rgba(255,137,24,${glow}), transparent 70%), ${color.bg}`
			}}
		/>
	);
};

/** music: play the generated MIDI track (public/generated/launch/music.wav, made by `npm run music -- launch`). */
export const LaunchShort: React.FC<{ music?: boolean; musicVolume?: number }> = ({ music = true, musicVolume = 0.5 }) => (
	<AbsoluteFill style={{ background: color.bg, fontFamily: font.family }}>
		{music && <Audio src={staticFile('generated/launch/music.wav')} volume={musicVolume} />}
		<Backdrop />
		<Wall />
		<Sequence durationInFrames={B.gem} layout="none">
			<Hook />
		</Sequence>
		<Gem />
		<GemText />
		<Slam at={B.title + 2} y={700} size={96} out={B.result - 8}>
			Change the title.
		</Slam>
		<TitleFix />
		<Result />
		<MapBurst />
		<Montage />
		<CTA />
		{sfx().map((s, i) => (
			<Sequence key={i} from={s.at} durationInFrames={60} layout="none">
				<Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.v} />
			</Sequence>
		))}
	</AbsoluteFill>
);
