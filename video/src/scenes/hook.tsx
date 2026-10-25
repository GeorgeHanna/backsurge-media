import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { clusters, color, type ClusterId } from '../brand';
import { MapPlot } from '../components/MapPlot';
import { Thumb } from '../components/Thumb';
import { sequenceFrames } from '../cues';
import { pop, prog } from '../dashboard/anim';
import { clamp, useLayout } from '../layout';
import type { SceneProps } from '../schema';

/** When each hook line lands: with its first word in the voiceover, else every 9 frames. */
export function hookLineFrames(lines: string[], words: SceneProps<'hook'>['words'], fps: number) {
	return sequenceFrames(lines, words, fps, 1, 9);
}

/**
 * The opener. Lines slam in with the voiceover, the orange line shakes the
 * frame a little, and an optional visual sits next to (or under) the text.
 */
export const Hook: React.FC<SceneProps<'hook'>> = ({ scene, words }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const { format, content, zoom, inner } = useLayout();
	const at = hookLineFrames(scene.lines, words, fps);
	const hasVisual = !!scene.visual;
	const base = hasVisual ? { vertical: 84, square: 64, wide: 88 }[format] : { vertical: 112, square: 100, wide: 124 }[format];
	// Shrink to fit so every line stays on one line (Inter Black is ~0.56em per character here).
	const textWidth = format === 'wide' && hasVisual ? inner.width * 0.52 : inner.width * 0.96;
	const longest = Math.max(...scene.lines.map((l) => l.length));
	// …but never below ~80% of the base size: past that, wrapping reads better than tiny type.
	const size = Math.max(base * 0.8, Math.min(base, textWidth / (longest * 0.56)));

	// A short shake when an accent line lands.
	const accentAt = (scene.accent ?? []).map((i) => at[i]).filter((f) => f !== undefined);
	const shake = accentAt.reduce((s, f) => {
		const t = frame - f;
		return t >= 0 && t < 10 ? s + Math.sin(t * 2.6) * (10 - t) * 1.1 : s;
	}, 0);

	const kickerP = spring({ frame, fps, config: { damping: 14, stiffness: 200 } });

	const text = (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: format === 'wide' && hasVisual ? 'flex-start' : 'center' }}>
			{scene.kicker && (
				<div
					style={{
						fontSize: 30,
						fontWeight: 800,
						letterSpacing: '0.14em',
						textTransform: 'uppercase',
						color: color.surge,
						padding: '8px 18px',
						borderRadius: 999,
						background: color.surgeSoft,
						border: `2px solid ${color.surge}44`,
						marginBottom: 18,
						transform: `scale(${kickerP})`
					}}
				>
					{scene.kicker}
				</div>
			)}
			{scene.lines.map((line, li) => {
				const accent = scene.accent?.includes(li);
				const lineAt = at[li];
				return (
					<div
						key={li}
						style={{
							fontSize: size,
							fontWeight: 900,
							letterSpacing: '-0.045em',
							lineHeight: 1.0,
							textAlign: format === 'wide' && hasVisual ? 'left' : 'center'
						}}
					>
						{line.split(' ').map((w, wi) => {
							const t = frame - (lineAt + wi * 2);
							const p = spring({ frame: t, fps, config: { damping: 12, stiffness: 260, mass: 0.6 } });
							return (
								<span
									key={wi}
									style={{
										display: 'inline-block',
										marginRight: '0.22em',
										color: accent ? color.surge : color.fg,
										opacity: interpolate(t, [0, 3], [0, 1], clamp),
										transform: `scale(${1.5 - 0.5 * p}) translateY(${(1 - p) * 10}px)`,
										textShadow: accent ? `0 0 60px ${color.surgeGlow}` : '0 6px 30px rgba(0,0,0,0.5)'
									}}
								>
									{w}
								</span>
							);
						})}
					</div>
				);
			})}
		</div>
	);

	const visualAt = at[at.length - 1] ?? 0;
	const visual =
		scene.visual === 'title-swap' ? (
			<TitleSwap firstAt={at[0] ?? 0} questionAt={visualAt} />
		) : scene.visual === 'quadrants' ? (
			<Quadrants at={at[0] ?? 0} />
		) : scene.visual === 'views-drop' ? (
			<ViewsDrop at={at[0] ?? 0} />
		) : scene.visual === 'map' ? (
			<MiniMap at={at[0] ?? 0} focus={scene.focus ?? 'hidden_gem'} />
		) : scene.visual === 'retention' ? (
			<Retention at={at[0] ?? 0} />
		) : null;

	return (
		<AbsoluteFill
			style={{
				zoom,
				top: content.top / zoom,
				left: content.left / zoom,
				width: content.width / zoom,
				height: content.height / zoom,
				display: 'flex',
				flexDirection: format === 'wide' && hasVisual ? 'row' : 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: format === 'wide' ? 60 : format === 'square' ? 30 : 56,
				transform: `translate(${shake}px, ${shake * 0.4}px)`
			}}
		>
			<div style={{ flex: format === 'wide' && hasVisual ? '1 1 55%' : undefined }}>{text}</div>
			{visual && <div style={{ flex: format === 'wide' ? '0 0 auto' : undefined }}>{visual}</div>}
		</AbsoluteFill>
	);
};

