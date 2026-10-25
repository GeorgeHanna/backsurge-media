import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { clusters, color, type ClusterId } from '../brand';
import { LIBRARY, MapPlot, quadrant } from '../components/MapPlot';
import { Thumb } from '../components/Thumb';
import { cueFrame, sequenceFrames } from '../cues';
import { easeOut, pop, prog } from '../dashboard/anim';
import { clamp, useLayout } from '../layout';
import type { Scene, SceneProps } from '../schema';

// The library map, big: a "map" scene builds it up, then "quadrant" scenes
// zoom into one group each and explain what to do with it. Both share one
// stage layout so consecutive scenes cut together seamlessly.

type Box = { x: number; y: number; w: number; h: number };

function useStage() {
	const { format, content } = useLayout();
	const W = content.width;
	const H = content.height;
	const s =
		format === 'vertical'
			? { map: { x: 0, y: 0, w: W, h: 560 }, panel: { x: 0, y: 592, w: W, h: H - 592 } }
			: format === 'square'
				? { map: { x: 0, y: 40, w: 540, h: 620 }, panel: { x: 572, y: 0, w: W - 572, h: H } }
				: { map: { x: 0, y: 0, w: 900, h: H }, panel: { x: 960, y: 0, w: W - 960, h: H } };
	return { format, content, ...s };
}

const M = { l: 34, r: 26, t: 52, b: 58 };

/** Camera framing inside the map box: whole map, or one group's quarter. */
function framing(box: Box, focus: ClusterId | undefined) {
	const pw = box.w - M.l - M.r;
	const ph = box.h - M.t - M.b;
	if (!focus) return { cx: box.w / 2, cy: box.h / 2, z: 1 };
	const q = quadrant(focus);
	const r = { x: M.l + q.x * pw, y: M.t + q.y * ph, w: q.w * pw, h: q.h * ph };
	const z = Math.min(box.w / r.w, box.h / r.h) * 0.84;
	return { cx: r.x + r.w / 2, cy: r.y + r.h / 2, z };
}

const prevFocus = (prev?: Scene): ClusterId | undefined => (prev?.type === 'quadrant' ? prev.cluster : undefined);

