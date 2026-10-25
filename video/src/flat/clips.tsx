import React from 'react';
import { interpolate, Sequence, useCurrentFrame } from 'remotion';
import { clusters } from '../brand';
import { type Beat, clamp, FlatCard, FlatClip, Huh, INK, Pill, type PropSpec, type Sfx, Sparkles, starts } from './kit';
import { ChangeLog, Alert, FollowUp, LibraryMap, Retention, TitleStack, UrlCard, Verdict, VideoEdit, VideoTile, ViewsChart } from './props';

// Kid-drawn Shorts, 35–47 s each. Every clip: a black, high-contrast hook, a wave,
// then Daisy the surfer cow explaining one problem to you, and the end card. Headline text in [brackets]
// sits on the highlight; "|" breaks the line.

const NEW = 'How I light my videos for $40';
const NEW_THUMB = { seed: 7, label: 'CHEAP vs PRO' };

const at = (S: Record<string, number>, id: string, d = 0) => S[id] + d;
/** Overlay that only exists during a beat (frames relative to the beat). */
const During: React.FC<{ from: number; len: number; children: React.ReactNode }> = ({ from, len, children }) => (
	<Sequence from={from} durationInFrames={len} layout="none">
		{children}
	</Sequence>
);

// ── 1. Did it work? (experiments + verdicts) ───────────────────────────────

const A: Beat[] = [
	{ id: 'hook1', len: 75, tone: 'ink', text: 'You changed your | YouTube title | [4 times.]', size: 104, top: 300, layout: 'none' },
	{ id: 'hook2', len: 60, tone: 'ink', text: 'Which one | [actually worked?]', size: 104, top: 300, layout: 'none' },
	{ id: 'title', len: 115, layout: 'focus', text: 'You change | [the title.]', face: [[0, 'happy'], [40, 'smug']], pose: 'pointUp' },
	{ id: 'thumb', len: 95, layout: 'focus', text: 'And [the thumbnail.]', face: 'smug', pose: 'pointUp', hops: [70] },
	{ id: 'wait', len: 120, sun: 'deadpan', text: 'Then you wait. | [And wait.]', face: [[0, 'neutral'], [50, 'deadpan']], pose: 'slump', eyes: [[0, [1, 0]], [60, [0, 0]]] },
	{ id: 'noidea', len: 70, sun: 'unsure', text: 'Did it work? | [No idea.]', face: 'unsure', pose: 'shrug', sweat: true, eyes: [[0, [1, -0.5]], [30, [-1, 0]], [55, [0, 0]]] },
	{ id: 'reveal', len: 115, layout: 'focus', text: 'Backsurge | [measures it.]', sun: 'delighted', face: [[0, 'shock'], [20, 'delighted']], pose: [[0, 'idle'], [20, 'cheer']], hops: [24, 50] },
	{ id: 'keep', layout: 'focus', len: 85, text: 'Winning? [Keep it.] | Losing? [Revert it.]', size: 96, face: 'happy', pose: 'point' },
	{ id: 'end', layout: 'focus', wave: true, len: 100, text: 'Know what | [actually works.]', face: 'delighted', pose: [[0, 'cheer'], [40, 'idle']], hops: [6] }
];
const SA = starts(A).S;

const Decide: React.FC<{ w: number }> = ({ w }) => {
	const f = useCurrentFrame();
	const press = interpolate(f, [40, 43, 48], [0, 1, 0], clamp);
	const kept = f >= 46;
	return (
		<FlatCard w={w}>
			<div style={{ fontSize: 34, fontWeight: 800, opacity: 0.55 }}>Result: ▲ Winning</div>
			<div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, marginTop: 10 }}>{NEW}</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24, alignItems: 'flex-start' }}>
				<span style={{ transform: `scale(${1 - press * 0.12})`, display: 'inline-block' }}>
					<Pill bg={kept ? '#3ccf6e' : '#fff'} size={60}>
						{kept ? 'Change kept ✓' : 'Keep change'}
					</Pill>
				</span>
				<Pill size={60} style={{ opacity: kept ? 0.35 : 1 }}>
					Revert
				</Pill>
			</div>
		</FlatCard>
	);
};

