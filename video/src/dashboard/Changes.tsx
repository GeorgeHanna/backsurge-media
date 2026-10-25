import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Thumb } from '../components/Thumb';
import { beat, easeOut, NEVER, pop, prog, type Rect } from './anim';
import { change, expA, expB, fmt } from './data';
import { AppCard, AppFrame, Block, Btn, Chip, Clickable, pad, T, TOP } from './ui';

// The Changes page: every change on the channel, with before/after results.
// Beats:
//   click    the "14 days" button is clicked: the change becomes an experiment
//   ff       fast-forward to day 14: results fill in (shows a "12 days later" badge)
//   verdict  the verdict lands: "Winning"          (default: ff + 28 frames)
//   revert   on the losing thumbnail, "Revert" is clicked: original restored

const A_H = 564;
const B_H = 446;

export function changesLayout(W: number) {
	const p = pad(W);
	const x = p;
	const w = W - 2 * p;
	let y = TOP + 26;
	const title: Rect = { x, y, w, h: W > 1000 ? 76 : 100 };
	y += title.h + 14;
	const tabs: Rect = { x, y, w, h: 40 };
	y += tabs.h + 18;
	const cardA: Rect = { x, y, w, h: A_H };
	y += A_H + 18;
	const cardB: Rect = { x, y, w, h: B_H };
	const H = y + B_H + 40;
	const narrow = (r: Rect, f = 0.82): Rect => ({ ...r, w: r.w * f });
	return {
		W,
		H,
		regions: {
			title,
			cardA,
			'cardA-top': narrow({ x, y: cardA.y, w, h: 132 }, 0.9),
			'cardA-table': { x, y: cardA.y + 116, w, h: 270 },
			'cardA-box': { x, y: cardA.y + 380, w, h: 175 },
			'cardA-verdict': { x: x + w * 0.35, y: cardA.y, w: w * 0.65, h: 150 },
			cardB,
			'cardB-thumbs': narrow({ x, y: cardB.y + 50, w, h: 190 }),
			'cardB-footer': { x, y: cardB.y + 210, w, h: 236 }
		} as Record<string, Rect>,
		blocks: { title, tabs, cardA, cardB }
	};
}

/** Screen-space toasts this page shows, from its beats. */
export function changesToasts(beats: Record<string, number>) {
	const out: { at: number; text: string }[] = [];
	if (beats.click !== undefined) out.push({ at: beats.click + 8, text: 'Experiment set for 14 days' });
	if (beats.revert !== undefined) out.push({ at: beats.revert + 8, text: 'Original restored' });
	return out;
}

const Table: React.FC<{
	rows: { label: string; before: string; after: string; change: { text: string; tone: 'up' | 'down' | 'flat' } }[];
	afterDays: number;
}> = ({ rows, afterDays }) => (
	<div style={{ fontSize: T.text - 1 }}>
		<div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', height: 28, alignItems: 'center', color: T.mutedFg, fontSize: T.small }}>
			<span />
			<span>Before (28d)</span>
			<span>After ({afterDays}d)</span>
			<span style={{ textAlign: 'right' }}>Change</span>
		</div>
		{rows.map((r) => (
			<div
				key={r.label}
				style={{
					display: 'grid',
					gridTemplateColumns: '2.2fr 1fr 1fr 1fr',
					height: 38,
					alignItems: 'center',
					borderTop: `1.5px solid ${T.border}`,
					fontVariantNumeric: 'tabular-nums'
				}}
			>
				<span style={{ color: T.mutedFg }}>{r.label}</span>
				<span>{r.before}</span>
				<span>{r.after}</span>
				<span style={{ textAlign: 'right', fontWeight: 700, color: r.change.tone === 'up' ? T.green : r.change.tone === 'down' ? T.red : T.mutedFg }}>
					{r.change.text}
				</span>
			</div>
		))}
	</div>
);

const Verdict: React.FC<{ kind: 'winning' | 'losing' | 'collecting'; scale?: number }> = ({ kind, scale = 1 }) => {
	const s = {
		winning: { label: 'Winning', c: T.green },
		losing: { label: 'Losing', c: T.red },
		collecting: { label: 'Collecting data', c: T.sky }
	}[kind];
	return (
		<span
			style={{
				display: 'inline-block',
				padding: '4px 14px',
				borderRadius: 999,
				fontSize: T.small + 0.5,
				fontWeight: 700,
				color: s.c,
				background: `${s.c}22`,
				border: `1.5px solid ${s.c}55`,
				transform: `scale(${scale})`,
				transformOrigin: 'right center'
			}}
		>
			{s.label}
		</span>
	);
};