/** A YouTube-style video card whose title gets rewritten, then a big question mark. */
const TitleSwap: React.FC<{ firstAt: number; questionAt: number }> = ({ firstAt, questionAt }) => {
	const frame = useCurrentFrame();
	const { format } = useLayout();
	const W = { vertical: 640, square: 430, wide: 680 }[format];
	const oldT = 'My lighting setup';
	const newT = 'How I light my videos for $40';
	const delStart = firstAt + 4;
	const typeStart = delStart + 10;
	const deleted = Math.min(oldT.length, Math.floor(Math.max(0, frame - delStart) * 4));
	const typed = Math.floor(Math.max(0, frame - typeStart) * 1.6);
	const title = frame < typeStart ? oldT.slice(0, oldT.length - deleted) : newT.slice(0, typed);
	const caret = Math.floor(frame / 6) % 2 === 0;
	const enter = spring({ frame: frame - firstAt, fps: 30, config: { damping: 15, stiffness: 160 } });
	const q = pop(prog(frame, Math.max(questionAt, typeStart + 12), 10));
	return (
		<div style={{ width: W, position: 'relative', transform: `translateY(${(1 - enter) * 120}px) rotate(${(1 - enter) * -4}deg)`, opacity: enter }}>
			<Thumb seed={0} width={W} radius={22} />
			<div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
				<div style={{ width: 54, height: 54, borderRadius: 27, background: 'linear-gradient(135deg,#ffb347,#b4410c)', flexShrink: 0 }} />
				<div style={{ minWidth: 0 }}>
					<div style={{ fontSize: W * 0.058, fontWeight: 700, lineHeight: 1.25, minHeight: W * 0.058 * 1.25 * 2, color: color.fg }}>
						{title}
						<span style={{ color: color.surge, opacity: caret ? 1 : 0 }}>|</span>
					</div>
					<div style={{ fontSize: W * 0.042, color: color.fgMuted, marginTop: 6 }}>Frame Rate · 48K views · 2 years ago</div>
				</div>
			</div>
			{q > 0 && (
				<div
					style={{
						position: 'absolute',
						right: -W * 0.05,
						top: W * 0.03,
						width: W * 0.26,
						height: W * 0.26,
						borderRadius: '50%',
						background: color.surge,
						color: '#111',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: W * 0.19,
						fontWeight: 900,
						transform: `scale(${q}) rotate(${(1 - Math.min(q, 1)) * 40}deg)`,
						boxShadow: `0 0 80px ${color.surgeGlow}`
					}}
				>
					?
				</div>
			)}
		</div>
	);
};