const propsA: PropSpec[] = [
	{ from: 'hook1', to: 'hook2', layout: 'free', at: 16, x: 80, top: 700, C: ({ w }) => <TitleStack w={w} titles={['My lighting setup', 'My $40 lighting setup', 'Cheap lighting that looks pro', NEW]} every={13} /> },
	{
		from: 'title',
		to: 'thumb',
		layout: 'focus',
		at: 2,
		C: ({ w }) => (
			<VideoEdit
				w={w}
				seed={0}
				title="My lighting setup"
				edits={[
					{ kind: 'title', at: 22, to: NEW, type: 40 },
					{ kind: 'save', at: 88 },
					{ kind: 'thumb', at: 135, ...NEW_THUMB },
					{ kind: 'save', at: 180 }
				]}
			/>
		)
	},
	{ from: 'wait', to: 'noidea', layout: 'stage', at: 2, C: ({ w }) => <ViewsChart w={w} shape="flat" days={[1, 3, 6, 9, 12, 14]} daysAt={30} /> },
	{ from: 'reveal', layout: 'focus', at: 4, C: ({ w }) => <Verdict w={w} title={NEW} pct={35} /> },
	{ from: 'keep', layout: 'focus', at: 4, C: Decide },
	{ from: 'end', layout: 'focus', at: 8, top: 640, C: UrlCard }
];

const sfxA: Sfx[] = [
	{ name: 'impact', at: 2, v: 0.45 },
	...[0, 1, 2, 3].map((i) => ({ name: 'pop', at: 16 + i * 13, v: 0.45 })),
	{ name: 'tick', at: at(SA, 'hook2', 2), v: 0.5 },
	{ name: 'swipe', at: at(SA, 'title', 24), v: 0.3 },
	...Array.from({ length: 10 }, (_, k) => ({ name: 'tick', at: at(SA, 'title', 36 + k * 4), v: 0.25 })),
	{ name: 'click', at: at(SA, 'title', 90), v: 0.55 },
	{ name: 'swipe', at: at(SA, 'title', 135), v: 0.4 },
	{ name: 'click', at: at(SA, 'title', 182), v: 0.55 },
	{ name: 'whoosh', at: at(SA, 'wait'), v: 0.3 },
	...[0, 1, 2, 3, 4, 5].map((i) => ({ name: 'tick', at: at(SA, 'wait', 32 + i * 12), v: 0.35 })),
	{ name: 'cricket', at: at(SA, 'wait', 100), v: 0.5 },
	{ name: 'pop', at: at(SA, 'noidea', 12), v: 0.4 },
	{ name: 'pop', at: at(SA, 'noidea', 18), v: 0.4 },
	{ name: 'pop', at: at(SA, 'noidea', 24), v: 0.4 },
	{ name: 'notify', at: at(SA, 'reveal', 2), v: 0.55 },
	{ name: 'count', at: at(SA, 'reveal', 12), v: 0.35 },
	{ name: 'ding', at: at(SA, 'reveal', 36), v: 0.5 },
	{ name: 'sparkle', at: at(SA, 'reveal', 38), v: 0.4 },
	{ name: 'click', at: at(SA, 'keep', 44), v: 0.55 },
	{ name: 'ding', at: at(SA, 'keep', 48), v: 0.35 },
	{ name: 'pop', at: at(SA, 'end', 8), v: 0.45 }
];

export const DID_IT_WORK = { beats: A, frames: starts(A).total };
export const DidItWork: React.FC<{ music?: boolean }> = ({ music = true }) => (
	<FlatClip
		beats={A}
		props={propsA}
		sfx={sfxA}
		world="kid"
		music={music ? 'generated/did-it-work/music.wav' : undefined}
		extras={
			<>
				<During from={SA.hook2} len={A[1].len}>
					<Huh at={6} x={700} y={1130} dark />
				</During>
				<During from={SA.noidea} len={A[6].len}>
					<Huh at={10} x={690} y={760} />
				</During>
				<During from={SA.reveal} len={A[7].len}>
					<Sparkles at={36} x={560} y={900} spread={360} />
				</During>
			</>
		}
	/>
);

// ── 2. Which videos deserve your time? (library map) ───────────────────────