export const Changes: React.FC<{ W: number; beats: Record<string, number>; opts?: object }> = ({ W, beats }) => {
	const frame = useCurrentFrame();
	const L = changesLayout(W);
	const b = L.blocks;

	// Experiment A
	const click = beat(beats, 'click');
	const ff = beat(beats, 'ff');
	const verdictAt = beat(beats, 'verdict', ff < NEVER ? ff + 28 : NEVER);
	const isExperiment = frame >= click + 12;
	const ffP = easeOut(prog(frame, ff, 26));
	const day = Math.round(2 + 12 * ffP);
	const won = frame >= verdictAt;
	const verdictPop = won ? pop(prog(frame, verdictAt, 12)) * (1 + 0.25 * Math.max(0, 1 - (frame - verdictAt) / 10)) : 1;
	const rowsA = expA.rows.map((r) => {
		const after = r.early + (r.after - r.early) * ffP;
		return { label: r.label, before: fmt(r.before, r.fmt), after: fmt(after, r.fmt), change: change(r.before, after) };
	});

	// Experiment B
	const revert = beat(beats, 'revert');
	const reverted = frame >= revert + 12;
	const rowsB = expB.rows.map((r) => ({ label: r.label, before: fmt(r.before, r.fmt), after: fmt(r.after, r.fmt), change: change(r.before, r.after) }));

	const meta = (text: string) => <span style={{ fontSize: T.small, color: T.mutedFg, whiteSpace: 'nowrap' }}>{text}</span>;

	return (
		<AppFrame W={W} H={L.H} active="Changes" path="/dashboard/experiments">
			<Block r={b.title}>
				<div style={{ fontSize: T.h1, fontWeight: 800 }}>Changes</div>
				<div style={{ fontSize: T.text - 2, color: T.mutedFg, marginTop: 4, lineHeight: 1.4 }}>
					Every title, description and thumbnail change on your channel, wherever you made it. Each one is compared with the 28 days before it.
				</div>
			</Block>
			<Block r={b.tabs} style={{ display: 'flex', gap: 6 }}>
				<span style={{ padding: '8px 14px', borderRadius: 8, background: T.secondary, fontWeight: 600, fontSize: T.text - 1 }}>Tracking now (6)</span>
				<span style={{ padding: '8px 14px', borderRadius: 8, color: T.mutedFg, fontSize: T.text - 1 }}>Finished (11)</span>
			</Block>

			{/* ── Experiment A: title change spotted on YouTube ── */}
			<Block r={b.cardA}>
				<AppCard style={{ position: 'absolute', inset: 0 }} glow={won ? Math.max(0, 1 - (frame - verdictAt) / 40) : 0} />
				<div style={{ position: 'absolute', left: 22, right: 22, top: 22, height: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
					<Chip>Title</Chip>
					<Chip tone={T.sky} bg="rgba(56,189,248,0.15)">
						Spotted on YouTube
					</Chip>
					{meta(isExperiment ? `Experiment · day ${day} of 14` : 'Tracking · day 2')}
					{won && W > 900 && (
						<span style={{ transform: `scale(${pop(prog(frame, verdictAt + 6, 10))})` }}>
							<Chip tone={T.amber} bg="rgba(251,191,36,0.15)">
								Due for a decision
							</Chip>
						</span>
					)}
					<span style={{ marginLeft: 'auto' }}>
						<Verdict kind={won ? 'winning' : 'collecting'} scale={verdictPop} />
					</span>
				</div>
				<div style={{ position: 'absolute', left: 22, right: 22, top: 64 }}>
					<div style={{ fontSize: T.text - 1, color: T.mutedFg, textDecoration: 'line-through' }}>{expA.oldTitle}</div>
					<div style={{ fontSize: T.text + 1, fontWeight: 650, marginTop: 4 }}>{expA.newTitle}</div>
				</div>
				<div style={{ position: 'absolute', left: 22, right: 22, top: 132 }}>
					<Table rows={rowsA} afterDays={day} />
					<div style={{ fontSize: T.small - 1.5, color: T.mutedFg, marginTop: 6 }}>Daily averages, change day excluded. YouTube data through Oct 12, 2026.</div>
				</div>
				<div
					style={{
						position: 'absolute',
						left: 22,
						right: 22,
						top: 390,
						height: 96,
						borderRadius: 12,
						padding: '14px 16px',
						border: `1.5px solid ${isExperiment ? 'rgba(52,211,153,0.4)' : 'rgba(255,137,24,0.35)'}`,
						background: isExperiment ? 'rgba(52,211,153,0.07)' : 'rgba(255,137,24,0.06)'
					}}
				>
					{isExperiment ? (
						<div style={{ fontSize: T.text - 1, lineHeight: 1.5 }}>
							<span style={{ color: T.green, fontWeight: 700 }}>✓ Experiment set for 14 days.</span>
							<br />
							<span style={{ color: T.mutedFg }}>We'll email you the verdict.</span>
						</div>
					) : (
						<>
							<div style={{ fontSize: T.text - 1 }}>
								<span style={{ fontWeight: 650 }}>Want a clear answer?</span>{' '}
								<span style={{ color: T.mutedFg }}>Run it as an experiment and we'll tell you if it worked.</span>
							</div>
							<div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
								{[7, 14, 28].map((d) => {
									const btn = (
										<Btn style={{ border: '1.5px solid rgba(255,137,24,0.45)', color: T.primary, padding: '5px 14px' }} pressed={d === 14 ? prog(frame, click, 3) * (1 - prog(frame, click + 3, 4)) : 0}>
											{d} days
										</Btn>
									);
									return d === 14 ? (
										<Clickable key={d} at={click}>
											{btn}
										</Clickable>
									) : (
										<span key={d}>{btn}</span>
									);
								})}
							</div>
						</>
					)}
				</div>
				<div style={{ position: 'absolute', left: 22, right: 22, top: 500, display: 'flex', gap: 8 }}>
					<Btn kind="primary">Keep change</Btn>
					<Btn>Revert</Btn>
					<Btn kind="ghost" style={{ marginLeft: 'auto' }}>
						Delete
					</Btn>
				</div>
			</Block>

			{/* ── Experiment B: thumbnail made in Backsurge, losing ── */}
			<Block r={b.cardB}>
				<AppCard style={{ position: 'absolute', inset: 0 }} />
				<div style={{ position: 'absolute', left: 22, right: 22, top: 22, height: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
					<Chip>Thumbnail</Chip>
					{meta(reverted ? 'Reverted after 14 days' : 'Experiment · day 14 of 14')}
					{!reverted && (
						<Chip tone={T.amber} bg="rgba(251,191,36,0.15)">
							Due for a decision
						</Chip>
					)}
					<span style={{ marginLeft: 'auto' }}>
						<Verdict kind="losing" />
					</span>
				</div>
				<div style={{ position: 'absolute', left: 22, right: 22, top: 64, fontSize: T.text - 1, color: T.mutedFg }}>
					{expB.videoTitle} · new thumbnail uploaded (original backed up).
				</div>
				<div style={{ position: 'absolute', left: 22, top: 98, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
					{[
						{ seed: 3, label: undefined, cap: reverted ? 'Restored' : 'Original', on: reverted },
						{ seed: 3, label: 'BEST MIC?!', cap: reverted ? 'Removed' : 'New', on: !reverted }
					].map((t) => (
						<div key={t.cap} style={{ opacity: t.on ? 1 : 0.4, transition: 'none' }}>
							<Thumb seed={t.seed} label={t.label} width={176} duration="" />
							<div style={{ fontSize: T.small - 1, color: t.on && reverted ? T.green : T.mutedFg, marginTop: 5, fontWeight: t.on && reverted ? 700 : 400 }}>
								{t.cap}
							</div>
						</div>
					))}
				</div>
				<div style={{ position: 'absolute', left: 22, right: 22, top: 226 }}>
					<Table rows={rowsB} afterDays={14} />
				</div>
				<div style={{ position: 'absolute', left: 22, right: 22, top: 382, display: 'flex', gap: 8 }}>
					{reverted ? (
						<span style={{ fontSize: T.text - 1, color: T.green, fontWeight: 650 }}>✓ Original thumbnail is back on YouTube</span>
					) : (
						<>
							<Btn kind="primary">Keep change</Btn>
							<Clickable at={revert} from={{ x: 200, y: -120 }}>
								<Btn pressed={prog(frame, revert, 3) * (1 - prog(frame, revert + 3, 4))}>Revert</Btn>
							</Clickable>
							<Btn kind="ghost" style={{ marginLeft: 'auto' }}>
								Delete
							</Btn>
						</>
					)}
				</div>
			</Block>
		</AppFrame>
	);
};
