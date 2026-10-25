import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { clusters, color, type ClusterId } from '../brand';
import { Thumb } from '../components/Thumb';
import { LogoMark } from '../components/ui';
import { mulberry32 } from '../layout';
import { clamp, easeOut, FlatCard, FLAT_FONT, INK, Pill } from './kit';

// Flat-style props. Timings are frames from when the prop appears.

const GREEN = '#16a34a';
const GREEN_BG = '#3ccf6e';
const RED = '#e11d48';

/** Typed text with a blinking cursor. */
const Typed: React.FC<{ text: string; at: number; dur: number }> = ({ text, at, dur }) => {
	const f = useCurrentFrame();
	const n = Math.floor(interpolate(f, [at, at + dur], [0, text.length], clamp));
	return (
		<>
			{text.slice(0, n)}
			{n < text.length && <span style={{ opacity: Math.floor(f / 4) % 2 ? 1 : 0 }}>|</span>}
		</>
	);
};

export type Edit =
	| { kind: 'title'; at: number; to: string; type?: number }
	| { kind: 'thumb'; at: number; seed: number; label?: string }
	| { kind: 'save'; at: number; text?: string };

/**
 * A video's details, big: thumbnail on top, title below. Edits play in order: the
 * title is struck out and retyped, the thumbnail wipes to a new one, "Save" pops.
 */