const B: Beat[] = [
	{ id: 'hook1', len: 70, tone: 'ink', text: 'Your video has | [2,100 views.]', top: 300, layout: 'none' },
	{ id: 'hook2', len: 70, tone: 'ink', text: 'But viewers watch | [71%] of it.', top: 300, layout: 'none' },
	{ id: 'hook3', len: 60, tone: 'ink', text: 'So why is | [nobody seeing it?]', size: 104, top: 300, layout: 'none' },
	{ id: 'map', len: 95, layout: 'focus', text: 'Backsurge maps | [your whole library.]', size: 100, face: 'happy', pose: 'pointUp', hops: [10] },
	{ id: 'gem', len: 75, layout: 'focus', text: 'Loved, not found: | [Hidden gems.]', face: [[0, 'shock'], [30, 'happy']], pose: 'pointUp' },
	{ id: 'gemfix', len: 140, layout: 'focus', text: 'Give it a new | [title or thumbnail.]', size: 100, face: [[0, 'happy'], [70, 'smug']], pose: 'pointUp', hops: [150] },
	{ id: 'star', len: 70, layout: 'focus', text: 'Loved and found: | [Stars.]', face: 'delighted', pose: 'cheer', sun: 'delighted' },
	{ id: 'starfix', len: 95, layout: 'focus', text: 'Make a | [follow-up video.]', face: 'happy', pose: 'pointUp' },
	{ id: 'wide', len: 70, layout: 'focus', text: 'Found, not loved: | [Wide reach.]', face: 'unsure', pose: 'pointUp' },
	{ id: 'widefix', len: 95, layout: 'focus', text: 'Fix the | [first 30 seconds.]', face: [[0, 'neutral'], [50, 'happy']], pose: 'pointUp' },
	{ id: 'under', len: 70, layout: 'focus', text: 'Low on both: | [Underperformers.]', size: 100, face: 'sad', pose: 'slump', sun: 'sad' },
	{ id: 'underfix', len: 90, text: 'New angle, | or [let it go.]', face: [[0, 'unsure'], [50, 'deadpan']], pose: 'shrug' },
	{ id: 'end', layout: 'focus', wave: true, len: 100, text: 'Spend time on | [the right videos.]', face: 'delighted', pose: [[0, 'cheer'], [40, 'idle']], hops: [6] }
];
const SB = starts(B).S;

const propsB: PropSpec[] = [
	{
		from: 'hook1',
		to: 'hook3',
		layout: 'free',
		at: 10,
		x: 140,
		top: 720,
		C: () => <VideoTile w={740} seed={0} title="My lighting setup" meta="2.1K views · 2 years ago" badge={{ text: '71% watched', bg: '#3ccf6e', at: 85 }} />
	},
	{ from: 'map', to: 'gem', layout: 'focus', at: 2, C: ({ w }) => <LibraryMap w={w} focus="hidden_gem" focusAt={B.find((b) => b.id === 'map')!.len + 4} /> },
	{
		from: 'gemfix',
		layout: 'focus',
		at: 2,
		C: ({ w }) => (
			<VideoEdit
				w={w}
				seed={0}
				title="My lighting setup"
				meta="Hidden gem · 71% watched"
				edits={[
					{ kind: 'title', at: 18, to: NEW, type: 40 },
					{ kind: 'thumb', at: 86, ...NEW_THUMB },
					{ kind: 'save', at: 120 }
				]}
			/>
		)
	},
	{ from: 'star', layout: 'focus', at: 2, C: ({ w }) => <LibraryMap w={w} focus="star" focusAt={8} /> },
	{ from: 'starfix', layout: 'focus', at: 2, top: 580, C: FollowUp },
	{ from: 'wide', layout: 'focus', at: 2, C: ({ w }) => <LibraryMap w={w} focus="wide_reach" focusAt={8} /> },
	{ from: 'widefix', layout: 'focus', at: 2, C: ({ w }) => <Retention w={w} fixAt={45} /> },
	{ from: 'under', layout: 'focus', at: 2, C: ({ w }) => <LibraryMap w={w} focus="underperformer" focusAt={8} /> },
	{
		from: 'underfix',
		layout: 'stage',
		at: 4,
		C: ({ w }) => <UnderTile w={w} />
	},
	{ from: 'end', layout: 'focus', at: 8, top: 640, C: UrlCard }
];

