import React from 'react';
import { clusters, color, type ClusterId } from '../brand';
import { mulberry32 } from '../layout';

// The library map ("Strong vs. weak videos" in the app): every video by views
// per day (x, log scale) and engagement (y), split at the channel's medians.
// Same rules as frontend/src/lib/server/stats.ts, on a made-up filmmaking channel ("Frame Rate").

export const TITLES = [
	'How I light my videos for $40', 'Budget camera vs $3,000 camera', 'Why your videos look cheap', 'Best mic under $100', 'I edited every day for 30 days',
	'My entire YouTube setup', 'Fix bad audio in 60 seconds', 'Color grading in 5 minutes', 'Stop using auto exposure', 'B-roll ideas for boring rooms',
	'Phone vs camera: blind test', 'The editing trick nobody uses', 'How I plan a video in 20 min', 'Cheap lights that look expensive', 'My first 1,000 subscribers',
	'Talking to camera without cringing', 'Best settings for YouTube video', 'Why I quit my old camera', 'Thumbnail mistakes I made', 'Editing a video in 1 hour',
	'Do you need 4K?', 'My $500 studio', 'Hook your viewers in 5 seconds', 'Sound design for beginners', 'Lens guide for YouTubers',
	'How I film alone', 'Fixing shaky footage', 'Teleprompter on a budget', 'What I wish I knew at 0 subs', 'The 3-light setup',
	'Batch filming 4 videos a day', 'Free editing software tested', 'Camera settings cheat sheet', 'How I write scripts', 'Shooting in a tiny room',
	'Gimbal vs no gimbal', 'My editing workflow', 'Upload schedule that worked', 'Making B-roll interesting', 'Green screen at home',
	'Fix echo in your room', 'Vlog camera buying guide'
];

export type MapPoint = { title: string; v: number; e: number; cluster: ClusterId; nx: number; ny: number };

function build() {
	const rand = mulberry32(20261018);
	const gauss = () => Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-9))) * Math.cos(2 * Math.PI * rand());
	const raw = TITLES.map((title) => ({ title, v: Math.exp(3.4 + 1.25 * gauss()), e: Math.max(0.006, 0.042 + 0.014 * gauss()) }));
	const med = (xs: number[]) => {
		const s = [...xs].sort((a, b) => a - b);
		return s[Math.floor(s.length / 2)];
	};
	const mv = med(raw.map((r) => r.v));
	const me = med(raw.map((r) => r.e));
	const lv = raw.map((r) => Math.log(r.v));
	const [vMin, vMax] = [Math.min(...lv) - 0.35, Math.max(...lv) + 0.35];
	const [eMin, eMax] = [Math.min(...raw.map((r) => r.e)) - 0.006, Math.max(...raw.map((r) => r.e)) + 0.006];
	const nx = (v: number) => (Math.log(v) - vMin) / (vMax - vMin);
	const ny = (e: number) => 1 - (e - eMin) / (eMax - eMin);
	const points: MapPoint[] = raw.map((r) => ({
		...r,
		cluster: r.v >= mv ? (r.e >= me ? 'star' : 'wide_reach') : r.e >= me ? 'hidden_gem' : 'underperformer',
		nx: nx(r.v),
		ny: ny(r.e)
	}));
	return { points, mx: nx(mv), my: ny(me) };
}

/** The sample library, in normalised 0..1 plot coordinates (y down). */
export const LIBRARY = build();

/** A group's quarter of the plot, in 0..1 coordinates. */
export function quadrant(id: ClusterId) {
	const { mx, my } = LIBRARY;
	const right = id === 'star' || id === 'wide_reach';
	const top = id === 'star' || id === 'hidden_gem';
	return { x: right ? mx : 0, y: top ? 0 : my, w: right ? 1 - mx : mx, h: top ? my : 1 - my };
}

export const CORNER: Record<ClusterId, { x: 'left' | 'right'; y: 'top' | 'bottom' }> = {
	star: { x: 'right', y: 'top' },
	hidden_gem: { x: 'left', y: 'top' },
	wide_reach: { x: 'right', y: 'bottom' },
	underperformer: { x: 'left', y: 'bottom' }
};

