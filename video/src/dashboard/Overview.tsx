import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { clusters, type ClusterId } from '../brand';
import { MapPlot } from '../components/MapPlot';
import { Thumb } from '../components/Thumb';
import { beat, easeOut, NEVER, pop, prog, type Rect } from './anim';
import { channel, overview, tracked, videos } from './data';
import { AppCard, AppFrame, Block, Btn, Chip, pad, T, TOP } from './ui';

// The Overview page. Beats (leave one out and it has already happened):
//   stats  numbers count up
//   map    dots sweep onto the map
//   highlight  one group lights up (scene "highlight", default hidden gems; "gems" also works)
//   spot   a change gets spotted: new row in "Changes we're tracking", counter +1

const ROW = 64;
const VROW = 84;

export function overviewLayout(W: number) {
	const p = pad(W);
	const x = p;
	const w = W - 2 * p;
	let y = TOP + 26;
	const title: Rect = { x, y, w, h: 58 };
	y += title.h + 20;
	const stats: Rect = { x, y, w, h: 104 };
	y += stats.h + 22;
	const plotH = W > 1100 ? 290 : 300;
	const legendCols = W >= 1000 ? 4 : 2;
	const legendH = legendCols === 4 ? 92 : 92 * 2 + 10;
	const map: Rect = { x, y, w, h: 24 + 62 + 30 + plotH + 44 + legendH + 24 };
	const plot: Rect = { x: x + 40, y: y + 24 + 62 + 30, w: w - 70, h: plotH };
	const legend: Rect = { x: x + 24, y: plot.y + plotH + 44, w: w - 48, h: legendH };
	y += map.h + 22;
	const tracking: Rect = { x, y, w, h: 46 + 4 * ROW + 2 };
	y += tracking.h + 22;
	const vids: Rect = { x, y, w, h: 50 + 46 + videos.length * VROW };
	const H = y + vids.h + 36;
	const statCard = (i: number): Rect => ({ x: x + i * ((w + 14) / 3), y: stats.y, w: (w - 28) / 3, h: stats.h });
	return {
		W,
		H,
		legendCols,
		regions: {
			title,
			stats,
			'stat-tracking': statCard(1),
			map,
			'map-plot': { x: plot.x - 20, y: plot.y - 20, w: plot.w + 40, h: plot.h + 60 },
			legend,
			tracking,
			'tracking-row': { x, y: tracking.y + 46, w, h: ROW },
			videos: vids
		} as Record<string, Rect>,
		blocks: { title, stats, map, plot, legend, tracking, vids }
	};
}