const UnderTile: React.FC<{ w: number }> = ({ w }) => {
	const f = useCurrentFrame();
	const g = interpolate(f, [30, 60], [0, 1], clamp);
	return (
		<div style={{ transform: `rotate(${g * 4}deg) translateY(${g * 30}px)`, opacity: 1 - g * 0.25 }}>
			<VideoTile w={w} seed={6} title="Fix bad audio in 60 seconds" meta="310 views · 22% watched" grey={g} badge={{ text: 'Let it go?', bg: clusters.underperformer.color, at: 50 }} />
		</div>
	);
};

const sfxB: Sfx[] = [
	{ name: 'impact', at: 2, v: 0.45 },
	{ name: 'pop', at: 10, v: 0.45 },
	{ name: 'tick', at: at(SB, 'hook2', 2), v: 0.5 },
	{ name: 'ding', at: at(SB, 'hook2', 0), v: 0.45 },
	{ name: 'pop', at: at(SB, 'hook2', 0), v: 0.4 },
	{ name: 'cricket', at: at(SB, 'hook3', 10), v: 0.45 },
	{ name: 'whoosh', at: at(SB, 'map'), v: 0.35 },
	...Array.from({ length: 7 }, (_, k) => ({ name: 'tick', at: at(SB, 'map', 6 + k * 3), v: 0.2 })),
	{ name: 'pop', at: at(SB, 'map', 32), v: 0.35 },
	{ name: 'sparkle', at: at(SB, 'gem', 4), v: 0.45 },
	{ name: 'whoosh', at: at(SB, 'gemfix'), v: 0.3 },
	{ name: 'swipe', at: at(SB, 'gemfix', 20), v: 0.3 },
	...Array.from({ length: 10 }, (_, k) => ({ name: 'tick', at: at(SB, 'gemfix', 32 + k * 4), v: 0.25 })),
	{ name: 'swipe', at: at(SB, 'gemfix', 88), v: 0.4 },
	{ name: 'click', at: at(SB, 'gemfix', 122), v: 0.55 },
	{ name: 'ding', at: at(SB, 'star', 8), v: 0.45 },
	{ name: 'whoosh', at: at(SB, 'starfix', 36), v: 0.4 },
	{ name: 'pop', at: at(SB, 'starfix', 48), v: 0.4 },
	{ name: 'tick', at: at(SB, 'wide', 8), v: 0.45 },
	{ name: 'swipe', at: at(SB, 'widefix', 47), v: 0.35 },
	{ name: 'tick', at: at(SB, 'under', 8), v: 0.45 },
	{ name: 'cricket', at: at(SB, 'under', 30), v: 0.4 },
	{ name: 'pop', at: at(SB, 'underfix', 52), v: 0.4 },
	{ name: 'pop', at: at(SB, 'end', 8), v: 0.45 }
];

export const WHICH_VIDEOS = { beats: B, frames: starts(B).total };
export const WhichVideos: React.FC<{ music?: boolean }> = ({ music = true }) => (
	<FlatClip
		beats={B}
		props={propsB}
		sfx={sfxB}
		world="kid"
		music={music ? 'generated/which-videos/music.wav' : undefined}
		extras={
			<>
				<During from={SB.hook3} len={B[2].len}>
					<Huh at={6} x={560} y={600} dark />
				</During>
				<During from={SB.gem} len={B[4].len}>
					<Sparkles at={14} x={300} y={760} spread={170} />
				</During>
			</>
		}
	/>
);

// ── 3. Change history + revert ─────────────────────────────────────────────