export type MapPlotProps = {
	width: number;
	height: number;
	/** 0..1 progress of each layer. Dots sweep in from left to right. */
	axes?: number;
	dots?: number;
	medians?: number;
	tint?: number;
	labels?: number;
	/** Highlight one group: others dim as focusP goes to 1. */
	focus?: ClusterId;
	focusP?: number;
	pulse?: number;
	dotSize?: number;
	fontSize?: number;
	axisLabels?: boolean;
};

export const MapPlot: React.FC<MapPlotProps> = ({
	width,
	height,
	axes = 1,
	dots = 1,
	medians = 1,
	tint = 0,
	labels = 0,
	focus,
	focusP = 0,
	pulse = 1,
	dotSize,
	fontSize,
	axisLabels = true
}) => {
	const { points, mx, my } = LIBRARY;
	const r = dotSize ?? Math.max(4, Math.min(width, height) * 0.017);
	const fs = fontSize ?? Math.max(11, Math.min(width, height) * 0.04);
	const X = (n: number) => n * width;
	const Y = (n: number) => n * height;
	return (
		<svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
			{/* Group tints */}
			{(Object.keys(clusters) as ClusterId[]).map((id) => {
				const q = quadrant(id);
				const dim = focus && focus !== id ? 1 - focusP * 0.8 : 1;
				const boost = focus === id ? 1 + focusP * 1.4 : 1;
				return (
					<rect
						key={id}
						x={X(q.x)}
						y={Y(q.y)}
						width={X(q.w)}
						height={Y(q.h)}
						fill={clusters[id].color}
						opacity={tint * 0.07 * dim * boost}
					/>
				);
			})}
			{/* Axes */}
			<line x1={0} y1={height} x2={width * axes} y2={height} stroke={color.fgMuted} strokeWidth={Math.max(1.5, r * 0.25)} />
			<line x1={0} y1={height} x2={0} y2={height * (1 - axes)} stroke={color.fgMuted} strokeWidth={Math.max(1.5, r * 0.25)} />
			{axisLabels && (
				<>
					<text x={width} y={height + fs * 1.4} fill={color.fgMuted} fontSize={fs} textAnchor="end" opacity={axes}>
						Views per day →
					</text>
					<text x={fs * 0.4} y={-fs * 0.6} fill={color.fgMuted} fontSize={fs} opacity={axes}>
						↑ Engagement
					</text>
				</>
			)}
			{/* Median lines */}
			<line
				x1={X(mx)}
				x2={X(mx)}
				y1={height}
				y2={height - height * medians}
				stroke={color.fgSoft}
				strokeOpacity={0.5}
				strokeWidth={Math.max(1.5, r * 0.22)}
				strokeDasharray={`${r * 1.2} ${r}`}
			/>
			<line
				x1={0}
				x2={width * medians}
				y1={Y(my)}
				y2={Y(my)}
				stroke={color.fgSoft}
				strokeOpacity={0.5}
				strokeWidth={Math.max(1.5, r * 0.22)}
				strokeDasharray={`${r * 1.2} ${r}`}
			/>
			{/* Dots */}
			{points.map((p, i) => {
				const local = Math.min(1, Math.max(0, (dots * 1.35 - p.nx) / 0.35));
				if (local <= 0) return null;
				const ease = 1 - Math.pow(1 - local, 3);
				const isFocus = focus === p.cluster;
				const dim = focus && !isFocus ? 1 - focusP * 0.78 : 1;
				const size = r * (ease + Math.sin(local * Math.PI) * 0.35) * (isFocus ? 1 + (pulse - 1) + focusP * 0.15 : 1);
				return <circle key={i} cx={X(p.nx)} cy={Y(p.ny)} r={size} fill={clusters[p.cluster].color} opacity={0.92 * dim} />;
			})}
			{/* Group names in their corners */}
			{(Object.keys(clusters) as ClusterId[]).map((id) => {
				const q = quadrant(id);
				const c = CORNER[id];
				const pad = fs * 0.8;
				const dim = focus && focus !== id ? 1 - focusP * 0.75 : 1;
				return (
					<text
						key={id}
						x={c.x === 'left' ? X(q.x) + pad : X(q.x + q.w) - pad}
						y={c.y === 'top' ? Y(q.y) + pad + fs : Y(q.y + q.h) - pad}
						textAnchor={c.x === 'left' ? 'start' : 'end'}
						fill={clusters[id].color}
						fontSize={fs * 1.15}
						fontWeight={800}
						opacity={labels * dim}
					>
						{clusters[id].label}
					</text>
				);
			})}
		</svg>
	);
};
