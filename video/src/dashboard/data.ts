// Mock data for the dashboard mockups: a made-up filmmaking / creator-gear
// channel, "Frame Rate". Numbers are illustrative.

export const channel = { name: 'Frame Rate', initials: 'FR' };

export const overview = {
	videos: 148,
	tracking: 6,
	due: 2,
	groups: { star: 37, hidden_gem: 31, wide_reach: 36, underperformer: 44 }
};

/** "Changes we're tracking" on the overview. The first row is the one "spotted" in videos. */
export const tracked = [
	{ seed: 0, title: 'How I light my videos for $40', meta: 'My lighting setup · spotted on YouTube · day 0' },
	{ seed: 3, title: 'Best mic under $100 (blind test)', meta: 'spotted on YouTube · day 9' },
	{ seed: 2, title: 'Why your videos look cheap (5 fixes)', meta: 'Why your videos look cheap · day 12' },
	{ seed: 6, title: 'New thumbnail: red circle on the mic', meta: 'Fix bad audio in 60 seconds · day 20' },
	{ seed: 7, title: 'Color grading in 5 minutes', meta: 'Color grading for beginners · spotted on YouTube · day 23' }
];

export const videos = [
	{ seed: 0, title: 'How I light my videos for $40', date: 'Mar 3, 2024', tracking: true },
	{ seed: 1, title: 'Budget camera vs $3,000 camera', date: 'Feb 18, 2024', tracking: false },
	{ seed: 3, title: 'Best mic under $100 (blind test)', date: 'Jan 29, 2024', tracking: true },
	{ seed: 4, title: 'I edited every day for 30 days', date: 'Jan 7, 2024', tracking: false },
	{ seed: 2, title: 'Why your videos look cheap (5 fixes)', date: 'Dec 12, 2023', tracking: true },
	{ seed: 7, title: 'Color grading in 5 minutes', date: 'Nov 20, 2023', tracking: true }
];

/** Experiment A: a title change, spotted on YouTube, that wins. */
export const expA = {
	videoTitle: 'My lighting setup',
	oldTitle: 'My lighting setup',
	newTitle: 'How I light my videos for $40',
	days: 14,
	started: 'Sep 28, 2026',
	rows: [
		{ label: 'Views / day', before: 512, early: 538, after: 689, fmt: 'n' },
		{ label: 'Impressions / day', before: 9800, early: 10100, after: 11200, fmt: 'k' },
		{ label: 'Click-through rate', before: 4.1, early: 4.3, after: 5.6, fmt: '%' },
		{ label: 'Avg view duration', before: 252, early: 250, after: 260, fmt: 't' },
		{ label: 'Engagement', before: 4.8, early: 4.9, after: 5.02, fmt: '%2' }
	]
};

/** Experiment B: a thumbnail made in Backsurge that loses, and gets reverted. */
export const expB = {
	videoTitle: 'Best mic under $100 (blind test)',
	days: 14,
	started: 'Sep 21, 2026',
	rows: [
		{ label: 'Views / day', before: 640, after: 571, fmt: 'n' },
		{ label: 'Click-through rate', before: 5.2, after: 4.4, fmt: '%' },
		{ label: 'Avg view duration', before: 301, after: 296, fmt: 't' }
	]
};

/** Video page: "Why your videos look cheap". */
export const videoPage = {
	seed: 2,
	title: 'Why your videos look cheap',
	newTitle: 'Why your videos look cheap (5 fixes)',
	published: 'Dec 12, 2023',
	length: '14:07',
	stats: [
		['Views (28d)', '9.4K'],
		['Views / day', '336'],
		['Impressions (28d)', '212K'],
		['Click-through rate', '3.2%'],
		['Avg view duration', '5:41'],
		['Engagement', '4.61%']
	] as [string, string][]
};

export type MetricFmt = 'n' | 'k' | '%' | '%2' | 't';

export function fmt(v: number, f: string): string {
	switch (f) {
		case 'k':
			return v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K` : `${Math.round(v)}`;
		case '%':
			return `${v.toFixed(1)}%`;
		case '%2':
			return `${v.toFixed(2)}%`;
		case 't': {
			const s = Math.round(v);
			return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
		}
		default:
			return `${Math.round(v)}`;
	}
}

export function change(before: number, after: number): { text: string; tone: 'up' | 'down' | 'flat' } {
	const pct = Math.round(((after - before) / before) * 100);
	return { text: `${pct > 0 ? '+' : ''}${pct}%`, tone: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' };
}