const C: Beat[] = [
	{ id: 'hook1', len: 70, tone: 'ink', text: 'Your YouTube views | dropped [41%.]', size: 104, top: 300, layout: 'none' },
	{ id: 'hook2', len: 65, tone: 'ink', text: 'You changed | something. | [But what?]', size: 104, top: 300, layout: 'none' },
	{ id: 'tweak', len: 150, layout: 'focus', text: 'You tweak | [all the time.]', face: [[0, 'happy'], [60, 'smug']], pose: 'pointUp' },
	{ id: 'weeks', len: 85, sun: 'sad', text: 'Three weeks later: | [views are down.]', size: 100, face: [[0, 'neutral'], [40, 'sad']], pose: 'slump' },
	{ id: 'forgot', len: 85, sun: 'unsure', text: 'The old title? | [No idea.]', face: 'unsure', pose: 'shrug', sweat: true, eyes: [[0, [1, -0.5]], [40, [-1, -0.5]], [70, [0, 0]]] },
	{ id: 'spot', len: 85, text: 'Backsurge spots | [every change.]', face: [[0, 'shock'], [18, 'happy']], pose: 'point', hops: [20] },
	{ id: 'log', len: 90, layout: 'focus', text: 'Every change, | [on the record.]', face: 'happy', pose: 'pointUp' },
	{ id: 'diff', len: 100, layout: 'focus', text: 'See what changed | [and what it did.]', size: 100, face: [[0, 'neutral'], [40, 'shock']], pose: 'pointUp' },
	{ id: 'revert', len: 100, layout: 'focus', text: 'Bad change? | [Revert it.]', face: [[0, 'neutral'], [40, 'delighted']], pose: [[0, 'pointUp'], [40, 'cheer']], hops: [42] },
	{ id: 'end', layout: 'focus', wave: true, len: 100, text: 'Never lose a | [good title] again.', size: 104, face: 'delighted', pose: [[0, 'cheer'], [40, 'idle']], hops: [6] }
];
const SC = starts(C).S;
const lenC = (id: string) => C.find((b) => b.id === id)!.len;

const OldTitle: React.FC<{ w: number }> = ({ w }) => {
	const f = useCurrentFrame();
	return (
		<FlatCard w={w}>
			<div style={{ fontSize: 30, fontWeight: 800, opacity: 0.55 }}>Old title</div>
			<div style={{ fontSize: 120, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 8, color: INK, transform: `rotate(${Math.sin(f / 5) * 3}deg)` }}>???</div>
			<div style={{ fontSize: 30, fontWeight: 700, opacity: 0.55, marginTop: 6 }}>It had “$40” in it. Maybe.</div>
		</FlatCard>
	);
};

const propsC: PropSpec[] = [
	{ from: 'hook1', to: 'hook2', layout: 'free', at: 10, x: 110, top: 700, C: () => <ViewsChart w={800} shape="drop" marker="changes" pct={{ text: '−41%', at: 40, bg: '#ff6b81' }} /> },
	{
		from: 'tweak',
		layout: 'focus',
		at: 2,
		C: ({ w }) => (
			<VideoEdit
				w={w}
				seed={0}
				title={NEW}
				edits={[
					{ kind: 'title', at: 18, to: 'Lighting tutorial (updated)', type: 34 },
					{ kind: 'save', at: 74 },
					{ kind: 'thumb', at: 96, seed: 2, label: 'NEW LIGHTS' },
					{ kind: 'save', at: 130 }
				]}
			/>
		)
	},
	{ from: 'weeks', layout: 'stage', at: 2, C: ({ w }) => <ViewsChart w={w} shape="drop" marker="changes" /> },
	{ from: 'forgot', layout: 'stage', at: 4, C: OldTitle },
	{ from: 'spot', layout: 'stage', at: 6, C: ({ w }) => <Alert w={w} title="We spotted a change on “My lighting setup”" text="New title, changed in YouTube Studio." /> },
	{ from: 'log', to: 'revert', layout: 'focus', at: 2, C: ({ w }) => <ChangeLog w={w} openAt={lenC('log') + 8} revertAt={lenC('log') + lenC('diff') + 30} /> },
	{ from: 'end', layout: 'focus', at: 8, top: 640, C: UrlCard }
];

