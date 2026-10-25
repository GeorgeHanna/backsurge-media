import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { mulberry32 } from '../layout';
import { Thumb } from '../components/Thumb';
import { beat, easeOut, NEVER, pop, prog, type Rect } from './anim';
import { videoPage as V } from './data';
import { AppCard, AppFrame, Block, Btn, Chip, Clickable, pad, T, TOP } from './ui';

// One video's page: stats, daily views chart, and "Try something new" to make
// a change from Backsurge. Beats:
//   chart   bars grow in                         (default: already there)
//   type    the new title is typed into the form
//   submit  "Change on YouTube & start tracking" is clicked (default: when typing ends)

const CHAR = 1.15; // frames per typed character

export function videoLayout(W: number) {
	const p = pad(W);
	const x = p;
	const w = W - 2 * p;
	let y = TOP + 22;
	const back: Rect = { x, y, w, h: 24 };
	y += back.h + 14;
	const thumbW = W > 1000 ? 280 : 220;
	const header: Rect = { x, y, w, h: (thumbW * 9) / 16 };
	y += header.h + 22;
	const cols = W > 1100 ? 6 : 3;
	const statsH = cols === 6 ? 60 : 60 * 2 + 14;
	const chartH = 230;
	const section: Rect = { x, y, w, h: 22 + 30 + statsH + 18 + chartH + 22 };
	const chart: Rect = { x: x + 22, y: y + 22 + 30 + statsH + 18, w: w - 44, h: chartH };
	y += section.h + 22;
	const wide = W > 1000;
	const form: Rect = { x, y, w: wide ? w * 0.57 : w, h: 360 };
	const history: Rect = wide ? { x: x + w * 0.57 + 20, y, w: w * 0.43 - 20, h: 210 } : { x, y: y + form.h + 18, w, h: 190 };
	const H = Math.max(form.y + form.h, history.y + history.h) + 40;
	return {
		W,
		H,
		cols,
		thumbW,
		regions: {
			header: { ...header, w: Math.min(w, header.w) },
			stats: { x, y: section.y, w, h: 22 + 30 + statsH + 10 },
			chart: { x, y: chart.y - 20, w, h: chart.h + 50 },
			form,
			'form-input': { x: form.x, y: form.y + 70, w: form.w, h: 170 },
			history,
			'form+history': wide ? { x, y: form.y, w, h: form.h } : { x, y: form.y, w, h: form.h + 18 + history.h }
		} as Record<string, Rect>,
		blocks: { back, header, section, chart, form, history }
	};
}

export type VideoOpts = { mode?: 'title' | 'manual' };
const MANUAL = 'Added chapters';
const typedText = (o?: VideoOpts) => (o?.mode === 'manual' ? MANUAL : V.newTitle);

export function videoToasts(beats: Record<string, number>, opts?: VideoOpts) {
	const submit = submitFrame(beats, opts);
	const text = opts?.mode === 'manual' ? 'Tracking started. Watch time is compared too.' : 'Changed on YouTube. Tracking starts today.';
	return submit < NEVER ? [{ at: submit + 8, text }] : [];
}

export function submitFrame(beats: Record<string, number>, opts?: VideoOpts) {
	const typeAt = beat(beats, 'type');
	return beat(beats, 'submit', typeAt < NEVER ? typeAt + Math.ceil(typedText(opts).length * CHAR) + 14 : NEVER);
}