/** Push-in over a quadrant scene: the camera creeps 6% closer, so held shots keep moving. */
const PUSH = 0.06;
const push = (t: number) => 1 + PUSH * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const MapBox: React.FC<{
	box: Box;
	from: ClusterId | undefined;
	to: ClusterId | undefined;
	layers: { axes: number; dots: number; medians: number; tint: number; labels: number };
	highlight?: ClusterId;
	focusP: number;
	/** Hover cards that walk through the focused group's videos: one per start frame. */
	tips?: number[];
	/** Scene length, for the push-in. */
	frames?: number;
}> = ({ box, from, to, layers, highlight, focusP, tips, frames }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const { content } = useLayout();
	const a = framing(box, from);
	const b = framing(box, to);
	// Coming from another quadrant scene, start where its push-in ended.
	if (from && to) a.z *= 1 + PUSH;
	const p = from === to ? 1 : spring({ frame, fps, config: { damping: 200, stiffness: 120, mass: 1 } });
	const pushK = to && frames ? push(Math.min(1, frame / frames)) : 1;
	const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * p) * pushK;
	const cx = a.cx + (b.cx - a.cx) * p;
	const cy = a.cy + (b.cy - a.cy) * p;
	const tx = box.w / 2 - cx * z;
	const ty = box.h / 2 - cy * z;
	const pw = box.w - M.l - M.r;
	const ph = box.h - M.t - M.b;
	const pulse = 1 + Math.sin((frame / fps) * Math.PI * 3) * 0.12 * focusP;

	// Hover cards on the focused group's most typical videos, one after another.
	let tip: React.ReactNode = null;
	if (to && tips && tips.length) {
		const q = quadrant(to);
		const centre = { x: q.x + q.w / 2, y: q.y + q.h / 2 };
		const pts = LIBRARY.points
			.filter((pt) => pt.cluster === to)
			.sort((m, n) => Math.hypot(m.nx - centre.x, m.ny - centre.y) - Math.hypot(n.nx - centre.x, n.ny - centre.y));
		const i = tips.reduce((k, f, j) => (frame >= f ? j : k), -1);
		if (i >= 0 && pts[i]) {
			const target = pts[i];
			const sx = tx + (M.l + target.nx * pw) * z;
			const sy = ty + (M.t + target.ny * ph) * z;
			const tp = pop(prog(frame, tips[i], 10));
			const left = sx > box.w * 0.55;
			tip = (
				<>
					<div
						style={{
							position: 'absolute',
							left: sx - 22,
							top: sy - 22,
							width: 44,
							height: 44,
							borderRadius: 22,
							border: `4px solid ${clusters[to].color}`,
							opacity: Math.min(1, tp),
							transform: `scale(${0.6 + 0.4 * tp})`
						}}
					/>
					<div
						style={{
							position: 'absolute',
							left: left ? undefined : sx + 34,
							right: left ? box.w - sx + 34 : undefined,
							top: Math.min(box.h - 140, Math.max(10, sy - 64)),
							transform: `scale(${tp})`,
							transformOrigin: left ? 'right center' : 'left center',
							opacity: Math.min(1, tp * 2),
							display: 'flex',
							gap: 14,
							alignItems: 'center',
							padding: 14,
							borderRadius: 18,
							background: 'rgba(20,24,31,0.96)',
							border: `2px solid ${clusters[to].color}66`,
							boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
							width: 420
						}}
					>
						<Thumb seed={Math.round(target.v) % 8} width={124} duration="" />
						<div style={{ minWidth: 0 }}>
							<div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{target.title}</div>
							<div style={{ fontSize: 21, color: color.fgMuted, marginTop: 4 }}>
								{Math.round(target.v)} views/day · {(target.e * 100).toFixed(1)}% engagement
							</div>
						</div>
					</div>
				</>
			);
		}
	}

	return (
		<div
			style={{
				position: 'absolute',
				left: content.left + box.x,
				top: content.top + box.y,
				width: box.w,
				height: box.h,
				borderRadius: 32,
				background: 'rgba(12,16,21,0.88)',
				border: `2px solid ${color.border}`,
				overflow: 'hidden',
				boxShadow: '0 30px 80px rgba(0,0,0,0.45)'
			}}
		>
			<div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${z})` }}>
				<div style={{ position: 'absolute', left: M.l, top: M.t }}>
					<MapPlot
						width={pw}
						height={ph}
						{...layers}
						focus={highlight}
						focusP={focusP}
						pulse={pulse}
						dotSize={Math.max(9, Math.min(pw, ph) * 0.022)}
						fontSize={22}
					/>
				</div>
			</div>
			{tip}
		</div>
	);
};

// ── map: build the whole thing ─────────────────────────────────────────────

/** When the four groups light up: a cue, else when the voiceover says "four", else after the dots. */
export function mapGroupsFrame(scene: SceneProps<'map'>['scene'], words: SceneProps<'map'>['words'], fps: number) {
	const f = cueFrame(scene.groupsAt ?? '@four', words, fps, 44);
	return Math.max(44, f);
}

export const MapScene: React.FC<SceneProps<'map'>> = ({ scene, words }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const st = useStage();
	const build = scene.build;
	const groupsAt = mapGroupsFrame(scene, words, fps);
	const layers = build
		? {
				axes: easeOut(prog(frame, 0, 12)),
				dots: prog(frame, 8, 32),
				medians: easeOut(prog(frame, groupsAt - 10, 14)),
				tint: easeOut(prog(frame, groupsAt, 12)),
				labels: easeOut(prog(frame, groupsAt + 4, 12))
			}
		: { axes: 1, dots: 1, medians: 1, tint: 1, labels: 1 };
	const focusAt = cueFrame(scene.focusAt, words, fps, 60);
	const focusP = scene.focus ? easeOut(prog(frame, focusAt, 14)) : 0;
	const order: ClusterId[] = ['star', 'hidden_gem', 'wide_reach', 'underperformer'];
	const titleP = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });

	return (
		<>
			<MapBox box={st.map} from={undefined} to={undefined} layers={layers} highlight={scene.focus} focusP={focusP} />
			<div
				style={{
					position: 'absolute',
					left: st.content.left + st.panel.x,
					top: st.content.top + st.panel.y,
					width: st.panel.w,
					height: st.panel.h,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					gap: st.format === 'vertical' ? 16 : 22
				}}
			>
				{scene.title && (
					<div
						style={{
							fontSize: st.format === 'square' ? 50 : 72,
							fontWeight: 900,
							letterSpacing: '-0.035em',
							lineHeight: 1.05,
							opacity: titleP,
							transform: `translateY(${(1 - titleP) * 30}px)`
						}}
					>
						{scene.title}
					</div>
				)}
				<div style={{ display: 'grid', gridTemplateColumns: st.format === 'vertical' ? '1fr 1fr' : '1fr', gap: st.format === 'vertical' ? '12px 24px' : 14 }}>
					{order.map((id, i) => {
						const p = build ? easeOut(prog(frame, groupsAt + 4 + i * 3, 10)) : 1;
						const dim = scene.focus && scene.focus !== id ? 1 - focusP * 0.65 : 1;
						return (
							<div key={id} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: p * dim, transform: `translateX(${(1 - p) * 30}px)` }}>
								<span style={{ width: 22, height: 22, borderRadius: 11, background: clusters[id].color, flexShrink: 0 }} />
								<span style={{ fontSize: st.format === 'square' ? 32 : 38, fontWeight: 800, color: clusters[id].color }}>{clusters[id].label}</span>
							</div>
						);
					})}
				</div>
				{scene.focus && (
					<div style={{ fontSize: 36, fontWeight: 700, color: clusters[scene.focus].color, opacity: focusP, transform: `translateY(${(1 - focusP) * 20}px)` }}>
						{clusters[scene.focus].hint}
					</div>
				)}
			</div>
		</>
	);
};

// ── quadrant: zoom into one group and explain it ───────────────────────────

const AXES: Record<ClusterId, [string, string]> = {
	star: ['↑ High views', '↑ High engagement'],
	hidden_gem: ['↓ Low views', '↑ High engagement'],
	wide_reach: ['↑ High views', '↓ Low engagement'],
	underperformer: ['↓ Low views', '↓ Low engagement']
};

export function fixFrames(scene: SceneProps<'quadrant'>['scene'], words: SceneProps<'quadrant'>['words'], fps: number) {
	const seq = sequenceFrames(
		scene.fixes.map((f) => f.text),
		words,
		fps,
		Math.round(fps * 1.1),
		Math.round(fps * 0.5)
	);
	return scene.fixes.map((f, i) => (f.at !== undefined ? cueFrame(f.at, words, fps, seq[i]) : seq[i]));
}

export const QuadrantScene: React.FC<SceneProps<'quadrant'>> = ({ scene, words, prev, frames }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const st = useStage();
	const c = clusters[scene.cluster];
	const from = prevFocus(prev);
	// Coming from another group, switch the highlight with the camera move.
	const focusP = from ? 1 : easeOut(prog(frame, 4, 14));
	const fixesAt = fixFrames(scene, words, fps);
	const enter = spring({ frame, fps, config: { damping: 18, stiffness: 150 } });
	const vertical = st.format === 'vertical';
	// Biggest size that keeps the group name on one line in the panel.
	const big = Math.min(st.format === 'square' ? 54 : 80, (st.panel.w - 50) / (c.label.length * 0.58));

	return (
		<>
			<MapBox
				box={st.map}
				from={from}
				to={scene.cluster}
				layers={{ axes: 1, dots: 1, medians: 1, tint: 1, labels: 1 }}
				highlight={scene.cluster}
				focusP={focusP}
				tips={[20, Math.round(20 + (frames - 20) / 3), Math.round(20 + ((frames - 20) * 2) / 3)]}
				frames={frames}
			/>
			<div
				style={{
					position: 'absolute',
					left: st.content.left + st.panel.x,
					top: st.content.top + st.panel.y,
					width: st.panel.w,
					height: st.panel.h,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: vertical ? 'flex-start' : 'center',
					gap: vertical ? 12 : 18,
					opacity: enter,
					transform: vertical ? `translateY(${(1 - enter) * 50}px)` : `translateX(${(1 - enter) * 60}px)`
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
					<span style={{ width: big * 0.42, height: big * 0.42, borderRadius: '50%', background: c.color, boxShadow: `0 0 30px ${c.color}` }} />
					<span style={{ fontSize: big, fontWeight: 900, letterSpacing: '-0.035em', color: c.color }}>{c.label}</span>
				</div>
				<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
					{AXES[scene.cluster].map((t) => (
						<span
							key={t}
							style={{
								fontSize: st.format === 'square' ? 22 : 30,
								fontWeight: 700,
								padding: '6px 14px',
								borderRadius: 999,
								color: t.startsWith('↑') ? color.green : color.red,
								background: t.startsWith('↑') ? 'rgba(67,194,81,0.12)' : 'rgba(244,63,94,0.12)'
							}}
						>
							{t}
						</span>
					))}
				</div>
				<div style={{ fontSize: st.format === 'square' ? 32 : 44, color: color.fg, lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.01em' }}>{scene.meaning}</div>
				<div
					style={{
						fontSize: 22,
						fontWeight: 800,
						letterSpacing: '0.16em',
						color: color.fgMuted,
						marginTop: vertical ? 4 : 10
					}}
				>
					WHAT TO DO
				</div>
				<div style={{ display: 'flex', flexDirection: vertical ? 'row' : 'column', flexWrap: 'wrap', gap: vertical ? 12 : 14 }}>
					{scene.fixes.map((f, i) => {
						const p = pop(prog(frame, fixesAt[i], 10));
						return (
							<div
								key={i}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 12,
									fontSize: st.format === 'square' ? 28 : vertical ? 38 : 40,
									fontWeight: 750,
									padding: vertical ? '12px 20px' : '14px 22px',
									borderRadius: 18,
									background: color.surfaceHi,
									border: `2px solid ${c.color}55`,
									opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
									transform: `scale(${0.7 + 0.3 * p})`,
									transformOrigin: 'left center'
								}}
							>
								<span style={{ color: c.color, fontWeight: 900 }}>✓</span>
								{f.text}
							</div>
						);
					})}
				</div>
			</div>
		</>
	);
};