const sfxC: Sfx[] = [
	{ name: 'impact', at: 2, v: 0.45 },
	{ name: 'pop', at: 10, v: 0.4 },
	{ name: 'scratch', at: 48, v: 0.35 },
	{ name: 'pop', at: 50, v: 0.45 },
	{ name: 'tick', at: at(SC, 'hook2', 2), v: 0.5 },
	{ name: 'pop', at: at(SC, 'hook2', 30), v: 0.4 },
	{ name: 'whoosh', at: at(SC, 'tweak'), v: 0.35 },
	{ name: 'swipe', at: at(SC, 'tweak', 20), v: 0.3 },
	...Array.from({ length: 9 }, (_, k) => ({ name: 'tick', at: at(SC, 'tweak', 32 + k * 4), v: 0.25 })),
	{ name: 'click', at: at(SC, 'tweak', 76), v: 0.5 },
	{ name: 'swipe', at: at(SC, 'tweak', 98), v: 0.4 },
	{ name: 'click', at: at(SC, 'tweak', 132), v: 0.5 },
	{ name: 'whoosh', at: at(SC, 'weeks'), v: 0.3 },
	{ name: 'cricket', at: at(SC, 'forgot', 20), v: 0.45 },
	{ name: 'notify', at: at(SC, 'spot', 8), v: 0.6 },
	{ name: 'whoosh', at: at(SC, 'log'), v: 0.3 },
	...[0, 1, 2].map((i) => ({ name: 'pop', at: at(SC, 'log', 10 + i * 10), v: 0.4 })),
	{ name: 'swipe', at: at(SC, 'diff', 8), v: 0.35 },
	{ name: 'tick', at: at(SC, 'diff', 40), v: 0.45 },
	{ name: 'click', at: at(SC, 'revert', 30), v: 0.6 },
	{ name: 'ding', at: at(SC, 'revert', 38), v: 0.5 },
	{ name: 'sparkle', at: at(SC, 'revert', 40), v: 0.4 },
	{ name: 'pop', at: at(SC, 'end', 8), v: 0.45 }
];

export const CHANGE_HISTORY = { beats: C, frames: starts(C).total };
export const ChangeHistory: React.FC<{ music?: boolean }> = ({ music = true }) => (
	<FlatClip
		beats={C}
		props={propsC}
		sfx={sfxC}
		world="kid"
		music={music ? 'generated/change-history/music.wav' : undefined}
		extras={
			<>
				<During from={SC.hook2} len={lenC('hook2')}>
					<Huh at={20} x={540} y={1180} dark />
				</During>
				<During from={SC.forgot} len={lenC('forgot')}>
					<Huh at={12} x={690} y={760} />
				</During>
				<During from={SC.revert} len={lenC('revert')}>
					<Sparkles at={38} x={540} y={1000} spread={340} />
				</During>
			</>
		}
	/>
);

// ── 4. Why is my video stuck? (impressions → CTR → retention) ──────────────

const STUCK = 'Camera settings explained';
const STUCK_NEW = 'Best camera settings for YouTube (beginners)';

const D: Beat[] = [
	{ id: 'hook1', len: 70, tone: 'ink', text: 'Your YouTube video | [stopped growing.]', size: 104, top: 300, layout: 'none' },
	{ id: 'hook2', len: 65, tone: 'ink', text: "It's not dead. | [One number is broken.]", size: 100, top: 300, layout: 'none' },
	{ id: 'check', len: 65, text: 'Check them | [in this order.]', face: 'happy', pose: 'pointUp', hops: [8] },
	{ id: 'imp', len: 75, layout: 'focus', text: 'Nobody sees it? | [Impressions.]', face: [[0, 'unsure'], [35, 'shock']], pose: 'pointUp' },
	{ id: 'impfix', len: 110, layout: 'focus', text: 'Use the words | [people search.]', face: [[0, 'neutral'], [60, 'smug']], pose: 'pointUp' },
	{ id: 'ctr', len: 75, layout: 'focus', text: 'Seen, not clicked? | [CTR.]', face: 'deadpan', pose: 'pointUp', sun: 'deadpan' },
	{ id: 'ctrfix', len: 95, layout: 'focus', text: 'New | [thumbnail.]', face: [[0, 'neutral'], [45, 'happy']], pose: 'pointUp', hops: [50] },
	{ id: 'ret', len: 105, layout: 'focus', text: 'Clicked, then gone? | [Retention.]', size: 100, face: [[0, 'sad'], [60, 'happy']], pose: 'pointUp', sun: 'sad' },
	{ id: 'one', len: 80, text: 'Fix [one.] | Not all three.', face: 'smug', pose: 'shrug', sun: 'delighted' },
	{ id: 'end', layout: 'focus', wave: true, len: 100, text: 'Know which | [change worked.]', face: 'delighted', pose: [[0, 'cheer'], [40, 'idle']], hops: [6] }
];
const SD = starts(D).S;
const lenD = (id: string) => D.find((b) => b.id === id)!.len;