export const VideoPage: React.FC<{ W: number; beats: Record<string, number>; opts?: VideoOpts }> = ({ W, beats, opts }) => {
	const manual = opts?.mode === 'manual';
	const text = typedText(opts);
	const frame = useCurrentFrame();
	const L = videoLayout(W);
	const b = L.blocks;
	const chartAt = beat(beats, 'chart', -1000);
	const typeAt = beat(beats, 'type');
	const submit = submitFrame(beats, opts);
	const submitted = frame >= submit + 10;

	// Typing: the old title is selected, then replaced letter by letter.
	const selecting = !manual && frame >= typeAt - 8 && frame < typeAt;
	const typed = frame < typeAt ? null : text.slice(0, Math.floor((frame - typeAt) / CHAR));
	const caret = frame >= typeAt && !submitted && Math.floor(frame / 8) % 2 === 0;

	const data = useMemo(() => {
		const rand = mulberry32(42);
		return Array.from({ length: 90 }, (_, i) => ({
			views: 300 + Math.sin(i / 6) * 40 + (rand() - 0.5) * 90 + (i > 60 ? 25 : 0),
			ctr: 3.1 + Math.sin(i / 9) * 0.25 + (rand() - 0.5) * 0.3
		}));
	}, []);
	const max = Math.max(...data.map((d) => d.views)) * 1.15;
	const bw = b.chart.w / data.length;
	const ctrPath = data
		.map((d, i) => `${i ? 'L' : 'M'}${(i + 0.5) * bw},${b.chart.h - ((d.ctr - 2) / 2.2) * b.chart.h}`)
		.join(' ');
	const ctrP = prog(frame, chartAt + 20, 25);
	const markerP = pop(prog(frame, submit + 10, 12));

	return (
		<AppFrame W={W} H={L.H} active="Overview" path="/dashboard/video/looks-cheap">
			<Block r={b.back} style={{ fontSize: T.text - 2, color: T.mutedFg }}>
				← Overview
			</Block>
			<Block r={b.header} style={{ display: 'flex', gap: 22 }}>
				<Thumb seed={V.seed} width={L.thumbW} duration={V.length} />
				<div style={{ minWidth: 0 }}>
					<div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{submitted && !manual ? V.newTitle : V.title}</div>
					<div style={{ fontSize: T.text - 2, color: T.mutedFg, marginTop: 8 }}>
						Published {V.published} · {V.length} long
					</div>
					<div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: T.text - 2 }}>
						<span style={{ color: T.primary }}>Watch on YouTube ↗</span>
						<span style={{ color: T.mutedFg }}>YouTube Studio ↗</span>
					</div>
				</div>
			</Block>

			<Block r={b.section}>
				<AppCard style={{ position: 'absolute', inset: 0 }} />
				<div style={{ position: 'absolute', left: 22, top: 20, fontSize: T.text - 1, fontWeight: 650 }}>Last 90 days</div>
				<div
					style={{
						position: 'absolute',
						left: 22,
						right: 22,
						top: 52,
						display: 'grid',
						gridTemplateColumns: `repeat(${L.cols}, 1fr)`,
						rowGap: 14,
						columnGap: 12
					}}
				>
					{V.stats.map(([label, value], i) => (
						<div key={label} style={{ opacity: easeOut(prog(frame, chartAt + i * 2, 10)) }}>
							<div style={{ fontSize: T.small - 1, color: T.mutedFg }}>{label}</div>
							<div style={{ fontSize: 22, fontWeight: 700, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
						</div>
					))}
				</div>
			</Block>
			<Block r={b.chart}>
				<svg width={b.chart.w} height={b.chart.h} style={{ overflow: 'visible' }}>
					{data.map((d, i) => {
						const h = (d.views / max) * b.chart.h * easeOut(prog(frame, chartAt + i * 0.22, 12));
						return <rect key={i} x={i * bw + 1} y={b.chart.h - h} width={bw - 2} height={h} rx={1.5} fill="rgba(245,158,11,0.45)" />;
					})}
					<path d={ctrPath} fill="none" stroke="#38bdf8" strokeWidth={2.5} strokeDasharray={4000} strokeDashoffset={4000 * (1 - ctrP)} />
					{markerP > 0 && (
						<g opacity={Math.min(1, markerP)}>
							<line x1={b.chart.w - bw / 2} x2={b.chart.w - bw / 2} y1={0} y2={b.chart.h} stroke="rgba(245,158,11,0.95)" strokeWidth={2.5} strokeDasharray="6 6" />
							<circle cx={b.chart.w - bw / 2} cy={6} r={7 * markerP} fill="#f59e0b" />
							<text x={b.chart.w - bw / 2 - 14} y={30} textAnchor="end" fill="#f59e0b" fontSize={16} fontWeight={700}>
								{manual ? 'Chapters added' : 'Title changed'}
							</text>
						</g>
					)}
				</svg>
			</Block>

			<Block r={b.form}>
				<AppCard style={{ position: 'absolute', inset: 0, padding: 22 }}>
					<div style={{ fontSize: T.text - 1, fontWeight: 650 }}>Try something new</div>
					<div style={{ fontSize: T.small - 0.5, color: T.mutedFg, marginTop: 4 }}>Change one thing and we'll compare the days after with the 28 days before.</div>
					<div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
						{['Title', 'Thumbnail', 'Description', 'Log another change'].map((m, i) => (
							<span
								key={m}
								style={{
									padding: '6px 12px',
									borderRadius: 8,
									fontSize: T.small - 0.5,
									fontWeight: 600,
									background: i === (manual ? 3 : 0) ? T.primary : T.secondary,
									color: i === (manual ? 3 : 0) ? '#111' : T.fg,
									whiteSpace: 'nowrap'
								}}
							>
								{m}
							</span>
						))}
					</div>
					<div style={{ fontSize: T.small - 0.5, color: T.mutedFg, marginTop: 16 }}>{manual ? 'What did you change? (e.g. new end screens, chapters)' : 'New title'}</div>
					<div
						style={{
							marginTop: 6,
							padding: '10px 12px',
							borderRadius: 9,
							border: `1.5px solid ${frame >= typeAt - 8 && !submitted ? T.primary : T.border}`,
							background: T.bg,
							fontSize: T.text - 0.5,
							minHeight: 22,
							whiteSpace: 'nowrap',
							overflow: 'hidden'
						}}
					>
						{typed === null ? (
							<span style={{ background: selecting ? 'rgba(56,130,246,0.45)' : 'transparent' }}>{manual ? '' : V.title}</span>
						) : (
							typed
						)}
						{caret && <span style={{ color: T.primary }}>|</span>}
					</div>
					<div style={{ textAlign: 'right', fontSize: T.small - 2, color: T.mutedFg, marginTop: 4 }}>{(typed ?? (manual ? '' : V.title)).length}/{manual ? 200 : 100}</div>
					<div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
						<div style={{ flex: 1 }}>
							<div style={{ fontSize: T.small - 1, color: T.mutedFg }}>Notes (optional)</div>
							<div style={{ marginTop: 5, padding: '8px 12px', borderRadius: 9, border: `1.5px solid ${T.border}`, fontSize: T.small, color: T.mutedFg }}>
								Why you're trying this
							</div>
						</div>
						<div style={{ flex: 1 }}>
							<div style={{ fontSize: T.small - 1, color: T.mutedFg }}>Remind me to decide after</div>
							<div style={{ marginTop: 5, padding: '8px 12px', borderRadius: 9, border: `1.5px solid ${T.border}`, fontSize: T.small }}>14 days ▾</div>
						</div>
					</div>
					<div style={{ marginTop: 18 }}>
						<Clickable at={submit} from={{ x: 160, y: 120 }}>
							<Btn kind="primary" style={{ padding: '10px 18px' }} pressed={prog(frame, submit, 3) * (1 - prog(frame, submit + 3, 4))}>
								{submitted ? (manual ? '✓ Tracking' : '✓ Changed on YouTube') : manual ? 'Start tracking' : 'Change on YouTube & start tracking'}
							</Btn>
						</Clickable>
					</div>
				</AppCard>
			</Block>

			<Block r={b.history}>
				<div style={{ fontSize: T.h2 - 2, fontWeight: 700, height: 34 }}>Change history</div>
				{submitted ? (
					<AppCard
						style={{ position: 'absolute', left: 0, right: 0, top: 40, padding: 18, transform: `scale(${pop(prog(frame, submit + 10, 12))})`, transformOrigin: 'top center' }}
						glow={Math.max(0, 1 - (frame - submit - 10) / 40)}
					>
						<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
							<Chip>{manual ? 'Manual change' : 'Title'}</Chip>
							<span style={{ fontSize: T.small, color: T.mutedFg }}>Experiment · day 0 of 14</span>
						</div>
						{!manual && <div style={{ fontSize: T.text - 2, color: T.mutedFg, textDecoration: 'line-through', marginTop: 10 }}>{V.title}</div>}
						<div style={{ fontSize: T.text - 1, fontWeight: 650, marginTop: manual ? 10 : 3 }}>{text}</div>
					</AppCard>
				) : (
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 40,
							padding: 22,
							borderRadius: 14,
							border: `1.5px dashed ${T.border}`,
							fontSize: T.small,
							color: T.mutedFg,
							textAlign: 'center',
							lineHeight: 1.5
						}}
					>
						No changes yet. If you change this video on YouTube, it shows up here within a few hours.
					</div>
				)}
			</Block>
		</AppFrame>
	);
};
