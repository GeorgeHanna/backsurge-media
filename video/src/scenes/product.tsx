import React, { useMemo } from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { color, verdicts } from '../brand';
import { Thumb } from '../components/Thumb';
import { Card, CountUp, Cursor, LogoMark, Pill } from '../components/ui';
import { clamp, mulberry32, useEnter, useLayout, useRise } from '../layout';
import type { Scene, Word } from '../schema';
import { Center } from './text';

type P<T extends Scene['type']> = { scene: Extract<Scene, { type: T }>; frames: number; words?: Word[] };

// Shared timing, also used by Video.tsx to place sound effects.
export const TIMING = {
	change: { strike: 20, type: 34, charFrames: 1.4 },
	alert: { in: 4, click: 50 },
	chart: { drawStart: 6, drawEnd: 75 },
	verdict: { badge: 48, undo: 70 }
};

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div style={{ fontSize: 28, fontWeight: 700, color: color.fgMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{children}</div>
);

/** "Change spotted": before → after, as in the app's change log. */
export const Change: React.FC<P<'change'>> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { wide } = useLayout();
	const T = TIMING.change;
	const card = useRise(0, 80);
	const strike = interpolate(frame - T.strike, [0, 10], [0, 1], clamp);
	const typed = Math.floor(Math.max(0, frame - T.type) / T.charFrames);
	const after = scene.after.slice(0, typed);
	const caret = frame >= T.type && typed < scene.after.length + 8 && Math.floor(frame / 8) % 2 === 0;
	const afterIn = useEnter(T.type - 4);
	const isThumb = scene.field === 'thumbnail';
	const thumbW = wide ? 420 : 380;

	return (
		<Center>
			<Card glow style={{ ...card, width: wide ? 1300 : '100%', maxWidth: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 30 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, fontWeight: 800 }}>
						<span style={{ width: 18, height: 18, borderRadius: 9, background: color.surge, boxShadow: `0 0 24px ${color.surge}` }} />
						Change spotted
					</div>
					<Pill tone={color.fgSoft} size={26}>
						{scene.source}
					</Pill>
				</div>
				<div style={{ fontSize: 30, color: color.fgMuted }}>“{scene.videoTitle}”</div>
				<FieldLabel>{scene.field}</FieldLabel>
				{isThumb ? (
					<div style={{ display: 'flex', alignItems: 'center', gap: 28, justifyContent: 'center' }}>
						<div style={{ opacity: 1 - strike * 0.55, filter: `grayscale(${strike})` }}>
							<Thumb seed={0} label={scene.before} width={thumbW} />
						</div>
						<div style={{ fontSize: 60, color: color.surge, fontWeight: 900 }}>→</div>
						<div style={{ opacity: afterIn, transform: `scale(${0.8 + 0.2 * afterIn})` }}>
							<Thumb seed={0} label={scene.after} width={thumbW} />
						</div>
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
						<div style={{ position: 'relative', fontSize: 46, fontWeight: 600, color: color.fgMuted, alignSelf: 'flex-start' }}>
							{scene.before}
							<div
								style={{
									position: 'absolute',
									left: 0,
									top: '52%',
									height: 5,
									width: `${strike * 100}%`,
									background: color.red,
									borderRadius: 3
								}}
							/>
						</div>
						<div style={{ fontSize: 52, fontWeight: 800, color: color.fg, minHeight: 64, opacity: afterIn }}>
							{after}
							{caret && <span style={{ color: color.surge }}>|</span>}
						</div>
					</div>
				)}
			</Card>
		</Center>
	);
};

/** Email notification sliding in, with a click on its action button. */
export const Alert: React.FC<P<'alert'>> = ({ scene }) => {
	const { wide } = useLayout();
	const T = TIMING.alert;
	const p = useEnter(T.in, 'springPop');
	const frame = useCurrentFrame();
	const pressed = interpolate(frame - T.click, [0, 4, 10], [0, 1, 0], clamp);
	const done = frame > T.click + 6;
	return (
		<Center>
			<div style={{ width: wide ? 1100 : '100%', maxWidth: '100%', transform: `translateY(${(1 - p) * -500}px)`, opacity: Math.min(1, p * 2) }}>
				<Card glow style={{ display: 'flex', gap: 30, alignItems: 'flex-start', padding: 44, textAlign: 'left' }}>
					<LogoMark size={96} />
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: color.fgMuted }}>
							<span style={{ fontWeight: 700, color: color.fgSoft }}>Backsurge</span>
							<span>now</span>
						</div>
						<div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15 }}>{scene.subject}</div>
						<div style={{ fontSize: 32, color: color.fgSoft, lineHeight: 1.35 }}>{scene.preview}</div>
						{scene.action && (
							<ClickTarget clickAt={T.click}>
								<div
									style={{
										marginTop: 16,
										fontSize: 32,
										fontWeight: 750,
										padding: '18px 30px',
										borderRadius: 16,
										background: done ? color.green : color.surge,
										color: '#111',
										transform: `scale(${1 - pressed * 0.06})`
									}}
								>
									{done ? '✓ Experiment started' : scene.action}
								</div>
							</ClickTarget>
						)}
					</div>
				</Card>
			</div>
		</Center>
	);
};