export const VideoEdit: React.FC<{ w: number; seed: number; label?: string; title: string; edits: Edit[]; header?: string; meta?: string }> = ({ w, seed, label, title, edits, header = 'Video details', meta }) => {
	const f = useCurrentFrame();
	const inner = w - 52;
	// Current state at this frame.
	let curTitle = title;
	let typing: { from: string; to: string; at: number; dur: number } | null = null;
	let thumb = { seed, label };
	let prevThumb: { seed: number; label?: string; at: number } | null = null;
	let saved: { at: number; text: string } | null = null;
	for (const e of edits) {
		if (f < e.at) break;
		if (e.kind === 'title') {
			typing = { from: curTitle, to: e.to, at: e.at, dur: e.type ?? 34 };
			curTitle = e.to;
		}
		if (e.kind === 'thumb') {
			prevThumb = { ...thumb, at: e.at };
			thumb = { seed: e.seed, label: e.label };
		}
		if (e.kind === 'save') saved = { at: e.at, text: e.text ?? 'Saved ✓' };
	}
	if (saved && edits.some((e) => e.kind !== 'save' && e.at > saved!.at && f >= e.at)) saved = null;
	const th = (inner * 9) / 16;
	const wipe = prevThumb ? interpolate(f, [prevThumb.at, prevThumb.at + 12], [0, 1], { ...clamp, easing: easeOut }) : 1;
	let titleNode: React.ReactNode = curTitle;
	if (typing) {
		const strike = interpolate(f, [typing.at, typing.at + 8], [0, 1], clamp);
		titleNode =
			f < typing.at + 12 ? (
				<span style={{ position: 'relative' }}>
					{typing.from}
					<span style={{ position: 'absolute', left: 0, top: '52%', height: 8, width: `${strike * 100}%`, background: RED, borderRadius: 4 }} />
				</span>
			) : (
				<Typed text={typing.to} at={typing.at + 12} dur={typing.dur} />
			);
	}
	const sp = saved ? 1 + 0.15 * Math.max(0, 1 - (f - saved.at) / 6) : 1;
	return (
		<FlatCard w={w}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
				<span style={{ fontSize: 30, fontWeight: 800, opacity: 0.55 }}>{header}</span>
				<Pill bg={saved ? GREEN_BG : '#fff'} size={30} style={{ transform: `scale(${sp})` }}>
					{saved ? saved.text : 'Save'}
				</Pill>
			</div>
			<div style={{ position: 'relative', width: inner, height: th, borderRadius: 18, overflow: 'hidden', border: `5px solid ${INK}`, boxSizing: 'border-box' }}>
				{prevThumb && (
					<div style={{ position: 'absolute', inset: 0 }}>
						<Thumb seed={prevThumb.seed} label={prevThumb.label} width={inner - 10} radius={0} />
					</div>
				)}
				<div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
					<Thumb seed={thumb.seed} label={thumb.label} width={inner - 10} radius={0} />
				</div>
				{prevThumb && wipe < 1 && <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${wipe * 100}%`, width: 12, marginLeft: -6, background: '#fff', boxShadow: '0 0 30px #fff' }} />}
			</div>
			<div style={{ fontSize: w > 700 ? 50 : 40, fontWeight: 800, lineHeight: 1.1, marginTop: 18, minHeight: w > 700 ? 110 : 88, letterSpacing: '-0.025em' }}>{titleNode}</div>
			{meta && <div style={{ fontSize: 30, fontWeight: 700, opacity: 0.55, marginTop: 4 }}>{meta}</div>}
		</FlatCard>
	);
};

/** A plain video tile with an optional stat badge. */
export const VideoTile: React.FC<{ w: number; seed: number; label?: string; title: string; meta: string; badge?: { text: string; bg: string; at?: number }; grey?: number }> = ({ w, seed, label, title, meta, badge, grey = 0 }) => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const bp = badge ? spring({ frame: f - (badge.at ?? 10), fps, config: { damping: 9, stiffness: 240, mass: 0.5 } }) : 0;
	return (
		<FlatCard w={w} style={{ filter: grey ? `grayscale(${grey})` : undefined, position: 'relative' }}>
			<div style={{ borderRadius: 16, overflow: 'hidden', border: `5px solid ${INK}` }}>
				<Thumb seed={seed} label={label} width={w - 62} radius={0} />
			</div>
			<div style={{ fontSize: w > 700 ? 50 : 38, fontWeight: 800, lineHeight: 1.1, marginTop: 16, letterSpacing: '-0.02em' }}>{title}</div>
			<div style={{ fontSize: w > 700 ? 34 : 28, fontWeight: 700, opacity: 0.55, marginTop: 6 }}>{meta}</div>
			{badge && f >= (badge.at ?? 10) && (
				<div style={{ position: 'absolute', right: -24, top: -34, transform: `scale(${bp}) rotate(6deg)` }}>
					<Pill bg={badge.bg} size={w > 700 ? 52 : 40}>
						{badge.text}
					</Pill>
				</div>
			)}
		</FlatCard>
	);
};

/** Views per day. shape: flat, drop (falls after the marker), up, or recover (drops, then back up). */
export const ViewsChart: React.FC<{ w: number; shape: 'flat' | 'drop' | 'up' | 'recover'; marker?: string; marker2?: string; days?: number[]; daysAt?: number; title?: string; pct?: { text: string; at: number; bg: string } }> = ({
	w,
	shape,
	marker = 'new title',
	marker2,
	days,
	daysAt = 40,
	title = 'Views per day',
	pct
}) => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const cw = w - 52;
	const H = w > 700 ? 380 : 270;
	const n = 48;
	const m1 = 0.32;
	const m2 = 0.68;
	const y = (t: number) => {
		const wob = Math.sin(t * 40) * 0.03 + Math.sin(t * 13) * 0.04;
		let v = 0.55;
		if (shape === 'drop') v = t < m1 ? 0.62 : 0.62 - Math.min(1, (t - m1) / 0.18) * 0.3;
		if (shape === 'up') v = t < m1 ? 0.4 : 0.4 + Math.min(1, (t - m1) / 0.25) * 0.35;
		if (shape === 'recover') v = t < m1 ? 0.62 : t < m2 ? 0.62 - Math.min(1, (t - m1) / 0.15) * 0.3 : 0.32 + Math.min(1, (t - m2) / 0.15) * 0.32;
		return H - 30 - (v + wob) * (H - 80);
	};
	const draw = interpolate(f, [4, 40], [0, 1], clamp);
	const pts = Array.from({ length: n }, (_, i) => `${i ? 'L' : 'M'}${((i / (n - 1)) * cw).toFixed(1)},${y(i / (n - 1)).toFixed(1)}`).join(' ');
	const di = days ? Math.min(days.length - 1, Math.max(0, Math.floor((f - daysAt) / 12))) : 0;
	const dp = days ? spring({ frame: f - daysAt - di * 12, fps, config: { damping: 10, stiffness: 300, mass: 0.4 } }) : 0;
	const lineColor = shape === 'drop' ? RED : shape === 'up' || shape === 'recover' ? GREEN : '#3b82f6';
	const pp = pct ? spring({ frame: f - pct.at, fps, config: { damping: 9, stiffness: 240, mass: 0.5 } }) : 0;
	return (
		<FlatCard w={w} style={{ position: 'relative' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<span style={{ fontSize: w > 700 ? 40 : 32, fontWeight: 800 }}>{title}</span>
				{days && f >= daysAt && (
					<span style={{ fontSize: 36, fontWeight: 800, color: '#fff', background: INK, borderRadius: 14, padding: '4px 18px', transform: `scale(${0.8 + 0.2 * dp})`, display: 'inline-block' }}>Day {days[di]}</span>
				)}
			</div>
			<svg width={cw} height={H} style={{ display: 'block', marginTop: 14, overflow: 'visible' }}>
				{[
					[m1, marker],
					...(marker2 ? [[m2, marker2] as [number, string]] : [])
				].map(([m, label], i) => (
					<g key={i}>
						<line x1={cw * (m as number)} y1="10" x2={cw * (m as number)} y2={H - 10} stroke={INK} strokeWidth="4" strokeDasharray="10 10" opacity="0.5" />
						<text x={cw * (m as number) + 12} y="40" fontSize="28" fontWeight="800" fill={INK} opacity="0.6" fontFamily={FLAT_FONT}>
							{label}
						</text>
					</g>
				))}
				<path d={pts} fill="none" stroke={lineColor} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
				<line x1="0" y1={H - 8} x2={cw} y2={H - 8} stroke={INK} strokeWidth="5" strokeLinecap="round" />
			</svg>
			{pct && f >= pct.at && (
				<div style={{ position: 'absolute', right: -20, top: -40, transform: `scale(${pp}) rotate(5deg)` }}>
					<Pill bg={pct.bg} size={56}>
						{pct.text}
					</Pill>
				</div>
			)}
		</FlatCard>
	);
};

/** The experiment result: big +x% and a verdict pill. */
export const Verdict: React.FC<{ w: number; title: string; pct: number; days?: number }> = ({ w, title, pct, days = 14 }) => {
	const f = useCurrentFrame();
	const n = Math.round(interpolate(f, [8, 32], [0, pct], { ...clamp, easing: easeOut }));
	const pill = spring({ frame: f - 32, fps: 30, config: { damping: 9, stiffness: 260, mass: 0.5 } });
	const big = w > 700;
	return (
		<FlatCard w={w}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: big ? 32 : 26, fontWeight: 800, letterSpacing: '0.06em', opacity: 0.65 }}>
				<LogoMark size={big ? 50 : 40} /> {days}-DAY EXPERIMENT
			</div>
			<div style={{ fontSize: big ? 50 : 36, fontWeight: 800, lineHeight: 1.1, marginTop: 16, letterSpacing: '-0.02em' }}>{title}</div>
			<div style={{ fontSize: big ? 220 : 150, fontWeight: 800, letterSpacing: '-0.05em', color: GREEN, lineHeight: 1, marginTop: 10 }}>+{n}%</div>
			<div style={{ display: 'flex', alignItems: 'center', gap: 20, margin: '10px 0 6px' }}>
				<div style={{ transform: `scale(${pill})`, transformOrigin: '0 50%' }}>
					<Pill bg={GREEN_BG} size={big ? 48 : 34}>
						▲ Winning
					</Pill>
				</div>
			</div>
			<div style={{ fontSize: big ? 30 : 24, fontWeight: 700, opacity: 0.55 }}>views per day vs. before · example</div>
		</FlatCard>
	);
};

// ── Library map ────────────────────────────────────────────────────────────

const QUADS: { id: ClusterId; qx: 0 | 1; qy: 0 | 1 }[] = [
	{ id: 'hidden_gem', qx: 0, qy: 0 },
	{ id: 'star', qx: 1, qy: 0 },
	{ id: 'underperformer', qx: 0, qy: 1 },
	{ id: 'wide_reach', qx: 1, qy: 1 }
];
const DOTS = (() => {
	const r = mulberry32(21);
	return QUADS.flatMap((q) =>
		Array.from({ length: 7 }, () => ({ id: q.id, x: q.qx * 0.5 + 0.07 + r() * 0.36, y: q.qy * 0.5 + 0.07 + r() * 0.36 }))
	);
})();

/** Every video by views per day (→) and engagement (↑), in four groups. */
export const LibraryMap: React.FC<{ w: number; focus?: ClusterId; focusAt?: number; labels?: boolean }> = ({ w, focus, focusAt = 0, labels = true }) => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const S = w - 52;
	const fp = focus ? interpolate(f, [focusAt, focusAt + 8], [0, 1], clamp) : 0;
	return (
		<FlatCard w={w}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 34, fontWeight: 800, marginBottom: 14 }}>
				<LogoMark size={44} /> Your library
			</div>
			<div style={{ position: 'relative', width: S, height: S * 0.7 }}>
				{QUADS.map((q) => {
					const c = clusters[q.id];
					const on = focus === q.id;
					return (
						<div
							key={q.id}
							style={{
								position: 'absolute',
								left: `${q.qx * 50}%`,
								top: `${q.qy * 50}%`,
								width: '50%',
								height: '50%',
								background: c.color,
								opacity: on ? 0.16 + 0.2 * fp : focus ? 0.1 * (1 - fp) + 0.03 : 0.12,
								borderRadius: 12
							}}
						/>
					);
				})}
				<div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, borderLeft: `4px dashed ${INK}`, opacity: 0.3 }} />
				<div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: `4px dashed ${INK}`, opacity: 0.3 }} />
				{DOTS.map((d, i) => {
					const p = spring({ frame: f - 4 - i * 0.8, fps, config: { damping: 9, stiffness: 260, mass: 0.4 } });
					const on = !focus || d.id === focus;
					const size = on && focus ? 30 + 8 * fp : 26;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: `${d.x * 100}%`,
								top: `${d.y * 100}%`,
								width: size,
								height: size,
								marginLeft: -size / 2,
								marginTop: -size / 2,
								borderRadius: '50%',
								background: clusters[d.id].color,
								border: `4px solid ${INK}`,
								transform: `scale(${p})`,
								opacity: on ? 1 : 1 - 0.75 * fp
							}}
						/>
					);
				})}
				{labels &&
					QUADS.map((q, i) => {
						const on = !focus || focus === q.id;
						const lp = spring({ frame: f - 30 - i * 4, fps, config: { damping: 10, stiffness: 220, mass: 0.5 } });
						return (
							<div key={q.id} style={{ position: 'absolute', left: `${q.qx * 50 + 2}%`, top: `${q.qy * 50 + 2}%`, transform: `scale(${lp * (on && focus ? 1 + 0.15 * fp : 1)})`, transformOrigin: '0 0', opacity: on ? 1 : 1 - 0.8 * fp }}>
								<Pill bg={clusters[q.id].color} size={28}>
									{clusters[q.id].label}
								</Pill>
							</div>
						);
					})}
			</div>
			<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 800, opacity: 0.6, marginTop: 12 }}>
				<span>↑ Engagement</span>
				<span>Views per day →</span>
			</div>
		</FlatCard>
	);
};

/** Audience retention: a curve that falls off early, then a fixed one that holds. */
export const Retention: React.FC<{ w: number; fixAt?: number }> = ({ w, fixAt }) => {
	const f = useCurrentFrame();
	const cw = w - 52;
	const H = 330;
	const curve = (hold: number) =>
		Array.from({ length: 40 }, (_, i) => {
			const t = i / 39;
			const v = t < 0.12 ? 1 - (t / 0.12) * (1 - hold) : hold - (t - 0.12) * 0.25;
			return `${i ? 'L' : 'M'}${(t * cw).toFixed(1)},${(20 + (1 - v) * (H - 50)).toFixed(1)}`;
		}).join(' ');
	const d1 = interpolate(f, [4, 30], [0, 1], clamp);
	const d2 = fixAt === undefined ? 0 : interpolate(f, [fixAt, fixAt + 26], [0, 1], clamp);
	return (
		<FlatCard w={w}>
			<div style={{ fontSize: w > 700 ? 40 : 32, fontWeight: 800 }}>Audience retention</div>
			<svg width={cw} height={H} style={{ display: 'block', marginTop: 14, overflow: 'visible' }}>
				<rect x="0" y="10" width={cw * 0.12} height={H - 20} fill={color.red} opacity="0.12" rx="8" />
				<text x="10" y={H - 24} fontSize="26" fontWeight="800" fill={INK} opacity="0.6" fontFamily={FLAT_FONT}>
					first 30 s
				</text>
				<path d={curve(0.35)} fill="none" stroke={RED} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - d1} opacity={fixAt !== undefined && f > fixAt ? 0.35 : 1} />
				{fixAt !== undefined && <path d={curve(0.68)} fill="none" stroke={GREEN} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - d2} />}
				<line x1="0" y1={H - 8} x2={cw} y2={H - 8} stroke={INK} strokeWidth="5" strokeLinecap="round" />
			</svg>
		</FlatCard>
	);
};

/** Stars: the original, and a follow-up sliding in next to it. */
export const FollowUp: React.FC<{ w: number }> = ({ w }) => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const p = spring({ frame: f - 34, fps, config: { damping: 11, stiffness: 180, mass: 0.7 } });
	const tw = w * 0.62;
	return (
		<div style={{ position: 'relative', width: w, height: tw * 0.9 + 260 }}>
			<div style={{ position: 'absolute', left: 0, top: 0, transform: 'rotate(-4deg)' }}>
				<VideoTile w={tw} seed={1} title="Budget camera vs $3,000 camera" meta="131K views" badge={{ text: '★ Star', bg: clusters.star.color, at: 8 }} />
			</div>
			{f >= 34 && (
				<div style={{ position: 'absolute', right: 0, top: 200, transform: `translateX(${(1 - p) * 500}px) rotate(${4 * p}deg)` }}>
					<VideoTile w={tw} seed={1} label="PART 2" title="Budget camera vs $3,000 camera: Part 2" meta="New video" badge={{ text: 'Next!', bg: '#ffd43b', at: 46 }} />
				</div>
			)}
		</div>
	);
};

/** The change log: rows pop in; one opens to show before → after and the result. */
export const ChangeLog: React.FC<{ w: number; openAt?: number; revertAt?: number }> = ({ w, openAt, revertAt }) => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const rows = [
		{ what: 'Title', when: '21 days ago', tag: 'Spotted on YouTube' },
		{ what: 'Thumbnail', when: '14 days ago', tag: 'Spotted on YouTube' },
		{ what: 'Description', when: '9 days ago', tag: 'Spotted on YouTube' }
	];
	const open = openAt !== undefined && f >= openAt;
	const op = openAt === undefined ? 0 : interpolate(f, [openAt, openAt + 10], [0, 1], { ...clamp, easing: easeOut });
	const reverted = revertAt !== undefined && f >= revertAt + 8;
	const press = revertAt === undefined ? 0 : interpolate(f - revertAt, [0, 3, 8], [0, 1, 0], clamp);
	return (
		<FlatCard w={w}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 36, fontWeight: 800, marginBottom: 10 }}>
				<LogoMark size={46} /> Change history
			</div>
			<div style={{ fontSize: 30, fontWeight: 700, opacity: 0.55, marginBottom: 14 }}>My lighting setup</div>
			{rows.map((r, i) => {
				const p = spring({ frame: f - 8 - i * 10, fps, config: { damping: 11, stiffness: 240, mass: 0.5 } });
				if (f < 8 + i * 10 || (open && i === 2)) return null;
				const isOpen = i === 0 && open;
				return (
					<div key={i} style={{ borderTop: `4px solid ${INK}1a`, padding: '14px 0', transform: `scale(${0.9 + 0.1 * p})`, opacity: p, transformOrigin: '0 50%' }}>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
							<span style={{ fontSize: 40, fontWeight: 800 }}>{r.what}</span>
							<span style={{ fontSize: 28, fontWeight: 700, opacity: 0.6 }}>{r.when}</span>
						</div>
						<div style={{ marginTop: 8 }}>
							<Pill bg="#cfe6ff" size={24}>
								{r.tag}
							</Pill>
						</div>
						{isOpen && (
							<div style={{ marginTop: 16, overflow: 'hidden', maxHeight: op * 420 }}>
								<div style={{ fontSize: 26, fontWeight: 800, opacity: 0.5 }}>BEFORE</div>
								<div style={{ fontSize: 40, fontWeight: 800, background: reverted ? '#d9f7e3' : undefined, borderRadius: 10 }}>How I light my videos for $40</div>
								<div style={{ fontSize: 26, fontWeight: 800, opacity: 0.5, marginTop: 10 }}>AFTER</div>
								<div style={{ fontSize: 40, fontWeight: 800, textDecoration: reverted ? 'line-through' : undefined, opacity: reverted ? 0.45 : 1 }}>Lighting tutorial (updated)</div>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
									<span style={{ fontSize: 34, fontWeight: 800, color: RED }}>Views/day −41%</span>
									{revertAt !== undefined && (
										<span style={{ transform: `scale(${1 - press * 0.12})`, display: 'inline-block' }}>
											<Pill bg={reverted ? GREEN_BG : '#fff'} size={36}>
												{reverted ? 'Original restored' : 'Revert'}
											</Pill>
										</span>
									)}
								</div>
							</div>
						)}
					</div>
				);
			})}
		</FlatCard>
	);
};

/** Email-style alert. */
export const Alert: React.FC<{ w: number; title: string; text: string }> = ({ w, title, text }) => (
	<FlatCard w={w} pad={24}>
		<div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
			<LogoMark size={70} />
			<div>
				<div style={{ fontSize: 26, fontWeight: 800, opacity: 0.55, letterSpacing: '0.06em' }}>BACKSURGE · EMAIL · now</div>
				<div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, marginTop: 4 }}>{title}</div>
				<div style={{ fontSize: 28, fontWeight: 600, opacity: 0.7, marginTop: 6 }}>{text}</div>
			</div>
		</div>
	</FlatCard>
);

/** Title chips stacking up (hook). */
export const TitleStack: React.FC<{ w: number; titles: string[]; every?: number }> = ({ w, titles, every = 12 }) => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	return (
		<div style={{ position: 'relative', width: w, height: titles.length * 120 + 40 }}>
			{titles.map((t, i) => {
				if (f < i * every) return null;
				const p = spring({ frame: f - i * every, fps, config: { damping: 9, stiffness: 260, mass: 0.5 } });
				const last = i === titles.length - 1;
				return (
					<div key={i} style={{ position: 'absolute', left: i % 2 ? 60 : 0, top: i * 118, transform: `scale(${p}) rotate(${i % 2 ? 2.5 : -2.5}deg)` }}>
						<div style={{ fontFamily: FLAT_FONT, fontSize: 48, fontWeight: 800, color: INK, background: last ? '#ffd43b' : '#fff', border: `6px solid ${INK}`, borderRadius: 18, padding: '14px 26px', whiteSpace: 'nowrap', textDecoration: last ? undefined : 'line-through', textDecorationThickness: 5 }}>
							{t}
						</div>
					</div>
				);
			})}
		</div>
	);
};

/** End card: logo, URL, line. */
export const UrlCard: React.FC<{ w: number }> = ({ w }) => {
	const f = useCurrentFrame();
	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: w, fontFamily: FLAT_FONT }}>
			<LogoMark size={150} />
			<div style={{ fontSize: 76, fontWeight: 800, letterSpacing: '-0.03em', background: color.surge, color: INK, border: `7px solid ${INK}`, borderRadius: 24, padding: '14px 34px', boxShadow: '10px 12px 0 rgba(29,29,27,0.16)' }}>
				backsurge.com
			</div>
			<div style={{ fontSize: 38, fontWeight: 700, color: INK, opacity: interpolate(f, [14, 24], [0, 0.8], clamp) }}>Free for YouTube creators</div>
		</div>
	);
};
