import React from 'react';
import { MapPlot } from '../components/MapPlot';
import { Thumb } from '../components/Thumb';
import { Arrow, Big, CheckBox, Circle, groupColor, groupColorOnInk, HAND, Hi, Note, P, Page, QuadIcon, Tag, Underline } from './kit';

// Image posts. Two carousels and four single images, all 1080×1350.
// Text is the whole point here: keep it true, short and useful.

type G = keyof typeof groupColor;
const N_TYPES = 7;
const N_TEST = 7;

const Col: React.FC<{ gap?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ gap = 28, style, children }) => (
	<div style={{ display: 'flex', flexDirection: 'column', gap, height: '100%', ...style }}>{children}</div>
);

const Small: React.FC<{ color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ color, children, style }) => (
	<div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color, ...style }}>{children}</div>
);

const Body: React.FC<{ size?: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ size = 40, color, children, style }) => (
	<div style={{ fontSize: size, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.01em', color, ...style }}>{children}</div>
);

const Item: React.FC<{ n?: number; color: string; children: React.ReactNode; size?: number }> = ({ n, color, children, size = 44 }) => (
	<div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
		{n !== undefined && <span style={{ fontSize: size, fontWeight: 900, color, minWidth: 40 }}>{n}</span>}
		<span style={{ fontSize: size, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{children}</span>
	</div>
);

// ═════════════ Carousel 1: the 4 types of YouTube videos ═════════════

const TypesCover: React.FC = () => (
	<Page theme="orange" page={[1, N_TYPES]} swipe>
		<Col gap={40}>
			<Tag bg={P.ink} fg={P.orange} style={{ alignSelf: 'flex-start' }}>
				YouTube, explained
			</Tag>
			<Big size={128}>Every video on your channel is one of 4 types.</Big>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 10 }}>
				{(['Hidden gems', 'Stars', 'Underperformers', 'Wide reach'] as const).map((t) => (
					<div key={t} style={{ border: `6px solid ${P.ink}`, padding: '40px 28px', fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em' }}>
						{t}
					</div>
				))}
			</div>
			<Note size={64} rotate={-2} style={{ marginTop: 'auto' }}>
				most creators fix the wrong ones.
			</Note>
		</Col>
	</Page>
);

const TypesMap: React.FC = () => (
	<Page theme="ink" page={[2, N_TYPES]}>
		<Col gap={26}>
			<Small color={P.orange}>How to sort them</Small>
			<Big size={84}>Plot every video on two things.</Big>
			<div style={{ position: 'relative', marginTop: 34, marginLeft: 50 }}>
				<MapPlot width={800} height={560} tint={1} labels={1} dotSize={13} fontSize={30} />
				<Arrow x1={720} y1={-60} x2={660} y2={40} color={P.orange} />
				<Note size={46} color={P.orange} rotate={-4} style={{ position: 'absolute', left: 560, top: -118 }}>
					each dot = one video
				</Note>
			</div>
			<div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
				<Body size={34} color={P.paper}>
					<b>→ Views per day</b> (not total views, so old and new videos compare fairly)
				</Body>
				<Body size={34} color={P.paper}>
					<b>↑ Engagement:</b> likes + comments + shares per view
				</Body>
				<Body size={34} color={P.paperSoft}>
					The dashed lines are your channel's middle.
				</Body>
			</div>
		</Col>
	</Page>
);

const TYPES: Record<G, { n: number; name: string; line: string; spot: [string, string]; todo: string[]; note: string }> = {
	star: {
		n: 1,
		name: 'Stars',
		line: 'Lots of views. People love them.',
		spot: ['Views per day: above your middle', 'Engagement: above your middle'],
		todo: ['Leave the title and thumbnail alone', 'Make a follow-up video', 'Link to it from your newer videos'],
		note: "these pay the bills. don't fiddle."
	},
	hidden_gem: {
		n: 2,
		name: 'Hidden gems',
		line: 'People who find them love them. Hardly anyone finds them.',
		spot: ['Views per day: below your middle', 'Engagement: above your middle'],
		todo: ['New title with words people search', 'New thumbnail that reads on a phone', 'One change, then wait 2 weeks'],
		note: 'your easiest wins are here'
	},
	wide_reach: {
		n: 3,
		name: 'Wide reach',
		line: 'They click. Then they leave.',
		spot: ['Views per day: above your middle', 'Engagement: below your middle'],
		todo: ['Find the drop in the retention graph', 'Cut the slow intro', 'Add chapters'],
		note: 'the title works. the video doesn’t keep the promise.'
	},
	underperformer: {
		n: 4,
		name: 'Underperformers',
		line: 'Few views. Few reactions.',
		spot: ['Views per day: below your middle', 'Engagement: below your middle'],
		todo: ['Still care about the topic? Try one new angle', 'Give it 28 days', 'Nothing moved? Let it go'],
		note: 'spend that time on your gems instead.'
	}
};

const TypeSlide: React.FC<{ g: G }> = ({ g }) => {
	const t = TYPES[g];
	const c = groupColor[g];
	return (
		<Page theme="paper" page={[t.n + 2, N_TYPES]}>
			<Col gap={30}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
					<Tag bg={P.ink} fg={P.paper}>
						Type {t.n} of 4
					</Tag>
					<QuadIcon fill={g} size={110} />
				</div>
				<Big size={g === 'underperformer' ? 104 : 124} style={{ color: c }}>
					{t.name}
				</Big>
				<Body size={52} style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
					{t.line}
				</Body>
				<div style={{ borderTop: `4px solid ${P.ink}`, paddingTop: 22 }}>
					<Small color={P.inkSoft}>How to spot it</Small>
					{t.spot.map((s) => (
						<Body key={s} size={38} color={P.inkSoft} style={{ marginTop: 10 }}>
							{s}
						</Body>
					))}
				</div>
				<div style={{ borderTop: `4px solid ${P.ink}`, paddingTop: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
					<Small color={P.inkSoft}>What to do</Small>
					{t.todo.map((s, i) => (
						<Item key={s} n={i + 1} color={c} size={48}>
							{s}
						</Item>
					))}
				</div>
				<Note size={54} color={c} rotate={-2.5} style={{ marginTop: 'auto' }}>
					{t.note}
				</Note>
			</Col>
		</Page>
	);
};

const TypesEnd: React.FC = () => (
	<Page theme="ink" page={[N_TYPES, N_TYPES]}>
		<Col gap={34}>
			<Small color={P.orange}>Once a month</Small>
			<Big size={96}>Your 15-minute channel check.</Big>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 26, marginTop: 10 }}>
				{[
					['Sort your videos into the 4 types', P.paper],
					['Pick 1 or 2 hidden gems to repackage', groupColorOnInk.hidden_gem],
					['Fix the intro on one wide reach video', groupColorOnInk.wide_reach],
					['Leave your stars alone', groupColorOnInk.star]
				].map(([s, c], i) => (
					<div key={s} style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
						<CheckBox checked={i < 2} ink={P.paper} color={P.orange} seed={i + 2} />
						<span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', color: c }}>{s}</span>
					</div>
				))}
			</div>
			<div style={{ marginTop: 'auto' }}>
				<Note size={62} color={P.orange} rotate={-2}>
					save this for your next clean-up
				</Note>
				<Body size={30} color={P.paperSoft} style={{ marginTop: 26 }}>
					Don't want to sort by hand? backsurge.com draws this map from your channel, free.
				</Body>
			</div>
		</Col>
	</Page>
);

// ═════════════ Carousel 2: did that title change work? ═════════════

const TestCover: React.FC = () => (
	<Page theme="ink" page={[1, N_TEST]} swipe>
		<Col gap={36}>
			<Big size={124}>
				You changed a title.
				<br />
				<span style={{ color: P.orange }}>Did it work?</span>
			</Big>
			<div style={{ background: P.paper, color: P.ink, padding: 34, display: 'flex', gap: 30, alignItems: 'center', transform: 'rotate(-1.5deg)', marginTop: 20 }}>
				<Thumb seed={0} width={300} radius={8} />
				<div style={{ minWidth: 0 }}>
					<div style={{ fontSize: 30, color: '#8a8378', textDecoration: 'line-through', textDecorationThickness: 4, fontWeight: 600 }}>My lighting setup</div>
					<div style={{ fontSize: 38, fontWeight: 850, marginTop: 10, lineHeight: 1.15, letterSpacing: '-0.02em' }}>How I light my videos for $40</div>
				</div>
			</div>
			<Note size={66} color={P.orange} rotate={-3} style={{ marginTop: 'auto' }}>
				5 rules to actually know.
			</Note>
		</Col>
	</Page>
);

const Rule: React.FC<{ n: number; theme?: 'paper' | 'orange'; title: React.ReactNode; body: React.ReactNode; children?: React.ReactNode }> = ({
	n,
	theme = 'paper',
	title,
	body,
	children
}) => {
	const onOrange = theme === 'orange';
	return (
		<Page theme={theme} page={[n + 1, N_TEST]}>
			<Col gap={32}>
				<div style={{ fontSize: 210, fontWeight: 900, lineHeight: 0.8, letterSpacing: '-0.06em', color: onOrange ? P.ink : P.orange }}>{n}</div>
				<Big size={100}>{title}</Big>
				<Body size={40} color={onOrange ? '#2a1906' : P.inkSoft}>
					{body}
				</Body>
				<div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>{children}</div>
			</Col>
		</Page>
	);
};

const TestRule1: React.FC = () => (
	<Rule n={1} title={<>Change one thing at a time.</>} body="New title and new thumbnail on the same day? Views go up, and you'll never know which one did it.">
		<div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
			<Thumb seed={7} width={250} duration="" radius={6} />
			<span style={{ fontSize: 70, fontWeight: 900 }}>+</span>
			<div style={{ fontSize: 34, fontWeight: 800, border: `5px solid ${P.ink}`, padding: '20px 22px', width: 230, lineHeight: 1.15 }}>New title</div>
			<span style={{ fontSize: 70, fontWeight: 900 }}>=</span>
			<div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<span style={{ fontSize: 110, fontWeight: 900, color: P.orange }}>?</span>
				<Circle w={130} h={130} seed={9} style={{ left: -5, top: -5 }} />
			</div>
		</div>
	</Rule>
);

const Bars: React.FC = () => {
	// 28 days before, change day, 14 days after: daily views as bars.
	const before = [52, 48, 55, 50, 47, 53, 58, 49, 51, 46, 54, 50, 52, 57, 48, 50, 53, 49, 55, 51, 47, 52, 56, 50, 49, 54, 51, 52];
	const after = [60, 66, 63, 68, 71, 65, 69, 72, 67, 70, 66, 73, 69, 71];
	const W = 912;
	const H = 300;
	const bw = W / (before.length + after.length + 1);
	const y = (v: number) => H - (v / 85) * H;
	const avgB = before.reduce((a, b) => a + b, 0) / before.length;
	const avgA = after.reduce((a, b) => a + b, 0) / after.length;
	return (
		<div style={{ position: 'relative' }}>
			<svg width={W} height={H + 50} style={{ overflow: 'visible' }}>
				{before.map((v, i) => (
					<rect key={`b${i}`} x={i * bw + 2} y={y(v)} width={bw - 4} height={H - y(v)} fill={P.ink} opacity={0.75} />
				))}
				<rect x={before.length * bw + 2} y={0} width={bw - 4} height={H} fill="none" stroke={P.ink} strokeWidth={3} strokeDasharray="8 8" />
				{after.map((v, i) => (
					<rect key={`a${i}`} x={(before.length + 1 + i) * bw + 2} y={y(v)} width={bw - 4} height={H - y(v)} fill={P.orange} />
				))}
				<line x1={0} x2={before.length * bw} y1={y(avgB)} y2={y(avgB)} stroke={P.ink} strokeWidth={6} />
				<line x1={(before.length + 1) * bw} x2={W} y1={y(avgA)} y2={y(avgA)} stroke={P.ink} strokeWidth={6} />
				<text x={0} y={H + 42} fontSize={28} fontWeight={800} fill={P.ink}>
					28 days before
				</text>
				<text x={W} y={H + 42} fontSize={28} fontWeight={800} fill={P.ink} textAnchor="end">
					after
				</text>
			</svg>
			<Note size={44} rotate={-3} style={{ position: 'absolute', left: before.length * bw - 240, top: -70 }}>
				change day: skip it
			</Note>
		</div>
	);
};

const TestRule2: React.FC = () => (
	<Rule n={2} title="Compare with the 28 days before." body="Use daily averages, not totals, and skip the day of the change itself. One big day can fool you.">
		<Bars />
	</Rule>
);

const TestRule3: React.FC = () => (
	<Rule n={3} theme="orange" title="Ignore the first few days." body="YouTube's analytics can lag 2–3 days. Day-one numbers are incomplete, so don't panic and don't celebrate.">
		<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
			{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
				<div key={d} style={{ border: `5px solid ${P.ink}`, height: 150, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 12, fontSize: 28, fontWeight: 800 }}>
					{d}
					{i < 3 && (
						<span style={{ position: 'absolute', left: 6, top: 6 }}>
							<CheckBox cross ink="transparent" color={P.ink} size={100} seed={i + 11} />
						</span>
					)}
				</div>
			))}
		</div>
	</Rule>
);

const TestRule4: React.FC = () => (
	<Rule
		n={4}
		title="Look past views."
		body="Views also move with seasons, trends and your new uploads. Impressions and click-through rate show what the packaging did."
	>
		<div style={{ border: `5px solid ${P.ink}`, background: '#fffaf0' }}>
			{[
				['Views / day', '512', '689'],
				['Impressions / day', '9.8K', '11.2K'],
				['Click-through rate', '4.1%', '5.6%']
			].map(([a, b, c], i) => (
				<div key={a} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', padding: '20px 26px', fontSize: 36, fontWeight: 700, borderTop: i ? `3px solid ${P.line}` : undefined, position: 'relative' }}>
					<span style={{ color: P.inkSoft }}>{a}</span>
					<span style={{ color: '#8a8378' }}>{b}</span>
					<span style={{ fontWeight: 900 }}>{c}</span>
					{i === 2 && <Circle w={540} h={92} seed={4} style={{ left: 8, top: -8 }} />}
				</div>
			))}
		</div>
		<Note size={40} color={P.inkSoft} rotate={-1} style={{ marginTop: 14 }}>
			example numbers
		</Note>
	</Rule>
);

const TestRule5: React.FC = () => (
	<Rule n={5} title="Then decide. Out loud." body="After 7–14 days: keep it, or put the old one back. Write down what you tried, so next time you start smarter.">
		<div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
			<div style={{ background: P.ink, color: P.paper, fontSize: 46, fontWeight: 900, padding: '26px 44px', position: 'relative' }}>
				Keep it
				<span style={{ position: 'absolute', right: -26, top: -40 }}>
					<CheckBox checked ink="transparent" size={84} seed={21} />
				</span>
			</div>
			<span style={{ fontFamily: HAND, fontSize: 60, fontWeight: 700 }}>or</span>
			<div style={{ border: `6px solid ${P.ink}`, fontSize: 46, fontWeight: 900, padding: '20px 40px' }}>Put it back</div>
		</div>
	</Rule>
);

const TestEnd: React.FC = () => (
	<Page theme="ink" page={[N_TEST, N_TEST]}>
		<Col gap={34}>
			<Small color={P.orange}>Recap</Small>
			{['One change at a time', 'Compare with the 28 days before', 'Ignore the first few days', 'Look past views', 'Then decide'].map((s, i) => (
				<Item key={s} n={i + 1} color={P.orange} size={52}>
					{s}
				</Item>
			))}
			<div style={{ marginTop: 'auto' }}>
				<Note size={62} color={P.orange} rotate={-2}>
					save this before your next title change
				</Note>
				<Body size={30} color={P.paperSoft} style={{ marginTop: 26 }}>
					Want the math done for you? backsurge.com tracks every change and gives you the before/after. Free to start.
				</Body>
			</div>
		</Col>
	</Page>
);

// ═════════════ Single images ═════════════

const CheatSheet: React.FC = () => {
	const box = (g: G, name: string, todo: string) => (
		<div style={{ border: `6px solid ${groupColorOnInk[g]}`, padding: 32, minHeight: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
			<div style={{ fontSize: 44, fontWeight: 900, color: groupColorOnInk[g], letterSpacing: '-0.03em' }}>{name}</div>
			<div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.2, color: P.paper }}>{todo}</div>
		</div>
	);
	return (
		<Page theme="ink">
			<Col gap={30}>
				<Big size={104}>
					The 4 types of
					<br />
					<span style={{ color: P.orange }}>YouTube videos.</span>
				</Big>
				<Body size={34} color={P.paperSoft}>
					Sort every video by views per day and engagement. Then:
				</Body>
				<div style={{ position: 'relative', paddingLeft: 56, paddingBottom: 56, marginTop: 6 }}>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
						{box('hidden_gem', 'Hidden gems', 'Repackage: new title or thumbnail')}
						{box('star', 'Stars', "Don't touch. Make a follow-up")}
						{box('underperformer', 'Underperformers', 'One new angle, or let go')}
						{box('wide_reach', 'Wide reach', 'Fix the intro, add chapters')}
					</div>
					<div style={{ position: 'absolute', left: 0, top: 0, bottom: 56, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<span style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', fontSize: 28, fontWeight: 800, color: P.paperSoft }}>engagement →</span>
					</div>
					<div style={{ position: 'absolute', left: 56, right: 0, bottom: 0, textAlign: 'center', fontSize: 28, fontWeight: 800, color: P.paperSoft }}>views per day →</div>
				</div>
				<Note size={54} color={P.orange} rotate={-2} style={{ marginTop: 'auto' }}>
					start top left. that's where the easy wins are.
				</Note>
			</Col>
		</Page>
	);
};

const GemChecklist: React.FC = () => (
	<Page theme="paper">
		<Col gap={34}>
			<Tag bg={P.hidden_gem} fg={P.paper} style={{ alignSelf: 'flex-start' }}>
				Checklist
			</Tag>
			<Big size={116}>
				Is it a <span style={{ color: P.hidden_gem }}>hidden gem</span>?
			</Big>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginTop: 10 }}>
				{[
					['More likes & comments per view than your average', true],
					['Fewer views per day than your average', true],
					["The title doesn't use words people search", true],
					["The thumbnail is hard to read on a phone", false]
				].map(([s, c], i) => (
					<div key={String(s)} style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
						<CheckBox checked={c as boolean} size={60} seed={i + 30} />
						<span style={{ fontSize: 42, fontWeight: 750, lineHeight: 1.2, letterSpacing: '-0.015em' }}>{s}</span>
					</div>
				))}
			</div>
			<div style={{ marginTop: 'auto', borderTop: `5px solid ${P.ink}`, paddingTop: 30 }}>
				<Body size={46} style={{ fontWeight: 850, letterSpacing: '-0.02em' }}>
					3+ ticks? <Hi>New title first.</Hi> Wait two weeks. Then try the thumbnail.
				</Body>
			</div>
		</Col>
	</Page>
);

const DayOne: React.FC = () => (
	<Page theme="orange">
		<Col gap={40} style={{ justifyContent: 'center' }}>
			<Big size={200} style={{ lineHeight: 0.86 }}>
				Day 1
				<br />
				numbers
				<br />
				lie.
			</Big>
			<div>
				<Underline w={520} color={P.ink} seed={7} />
			</div>
			<Body size={46} color={P.ink} style={{ fontWeight: 750, maxWidth: 860 }}>
				YouTube's analytics can lag 2–3 days. Changed a title or thumbnail? Wait a full week before you judge it.
			</Body>
			<Note size={70} rotate={-4} style={{ marginTop: 20 }}>
				seriously. wait.
			</Note>
		</Col>
	</Page>
);

const OneChange: React.FC = () => (
	<Page theme="paper">
		<Col gap={34}>
			<Big size={96}>New title + new thumbnail on the same day =</Big>
			<div style={{ position: 'relative', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<span style={{ fontSize: 400, fontWeight: 900, color: P.orange, lineHeight: 1 }}>?</span>
				<Circle w={420} h={400} seed={12} color={P.ink} width={9} style={{ left: 246, top: 10 }} />
			</div>
			<Body size={48} style={{ fontWeight: 850, letterSpacing: '-0.02em' }}>
				You'll never know which one worked.
			</Body>
			<Body size={38} color={P.inkSoft} style={{ marginTop: 'auto' }}>
				<Hi>Change one.</Hi> Wait two weeks. Then the other.
			</Body>
		</Col>
	</Page>
);

/** Every post: id → component. Carousels are numbered slides. */
export const POSTS: { id: string; component: React.FC }[] = [
	{ id: 'post-types-1', component: TypesCover },
	{ id: 'post-types-2', component: TypesMap },
	{ id: 'post-types-3', component: () => <TypeSlide g="star" /> },
	{ id: 'post-types-4', component: () => <TypeSlide g="hidden_gem" /> },
	{ id: 'post-types-5', component: () => <TypeSlide g="wide_reach" /> },
	{ id: 'post-types-6', component: () => <TypeSlide g="underperformer" /> },
	{ id: 'post-types-7', component: TypesEnd },
	{ id: 'post-test-1', component: TestCover },
	{ id: 'post-test-2', component: TestRule1 },
	{ id: 'post-test-3', component: TestRule2 },
	{ id: 'post-test-4', component: TestRule3 },
	{ id: 'post-test-5', component: TestRule4 },
	{ id: 'post-test-6', component: TestRule5 },
	{ id: 'post-test-7', component: TestEnd },
	{ id: 'post-single-cheatsheet', component: CheatSheet },
	{ id: 'post-single-gem-checklist', component: GemChecklist },
	{ id: 'post-single-day-one', component: DayOne },
	{ id: 'post-single-one-change', component: OneChange }
];