/** Wraps a button so the animated cursor glides in and clicks its centre. */
export const ClickTarget: React.FC<{ clickAt: number; children: React.ReactNode }> = ({ clickAt, children }) => (
	<div style={{ position: 'relative', alignSelf: 'flex-start', display: 'inline-block' }}>
		{children}
		<div style={{ position: 'absolute', left: '50%', top: '55%' }}>
			<Cursor
				path={[
					{ x: 260, y: 300, at: clickAt - 26 },
					{ x: 0, y: 0, at: clickAt - 4 }
				]}
				clickAt={clickAt}
			/>
		</div>
	</div>
);

/** Views per day for one video, with each change marked. Same data idea as the landing page chart. */
export const Chart: React.FC<P<'chart'>> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { inner, wide } = useLayout();
	const T = TIMING.chart;
	const days = 180;
	const data = useMemo(() => {
		const rand = mulberry32(20260222);
		const raw: number[] = [];
		for (let i = 0; i < days; i++) {
			let base = 420;
			for (const c of scene.changes) if (i >= c.day) base *= 1 + c.lift / 100;
			raw.push(Math.max(180, base + Math.sin((2 * Math.PI * i) / 7) * 20 + (rand() + rand() - 1) * 28));
		}
		return raw.map((_, i) => {
			const win = raw.slice(Math.max(0, i - 3), Math.min(days, i + 4));
			return win.reduce((s, v) => s + v, 0) / win.length;
		});
	}, [scene.changes]);

	const card = useRise(0, 60);
	const W = inner.width;
	const H = Math.min(wide ? 470 : 600, inner.height - 260);
	const pad = { l: 80, r: 30, t: 40, b: 50 };
	const max = Math.max(...data) * 1.12;
	const min = 200;
	const x = (i: number) => pad.l + (i / (days - 1)) * (W - 80 - pad.l - pad.r);
	const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
	const progress = interpolate(frame, [T.drawStart, T.drawEnd], [0, 1], { ...clamp, easing: (t) => t * (2 - t) });
	const shown = Math.max(2, Math.floor(progress * (days - 1)) + 1);
	const pts = data.slice(0, shown).map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
	const line = `M${pts.join(' L')}`;
	const area = `${line} L${x(shown - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;
	const head = { x: x(shown - 1), y: y(data[shown - 1]) };
	const tones = [color.amber, color.emerald, color.surge];

	return (
		<Center gap={0}>
			<Card style={{ ...card, width: '100%', padding: 40, textAlign: 'left' }}>
				<div style={{ fontSize: 34, fontWeight: 750, marginBottom: 20 }}>Views per day · “{scene.videoTitle}”</div>
				<div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', minHeight: 56, marginBottom: 10 }}>
					{scene.changes.map((c, i) => {
						const at = T.drawStart + (c.day / days) * (T.drawEnd - T.drawStart);
						const p = interpolate(frame - at, [0, 8], [0, 1], clamp);
						return (
							<span key={i} style={{ opacity: p, transform: `scale(${0.7 + 0.3 * p})` }}>
								<Pill tone={tones[i % tones.length]} size={28}>
									{c.label} · +{c.lift}%
								</Pill>
							</span>
						);
					})}
				</div>
				<svg width={W - 80} height={H} style={{ overflow: 'visible' }}>
					<defs>
						<linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={color.chartLine} stopOpacity={0.3} />
							<stop offset="100%" stopColor={color.chartLine} stopOpacity={0} />
						</linearGradient>
					</defs>
					{[0.25, 0.5, 0.75].map((g) => (
						<line key={g} x1={pad.l} x2={W - 80 - pad.r} y1={pad.t + g * (H - pad.t - pad.b)} y2={pad.t + g * (H - pad.t - pad.b)} stroke={color.border} strokeWidth={2} />
					))}
					{[min, (min + max) / 2, max].map((v) => (
						<text key={v} x={pad.l - 16} y={y(v) + 10} fill={color.fgMuted} fontSize={26} textAnchor="end">
							{v >= 1000 ? `${(v / 1000).toFixed(1)}K` : Math.round(v)}
						</text>
					))}
					<path d={area} fill="url(#fill)" />
					<path d={line} fill="none" stroke={color.chartLine} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
					{scene.changes.map((c, i) => {
						const visible = shown > c.day;
						const p = interpolate(frame - (T.drawStart + (c.day / days) * (T.drawEnd - T.drawStart)), [0, 10], [0, 1], clamp);
						return visible ? (
							<g key={i} opacity={p}>
								<line x1={x(c.day)} x2={x(c.day)} y1={pad.t} y2={H - pad.b} stroke={tones[i % tones.length]} strokeWidth={3} strokeDasharray="10 10" />
								<circle cx={x(c.day)} cy={y(data[c.day])} r={12 * p} fill={tones[i % tones.length]} />
							</g>
						) : null;
					})}
					<circle cx={head.x} cy={head.y} r={11} fill={color.chartLine} stroke="#fff" strokeWidth={4} opacity={progress < 1 ? 1 : 0} />
				</svg>
			</Card>
		</Center>
	);
};

/** Experiment result: baseline vs. after, with a verdict. Optional one-click undo. */
export const Verdict: React.FC<P<'verdict'>> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { wide } = useLayout();
	const T = TIMING.verdict;
	const card = useRise(0, 60);
	const badge = useEnter(T.badge, 'springPop');
	const v = verdicts[scene.verdict];
	const undoPressed = scene.undo ? interpolate(frame - T.undo, [0, 4, 10], [0, 1, 0], clamp) : 0;
	const undone = scene.undo && frame > T.undo + 6;

	return (
		<Center>
			<Card glow style={{ ...card, width: wide ? 1200 : '100%', maxWidth: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 28 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<div>
						<div style={{ fontSize: 26, color: color.fgMuted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
							{scene.days}-day experiment
						</div>
						<div style={{ fontSize: 40, fontWeight: 800, marginTop: 6 }}>“{scene.videoTitle}”</div>
					</div>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
					{scene.metrics.map((m, i) => {
						const pct = Math.round(((m.after - m.before) / m.before) * 100);
						const up = pct >= 0;
						const rowIn = interpolate(frame - (8 + i * 6), [0, 10], [0, 1], clamp);
						const dec = m.after < 20 ? 1 : 0;
						return (
							<div
								key={i}
								style={{
									display: 'flex',
									alignItems: 'baseline',
									justifyContent: 'space-between',
									padding: '22px 28px',
									borderRadius: 20,
									background: color.surface,
									opacity: rowIn,
									transform: `translateX(${(1 - rowIn) * 40}px)`
								}}
							>
								<span style={{ fontSize: 30, color: color.fgSoft, whiteSpace: 'nowrap', marginRight: 16 }}>{m.label}</span>
								<span style={{ display: 'flex', gap: 22, alignItems: 'baseline' }}>
									<span style={{ fontSize: 30, color: color.fgMuted }}>
										{m.before.toLocaleString('en-US', { maximumFractionDigits: dec })}
										{m.unit}
									</span>
									<span style={{ fontSize: 30, color: color.fgMuted }}>→</span>
									<span style={{ fontSize: 46, fontWeight: 850 }}>
										<CountUp from={m.before} to={m.after} delay={14 + i * 6} decimals={dec} suffix={m.unit ?? ''} />
									</span>
									<span style={{ fontSize: 32, fontWeight: 800, color: up ? color.emerald : color.red, minWidth: 110, textAlign: 'right' }}>
										{up ? '+' : ''}
										{pct}%
									</span>
								</span>
							</div>
						);
					})}
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-between' }}>
					<span style={{ transform: `scale(${badge})`, transformOrigin: 'left center', display: 'inline-block' }}>
						<Pill tone={undone ? color.fgSoft : v.color} size={40}>
							{undone ? '↺ Restored the old version' : `${scene.verdict === 'winning' ? '▲' : scene.verdict === 'losing' ? '▼' : '•'} ${v.label}`}
						</Pill>
					</span>
					{scene.undo && !undone && (
						<ClickTarget clickAt={T.undo}>
							<span
								style={{
									display: 'inline-block',
									fontSize: 32,
									fontWeight: 750,
									padding: '16px 28px',
									borderRadius: 16,
									border: `2px solid ${color.border}`,
									background: color.surfaceHi,
									transform: `scale(${1 - undoPressed * 0.06})`,
									opacity: interpolate(frame - T.badge, [0, 10], [0, 1], clamp)
								}}
							>
								↺ Undo
							</span>
						</ClickTarget>
					)}
				</div>
			</Card>
		</Center>
	);
};