export const Overview: React.FC<{ W: number; beats: Record<string, number>; opts?: { highlight?: ClusterId } }> = ({ W, beats, opts }) => {
	const hl: ClusterId = opts?.highlight ?? 'hidden_gem';
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const L = overviewLayout(W);
	const b = L.blocks;
	const statsP = easeOut(prog(frame, beat(beats, 'stats', -1000), 22));
	const mapP = prog(frame, beat(beats, 'map', -1000), 30);
	const gemsP = easeOut(prog(frame, beat(beats, 'highlight', beat(beats, 'gems')), 12));
	const spot = beat(beats, 'spot');
	const spotP = easeOut(prog(frame, spot, 14));
	const glow = Math.max(0, 1 - Math.max(0, frame - spot - 14) / 45) * (frame >= spot ? 1 : 0);
	const pulse = 1 + Math.sin((frame / fps) * Math.PI * 3) * 0.15 * gemsP;

	const stat = (label: string, value: number, tone?: string, bump = 0) => (
		<AppCard style={{ flex: 1, padding: '18px 22px' }} glow={bump}>
			<div style={{ fontSize: T.small, color: T.mutedFg }}>{label}</div>
			<div style={{ fontSize: 32, fontWeight: 800, marginTop: 6, fontVariantNumeric: 'tabular-nums', color: tone, transform: `scale(${1 + bump * 0.15})`, transformOrigin: 'left center' }}>
				{value}
			</div>
		</AppCard>
	);

	// Before the "spot" beat the list shows rows 1..4; the new row slides in on top.
	const shown = frame >= spot ? tracked.slice(0, 5) : tracked.slice(1, 5);

	return (
		<AppFrame W={W} H={L.H} active="Overview" path="/dashboard">
			<Block r={b.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
				<div>
					<div style={{ fontSize: T.h1, fontWeight: 800 }}>Overview</div>
					<div style={{ fontSize: T.text - 1, color: T.mutedFg, marginTop: 2 }}>{channel.name}</div>
				</div>
				<Btn>↻ Refresh videos</Btn>
			</Block>

			<Block r={b.stats} style={{ display: 'flex', gap: 14 }}>
				{stat('Videos', Math.round(overview.videos * statsP))}
				{stat('Changes being tracked', Math.round((overview.tracking - 1) * statsP) + (frame >= spot ? 1 : 0), undefined, glow)}
				{stat('Due for a decision', Math.round(overview.due * statsP), T.amber)}
			</Block>

			<Block r={b.map}>
				<AppCard style={{ position: 'absolute', inset: 0 }}>
					<div style={{ position: 'absolute', left: 24, top: 22, right: 24, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
						<div>
							<div style={{ fontSize: T.h2, fontWeight: 700 }}>Strong vs. weak videos</div>
							<div style={{ fontSize: T.small, color: T.mutedFg, marginTop: 4 }}>Each dot is a video. Lines mark your channel's medians.</div>
						</div>
						{W > 900 && (
							<div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
								<Chip bg={T.bg} style={{ border: `1.5px solid ${T.border}` }}>Last 90 days ▾</Chip>
								<Chip bg={T.bg} style={{ border: `1.5px solid ${T.border}` }}>All videos ▾</Chip>
							</div>
						)}
					</div>
				</AppCard>
			</Block>
			<Block r={b.plot}>
				<MapPlot width={b.plot.w} height={b.plot.h} dots={mapP} focus={gemsP > 0 ? hl : undefined} focusP={gemsP} pulse={pulse} fontSize={14} dotSize={7} />
			</Block>
			<Block
				r={b.legend}
				style={{ display: 'grid', gridTemplateColumns: `repeat(${L.legendCols}, 1fr)`, gap: 10 }}
			>
				{(Object.keys(clusters) as ClusterId[]).map((id) => {
					const lit = id === hl ? gemsP : 0;
					const dim = gemsP > 0 && id !== hl ? 1 - gemsP * 0.5 : 1;
					return (
						<div
							key={id}
							style={{
								border: `1.5px solid ${lit > 0 ? `${clusters[id].color}${Math.round(0x33 + lit * 0x88).toString(16)}` : T.border}`,
								background: lit > 0 ? `${clusters[id].color}14` : 'transparent',
								borderRadius: 12,
								padding: '12px 14px',
								opacity: dim
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: T.text - 1, fontWeight: 700 }}>
								<span style={{ width: 11, height: 11, borderRadius: 6, background: clusters[id].color }} />
								{clusters[id].label}
								<span style={{ marginLeft: 'auto', fontSize: T.small, color: T.mutedFg, fontWeight: 500 }}>
									{Math.round(overview.groups[id] * statsP)}
								</span>
							</div>
							<div style={{ fontSize: T.small - 0.5, color: T.mutedFg, marginTop: 5 }}>{clusters[id].hint}</div>
						</div>
					);
				})}
			</Block>

			<Block r={b.tracking}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 34 }}>
					<span style={{ fontSize: T.h2, fontWeight: 700 }}>Changes we're tracking</span>
					<span style={{ fontSize: T.text - 1, color: T.primary }}>See how they're doing</span>
				</div>
				<AppCard style={{ position: 'absolute', left: 0, right: 0, top: 46, height: 4 * ROW + 2, overflow: 'hidden' }}>
					{shown.slice(0, 4).map((r, i) => {
						const isNew = frame >= spot && i === 0;
						const shift = frame >= spot ? (1 - spotP) * -ROW : 0;
						return (
							<div
								key={r.title}
								style={{
									position: 'absolute',
									left: 0,
									right: 0,
									top: i * ROW + shift,
									height: ROW,
									display: 'flex',
									alignItems: 'center',
									gap: 14,
									padding: '0 14px',
									borderTop: i ? `1.5px solid ${T.border}` : undefined,
									background: isNew ? `rgba(255,137,24,${0.14 * glow})` : undefined
								}}
							>
								<Thumb seed={r.seed} width={78} duration="" />
								<div style={{ minWidth: 0, flex: 1 }}>
									<div style={{ fontSize: T.text - 1, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
									<div style={{ fontSize: T.small - 0.5, color: T.mutedFg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
										{r.meta}
									</div>
								</div>
								{isNew && (
									<span style={{ transform: `scale(${pop(prog(frame, spot + 8, 12))})` }}>
										<Chip tone={T.sky} bg="rgba(56,189,248,0.15)">
											New
										</Chip>
									</span>
								)}
							</div>
						);
					})}
				</AppCard>
			</Block>

			<Block r={b.vids}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 38 }}>
					<span style={{ fontSize: T.h2, fontWeight: 700 }}>Videos</span>
					<span
						style={{
							width: Math.min(260, b.vids.w * 0.4),
							padding: '7px 14px',
							borderRadius: 9,
							border: `1.5px solid ${T.border}`,
							fontSize: T.small,
							color: T.mutedFg
						}}
					>
						⌕ Search titles
					</span>
				</div>
				<div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
					{['All', 'Being tracked', 'Long-form', 'Shorts'].map((c, i) => (
						<span
							key={c}
							style={{
								padding: '5px 13px',
								borderRadius: 999,
								fontSize: T.small,
								background: i === 0 ? T.primary : T.secondary,
								color: i === 0 ? '#111' : T.fg
							}}
						>
							{c}
						</span>
					))}
				</div>
				<AppCard style={{ position: 'absolute', left: 0, right: 0, top: 96, height: videos.length * VROW }}>
					{videos.map((v, i) => (
						<div
							key={v.title}
							style={{
								height: VROW,
								display: 'flex',
								alignItems: 'center',
								gap: 16,
								padding: '0 14px',
								borderTop: i ? `1.5px solid ${T.border}` : undefined
							}}
						>
							<Thumb seed={v.seed} width={104} duration="" />
							<div style={{ flex: 1, minWidth: 0 }}>
								<div style={{ fontSize: T.text - 1, fontWeight: 600 }}>{v.title}</div>
								<div style={{ fontSize: T.small - 0.5, color: T.mutedFg, marginTop: 2 }}>{v.date}</div>
							</div>
							{v.tracking && (
								<span style={{ transform: `scale(${i === 0 && spot < NEVER ? pop(prog(frame, spot + 4, 12)) : 1})` }}>
									<Chip tone={T.primary} bg="rgba(255,137,24,0.15)">
										Tracking
									</Chip>
								</span>
							)}
						</div>
					))}
				</AppCard>
			</Block>
		</AppFrame>
	);
};
