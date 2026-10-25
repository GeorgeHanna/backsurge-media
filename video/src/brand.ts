// Backsurge brand tokens for video. Mirrors frontend/src/routes/layout.css
// (oklch values converted to hex) and frontend/src/lib/format.ts.
// Change the look of every video from here.

export const color = {
	bg: '#05070b',
	bgRaised: '#0c1015', // --color-card
	surface: '#13161b', // --color-muted
	surfaceHi: '#171b22', // --color-secondary
	border: '#1d2229',
	fg: '#e4e8ef',
	fgMuted: '#6c727b',
	fgSoft: '#a3a9b3',
	surge: '#ff8918', // --color-primary, the logo orange
	surgeGlow: 'rgba(255,137,24,0.30)',
	surgeSoft: 'rgba(255,137,24,0.12)',
	green: '#43c251', // --color-trend-green
	chartLine: '#3b82f6',
	amber: '#f59e0b',
	emerald: '#10b981',
	red: '#f43f5e'
} as const;

// Library map groups, same colours and copy as the app.
export const clusters = {
	star: { label: 'Stars', color: '#22c55e', hint: 'Your best work. Do more of this.' },
	hidden_gem: { label: 'Hidden gems', color: '#f59e0b', hint: 'Loved, but hard to find.' },
	wide_reach: { label: 'Wide reach', color: '#38bdf8', hint: 'Lots of clicks, weaker hold.' },
	underperformer: { label: 'Underperformers', color: '#f43f5e', hint: 'Low on both.' }
} as const;
export type ClusterId = keyof typeof clusters;

export const verdicts = {
	winning: { label: 'Winning', color: color.emerald },
	losing: { label: 'Losing', color: color.red },
	too_early: { label: 'Too early to call', color: color.fgMuted }
} as const;
export type VerdictId = keyof typeof verdicts;

export const font = {
	family: '"Inter Variable", Inter, system-ui, sans-serif',
	mono: 'ui-monospace, "SF Mono", Menlo, monospace'
};

// One motion language for everything: springy in, quick out.
export const motion = {
	fps: 30,
	spring: { damping: 18, stiffness: 140, mass: 0.9 },
	springSoft: { damping: 22, stiffness: 90, mass: 1 },
	springPop: { damping: 11, stiffness: 180, mass: 0.7 },
	exitFrames: 8,
	stagger: 4 // frames between items appearing
};

export const brand = {
	name: 'backsurge',
	url: 'backsurge.com',
	tagline: 'Your old YouTube videos aren’t done yet.',
	audience: 'For YouTube creators',
	cta: 'Start tracking for free',
	ctaSub: 'Free plan · No credit card · 1 minute setup'
};