/** Four coloured tiles, one per video type, slamming in. */
const Quadrants: React.FC<{ at: number }> = ({ at }) => {
	const frame = useCurrentFrame();
	const { format } = useLayout();
	const S = { vertical: 350, square: 230, wide: 300 }[format];
	const order: ClusterId[] = ['hidden_gem', 'star', 'underperformer', 'wide_reach'];
	return (
		<div style={{ display: 'grid', gridTemplateColumns: `${S}px ${S}px`, gap: 18 }}>
			{order.map((id, i) => {
				const p = pop(prog(frame, at + 3 + i * 4, 9));
				const c = clusters[id].color;
				return (
					<div
						key={id}
						style={{
							height: S * 0.66,
							borderRadius: 24,
							background: `${c}1f`,
							border: `3px solid ${c}`,
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'flex-end',
							padding: S * 0.08,
							transform: `scale(${p})`,
							opacity: Math.min(1, p * 2),
							boxShadow: `0 0 50px ${c}33`
						}}
					>
						<div style={{ width: S * 0.1, height: S * 0.1, borderRadius: '50%', background: c, marginBottom: 'auto' }} />
						<div style={{ fontSize: S * 0.1, fontWeight: 850, color: c, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{clusters[id].label}</div>
					</div>
				);
			})}
		</div>
	);
};

/** A views line sliding down, with a red arrow. */
const ViewsDrop: React.FC<{ at: number }> = ({ at }) => {
	const frame = useCurrentFrame();
	const { format } = useLayout();
	const W = { vertical: 640, square: 460, wide: 600 }[format];
	const H = W * 0.55;
	const p = interpolate(frame - at, [0, 30], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2) });
	const n = 40;
	const pts = Array.from({ length: n }, (_, i) => {
		const x = (i / (n - 1)) * W;
		const y = H * (0.15 + 0.7 * Math.pow(i / (n - 1), 1.4)) + Math.sin(i * 1.7) * 8;
		return [x, y] as const;
	});
	const shown = Math.max(2, Math.round(p * n));
	const d = pts.slice(0, shown).map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
	return (
		<svg width={W} height={H + 20} style={{ overflow: 'visible' }}>
			<path d={d} fill="none" stroke={color.red} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
			<circle cx={pts[shown - 1][0]} cy={pts[shown - 1][1]} r={14} fill={color.red} />
			<text x={W} y={30} textAnchor="end" fontSize={W * 0.075} fontWeight={850} fill={color.red} opacity={p}>
				−{Math.round(64 * p)}% views
			</text>
		</svg>
	);
};

/** The library map on a card: dots sweep in, then one group lights up and pulses. */
const MiniMap: React.FC<{ at: number; focus: ClusterId }> = ({ at, focus }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const { format } = useLayout();
	const W = { vertical: 700, square: 470, wide: 640 }[format];
	const H = W * 0.62;
	const dots = interpolate(frame - at, [0, 18], [0, 1], clamp);
	const focusP = interpolate(frame - at - 14, [0, 10], [0, 1], clamp);
	const pulse = 1 + Math.sin((frame / fps) * Math.PI * 3) * 0.18 * focusP;
	const enter = spring({ frame: frame - at, fps, config: { damping: 16, stiffness: 150 } });
	return (
		<div
			style={{
				padding: 30,
				borderRadius: 30,
				background: 'rgba(12,16,21,0.9)',
				border: `3px solid ${clusters[focus].color}66`,
				boxShadow: `0 0 80px ${clusters[focus].color}22`,
				transform: `scale(${0.85 + 0.15 * enter})`,
				opacity: enter
			}}
		>
			<MapPlot width={W} height={H} dots={dots} tint={1} labels={focusP} focus={focus} focusP={focusP} pulse={pulse} dotSize={W * 0.018} fontSize={W * 0.04} axisLabels={false} />
		</div>
	);
};

/** An audience-retention curve that falls off a cliff early. */
const Retention: React.FC<{ at: number }> = ({ at }) => {
	const frame = useCurrentFrame();
	const { format } = useLayout();
	const W = { vertical: 660, square: 460, wide: 620 }[format];
	const H = W * 0.56;
	const p = interpolate(frame - at, [0, 26], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2) });
	const n = 60;
	const y = (i: number) => {
		const t = i / (n - 1);
		const v = t < 0.12 ? 1 - 2.6 * t : 0.69 - 0.32 * (t - 0.12) + Math.sin(i * 1.3) * 0.006;
		return H * (1 - v * 0.92);
	};
	const shown = Math.max(2, Math.round(p * n));
	const d = Array.from({ length: shown }, (_, i) => `${i ? 'L' : 'M'}${(i / (n - 1)) * W},${y(i)}`).join(' ');
	const cliff = (0.12 * W);
	const label = interpolate(frame - at - 14, [0, 8], [0, 1], clamp);
	return (
		<svg width={W} height={H + 60} style={{ overflow: 'visible' }}>
			<line x1={0} y1={H} x2={W} y2={H} stroke={color.fgMuted} strokeWidth={3} />
			<path d={d} fill="none" stroke={color.chartLine} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
			<g opacity={label}>
				<line x1={cliff} x2={cliff} y1={0} y2={H} stroke={color.red} strokeWidth={4} strokeDasharray="12 10" />
				<text x={cliff + 18} y={H * 0.2} fontSize={W * 0.065} fontWeight={850} fill={color.red}>
					0:30
				</text>
				<text x={cliff + 18} y={H * 0.2 + W * 0.06} fontSize={W * 0.045} fontWeight={700} fill={color.fgSoft}>
					a third of viewers gone
				</text>
			</g>
			<text x={0} y={H + 44} fontSize={W * 0.04} fill={color.fgMuted}>
				Audience retention
			</text>
		</svg>
	);
};