const propsD: PropSpec[] = [
	{ from: 'hook1', to: 'hook2', layout: 'free', at: 10, x: 110, top: 700, C: () => <ViewsChart w={800} shape="flat" marker="" title="Views per day" /> },
	{
		from: 'imp',
		layout: 'focus',
		at: 2,
		C: ({ w }) => <VideoTile w={w} seed={1} label="SETTINGS?" title={STUCK} meta="Hardly shown in search" badge={{ text: 'Low impressions', bg: '#ff6b81', at: 30 }} />
	},
	{
		from: 'impfix',
		layout: 'focus',
		at: 2,
		C: ({ w }) => <VideoEdit w={w} seed={1} label="SETTINGS?" title={STUCK} edits={[{ kind: 'title', at: 16, to: STUCK_NEW, type: 44 }, { kind: 'save', at: 80 }]} />
	},
	{
		from: 'ctr',
		layout: 'focus',
		at: 2,
		C: ({ w }) => <VideoTile w={w} seed={1} label="SETTINGS?" title={STUCK_NEW} meta="Shown a lot, clicked a little" badge={{ text: 'Low CTR', bg: '#ffb020', at: 30 }} />
	},
	{
		from: 'ctrfix',
		layout: 'focus',
		at: 2,
		C: ({ w }) => <VideoEdit w={w} seed={1} label="SETTINGS?" title={STUCK_NEW} edits={[{ kind: 'thumb', at: 18, seed: 5, label: 'AUTO vs MANUAL' }, { kind: 'save', at: 60 }]} />
	},
	{ from: 'ret', layout: 'focus', at: 2, C: ({ w }) => <Retention w={w} fixAt={58} /> },
	{ from: 'end', layout: 'focus', at: 8, top: 640, C: UrlCard }
];

const sfxD: Sfx[] = [
	{ name: 'impact', at: 2, v: 0.45 },
	{ name: 'cricket', at: 40, v: 0.4 },
	{ name: 'tick', at: at(SD, 'hook2', 2), v: 0.5 },
	{ name: 'scratch', at: at(SD, 'hook2', 30), v: 0.35 },
	{ name: 'whoosh', at: at(SD, 'check'), v: 0.35 },
	{ name: 'pop', at: at(SD, 'check', 10), v: 0.4 },
	{ name: 'whoosh', at: at(SD, 'imp'), v: 0.3 },
	{ name: 'boing', at: at(SD, 'imp', 30), v: 0.4 },
	{ name: 'swipe', at: at(SD, 'impfix', 16), v: 0.3 },
	...Array.from({ length: 11 }, (_, k) => ({ name: 'tick', at: at(SD, 'impfix', 26 + k * 4), v: 0.25 })),
	{ name: 'click', at: at(SD, 'impfix', 82), v: 0.55 },
	{ name: 'whoosh', at: at(SD, 'ctr'), v: 0.3 },
	{ name: 'boing', at: at(SD, 'ctr', 30), v: 0.4 },
	{ name: 'swipe', at: at(SD, 'ctrfix', 18), v: 0.4 },
	{ name: 'click', at: at(SD, 'ctrfix', 62), v: 0.55 },
	{ name: 'whoosh', at: at(SD, 'ret'), v: 0.3 },
	{ name: 'swipe', at: at(SD, 'ret', 60), v: 0.35 },
	{ name: 'ding', at: at(SD, 'ret', 80), v: 0.45 },
	{ name: 'pop', at: at(SD, 'one', 6), v: 0.45 },
	{ name: 'pop', at: at(SD, 'end', 8), v: 0.45 }
];

export const VIEWS_STUCK = { beats: D, frames: starts(D).total };
export const ViewsStuck: React.FC<{ music?: boolean }> = ({ music = true }) => (
	<FlatClip
		beats={D}
		props={propsD}
		sfx={sfxD}
		world="kid"
		music={music ? 'generated/views-stuck/music.wav' : undefined}
		extras={
			<>
				<During from={SD.imp} len={lenD('imp')}>
					<Huh at={36} x={690} y={760} />
				</During>
				<During from={SD.ret} len={lenD('ret')}>
					<Sparkles at={80} x={540} y={900} spread={320} />
				</During>
			</>
		}
	/>
);
