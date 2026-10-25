import { z } from 'zod';

// A video is a JSON script in videos/<id>.json: a list of scenes, each with
// optional voiceover (vo) and sound cues. Scene types map to src/scenes/*.

const sfxName = z.enum(['whoosh', 'pop', 'click', 'tick', 'ding', 'notify', 'riser', 'impact', 'swipe', 'count', 'cricket', 'boing', 'scratch', 'paper', 'sparkle', 'wave']);
export type SfxName = z.infer<typeof sfxName>;

/** Seconds into the scene, or "@word" / "@word:2" / "@word+0.3" (see src/cues.ts). */
const cue = z.union([z.number(), z.string()]);

const base = {
	vo: z.string().optional(), // voiceover line, spoken by TTS and shown as captions
	seconds: z.number().optional(), // minimum length; voiceover can make it longer
	sfx: z.array(z.object({ name: sfxName, at: cue.default(0), volume: z.number().optional() })).optional(),
	// "cut": no exit/enter motion or whoosh, for scenes that continue the previous one
	transition: z.enum(['default', 'cut']).optional(),
	captions: z.boolean().optional() // default: on, except hook and end scenes (their text is already on screen)
};

const cluster = z.enum(['star', 'hidden_gem', 'wide_reach', 'underperformer']);

export const sceneSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('hook'),
		lines: z.array(z.string()).min(1),
		accent: z.array(z.number()).optional(), // indexes of lines drawn in brand orange
		kicker: z.string().optional(), // small label above, e.g. "For YouTube creators"
		visual: z.enum(['title-swap', 'quadrants', 'views-drop', 'map', 'retention']).optional(),
		focus: cluster.optional(), // for visual "map": the group to light up
		...base
	}),
	z.object({ type: z.literal('text'), title: z.string(), subtitle: z.string().optional(), kicker: z.string().optional(), ...base }),
	z.object({
		type: z.literal('steps'),
		title: z.string().optional(),
		steps: z.array(z.object({ title: z.string(), text: z.string() })),
		...base
	}),
	z.object({
		type: z.literal('change'),
		videoTitle: z.string(),
		field: z.enum(['title', 'thumbnail', 'description']),
		before: z.string(),
		after: z.string(),
		source: z.string().default('YouTube Studio'),
		...base
	}),
	z.object({ type: z.literal('alert'), subject: z.string(), preview: z.string(), action: z.string().optional(), ...base }),
	z.object({
		type: z.literal('chart'),
		videoTitle: z.string(),
		changes: z.array(z.object({ day: z.number(), label: z.string(), lift: z.number() })),
		...base
	}),
	z.object({
		type: z.literal('verdict'),
		videoTitle: z.string(),
		days: z.number().default(14),
		metrics: z.array(z.object({ label: z.string(), before: z.number(), after: z.number(), unit: z.string().optional() })),
		verdict: z.enum(['winning', 'losing', 'too_early']),
		undo: z.boolean().optional(),
		...base
	}),
	z.object({
		// The library map. Builds up (axes, dots, groups) unless build is false.
		type: z.literal('map'),
		title: z.string().optional(),
		focus: cluster.optional(),
		focusAt: cue.optional(),
		build: z.boolean().default(true),
		// When the four groups light up (default: when the voiceover says "four").
		groupsAt: cue.optional(),
		...base
	}),
	z.object({
		// Zooms the library map into one group and explains it. Chain several with transition "cut".
		type: z.literal('quadrant'),
		cluster,
		meaning: z.string(),
		fixes: z.array(z.object({ text: z.string(), at: cue.optional() })),
		...base
	}),
	z.object({
		// The Backsurge dashboard (mock data), filmed with camera moves.
		type: z.literal('dashboard'),
		page: z.enum(['overview', 'changes', 'video']),
		// Camera: where to look, and when. focus = a region of the page (see src/dashboard/*).
		shots: z.array(z.object({ at: cue, focus: z.string(), enter: z.enum(['tilt', 'rise']).optional() })).default([{ at: 0, focus: 'full' }]),
		// When page events happen (page-specific, see src/dashboard/*).
		beats: z.record(z.string(), cue).default({}),
		// Phone-style email notification sliding in.
		notify: z.object({ at: cue, title: z.string(), text: z.string() }).optional(),
		// A phone editing the title somewhere else (old → new), sliding away at "out".
		edit: z.object({ at: cue, out: cue, old: z.string(), new: z.string() }).optional(),
		// video page: what the form does (title change, or logging a manual change like chapters)
		form: z.enum(['title', 'manual']).optional(),
		// overview: which group lights up on the "highlight" beat (default hidden gems)
		highlight: cluster.optional(),
		...base
	}),
	z.object({ type: z.literal('features'), title: z.string().optional(), items: z.array(z.string()), ...base }),
	z.object({
		type: z.literal('end'),
		kicker: z.string().optional(), // small label above the headline; default "For YouTube creators", "" hides it
		headline: z.string().optional(),
		cta: z.string().optional(),
		sub: z.string().optional(),
		follow: z.boolean().optional(), // "Follow for more" variant for socials
		...base
	})
]);
export type Scene = z.infer<typeof sceneSchema>;
export type SceneOf<T extends Scene['type']> = Extract<Scene, { type: T }>;
export type Cluster = z.infer<typeof cluster>;

export const videoSchema = z.object({
	id: z.string(),
	title: z.string(),
	formats: z.array(z.enum(['vertical', 'square', 'wide'])).default(['vertical', 'square', 'wide']),
	voice: z.object({ voice: z.string(), speed: z.number() }).partial().optional(),
	// track 'midi': music composed for this video's timeline (npm run music -- <id>); style picks the feel.
	music: z
		.object({ track: z.enum(['midi', 'drive', 'chill', 'pulse']), style: z.enum(['drive', 'chill', 'pulse', 'quirky']).optional(), volume: z.number().default(0.22) })
		.optional(),
	captions: z.boolean().default(true),
	scenes: z.array(sceneSchema)
});
export type VideoScript = z.infer<typeof videoSchema>;

// Written by tools/audio.py voice <id> to public/generated/<id>/manifest.json
export type Word = { text: string; start: number; end: number };
export type VoiceManifest = { id: string; scenes: ({ file: string; duration: number; words: Word[] } | null)[] };

// Computed in calculateMetadata and passed to the composition.
export type Timeline = { from: number; frames: number; voice: { file: string; words: Word[] } | null }[];

export type VideoProps = { script: VideoScript; timeline?: Timeline; preview?: boolean };

/** What every scene component gets. */
export type SceneProps<T extends Scene['type']> = {
	scene: SceneOf<T>;
	frames: number;
	words?: Word[];
	/** The scene before this one, for scenes that continue it (camera continuity). */
	prev?: Scene;
};
