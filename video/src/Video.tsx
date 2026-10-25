import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig, type CalculateMetadataFunction } from 'remotion';
import { Background } from './components/Background';
import { Captions } from './components/Captions';
import { SceneShell } from './components/ui';
import { cueFrame, sequenceFrames } from './cues';
import { NEVER } from './dashboard/anim';
import { DashboardScene, resolveBeats } from './scenes/dashboard';
import { submitFrame } from './dashboard/VideoPage';
import { PHONE_CHAR } from './components/overlays';
import { End } from './scenes/end';
import { Hook, hookLineFrames } from './scenes/hook';
import { fixFrames, mapGroupsFrame, MapScene, QuadrantScene } from './scenes/map';
import { Alert, Change, Chart, TIMING, Verdict } from './scenes/product';
import { Features, Steps, Text } from './scenes/text';
import type { Scene, SceneProps, SfxName, Timeline, VideoProps, VoiceManifest, Word } from './schema';

const FPS = 30;
/** Breath after the voiceover before the next scene starts (seconds). */
const TAIL = 0.2;

/** Shortest time each scene type needs for its animation to play out (seconds). */
const MIN_SECONDS: Record<Scene['type'], number> = {
	hook: 1.8,
	text: 2,
	steps: 3.5,
	change: 3,
	alert: 2.8,
	chart: 3.2,
	verdict: 3.2,
	map: 2.6,
	quadrant: 2.6,
	dashboard: 2.4,
	features: 2.6,
	end: 2.6
};

function minFrames(scene: Scene): number {
	let f = Math.round((scene.seconds ?? MIN_SECONDS[scene.type]) * FPS);
	if (scene.type === 'change' && scene.field !== 'thumbnail')
		f = Math.max(f, TIMING.change.type + Math.ceil(scene.after.length * TIMING.change.charFrames) + 30);
	if (scene.type === 'verdict' && scene.undo) f = Math.max(f, TIMING.verdict.undo + 40);
	if (scene.type === 'hook' && scene.visual === 'title-swap') f = Math.max(f, 75);
	return f;
}

/** Latest beat/shot frame in a dashboard scene, so the scene doesn't cut it off. */
function lastCue(scene: Scene, words?: Word[]): number {
	if (scene.type !== 'dashboard') return 0;
	const frames = [...Object.values(resolveBeats(scene, words, FPS)), ...scene.shots.map((s) => cueFrame(s.at, words, FPS, 0))];
	if (scene.beats.ff !== undefined) frames.push(cueFrame(scene.beats.ff, words, FPS, 0) + 40);
	return Math.max(0, ...frames.filter((f) => f < NEVER));
}

/**
 * Works out how long each scene is. A scene lasts as long as its voiceover
 * (+ a short breath) or its own minimum, whichever is longer. Voice timings
 * come from public/generated/<id>/manifest.json (npm run prepare-video).
 */
export const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
	let manifest: VoiceManifest | null = null;
	if (props.script.scenes.some((s) => s.vo))
		try {
			const res = await fetch(staticFile(`generated/${props.script.id}/manifest.json`));
			if (res.ok) manifest = await res.json();
		} catch {
			manifest = null; // no voiceover generated yet: silent timing preview
		}
	const timeline: Timeline = [];
	let from = 0;
	props.script.scenes.forEach((scene, i) => {
		const v = scene.vo ? manifest?.scenes[i] ?? null : null;
		const frames = Math.max(minFrames(scene), v ? Math.ceil((v.duration + TAIL) * FPS) : 0, lastCue(scene, v?.words) + 24);
		timeline.push({ from, frames, voice: v ? { file: v.file, words: v.words } : null });
		from += frames;
	});
	return { durationInFrames: Math.max(from, 1), fps: FPS, props: { ...props, timeline } };
};

type Cue = { name: SfxName; at: number; volume?: number };

/** Sound cues each scene type plays on its own, in frames from scene start. */
function builtInSfx(scene: Scene, index: number, frames: number, words?: Word[]): Cue[] {
	const cues: Cue[] = [];
	if (index > 0 && scene.transition !== 'cut') cues.push({ name: index % 2 ? 'whoosh' : 'swipe', at: 0, volume: 0.22 });
	switch (scene.type) {
		case 'hook': {
			const at = hookLineFrames(scene.lines, words, FPS);
			at.forEach((f, i) => cues.push({ name: scene.accent?.includes(i) ? 'impact' : 'pop', at: f, volume: scene.accent?.includes(i) ? 0.45 : 0.35 }));
			if (scene.visual === 'title-swap') for (let k = 0; k < 18; k += 2) cues.push({ name: 'tick', at: (at[0] ?? 0) + 14 + k, volume: 0.35 });
			if (scene.visual === 'quadrants') for (let k = 0; k < 4; k++) cues.push({ name: 'pop', at: (at[0] ?? 0) + 3 + k * 4, volume: 0.35 });
			break;
		}
		case 'text':
			cues.push({ name: 'pop', at: 4, volume: 0.3 });
			break;
		case 'steps':
			sequenceFrames(scene.steps.map((s) => s.title), words, FPS, 6, Math.round((frames * 0.7) / scene.steps.length)).forEach((at) =>
				cues.push({ name: 'pop', at, volume: 0.45 })
			);
			break;
		case 'change': {
			const T = TIMING.change;
			cues.push({ name: 'swipe', at: T.strike, volume: 0.4 });
			if (scene.field === 'thumbnail') cues.push({ name: 'pop', at: T.type, volume: 0.5 });
			else for (let c = 0; c < scene.after.length; c += 3) cues.push({ name: 'tick', at: T.type + Math.round(c * T.charFrames), volume: 0.5 });
			break;
		}
		case 'alert':
			cues.push({ name: 'notify', at: TIMING.alert.in + 3, volume: 0.6 });
			if (scene.action) cues.push({ name: 'click', at: TIMING.alert.click, volume: 0.7 });
			break;
		case 'chart': {
			const T = TIMING.chart;
			scene.changes.forEach((c) => cues.push({ name: 'ding', at: Math.round(T.drawStart + (c.day / 180) * (T.drawEnd - T.drawStart)), volume: 0.35 }));
			break;
		}
		case 'verdict':
			scene.metrics.forEach((_, i) => cues.push({ name: 'count', at: 14 + i * 6, volume: 0.5 }));
			cues.push({ name: scene.verdict === 'winning' ? 'ding' : 'pop', at: TIMING.verdict.badge, volume: 0.5 });
			if (scene.undo) cues.push({ name: 'click', at: TIMING.verdict.undo, volume: 0.7 }, { name: 'swipe', at: TIMING.verdict.undo + 4, volume: 0.35 });
			break;
		case 'map':
			if (scene.build) {
				for (let i = 0; i < 6; i++) cues.push({ name: 'tick', at: 10 + i * 5, volume: 0.3 });
				cues.push({ name: 'pop', at: mapGroupsFrame(scene, words, FPS), volume: 0.45 });
			}
			if (scene.focus) cues.push({ name: 'ding', at: cueFrame(scene.focusAt, words, FPS, 60), volume: 0.35 });
			break;
		case 'quadrant':
			cues.push({ name: 'whoosh', at: 0, volume: 0.25 });
			fixFrames(scene, words, FPS).forEach((at) => cues.push({ name: 'pop', at, volume: 0.45 }));
			break;
		case 'dashboard': {
			const b = resolveBeats(scene, words, FPS);
			if (scene.shots[0]?.enter) cues.push({ name: 'riser', at: 0, volume: 0.18 });
			scene.shots.slice(1).forEach((s) => cues.push({ name: 'swipe', at: cueFrame(s.at, words, FPS, 0), volume: 0.12 }));
			if (b.stats !== undefined) cues.push({ name: 'count', at: b.stats + 4, volume: 0.4 });
			if (b.spot !== undefined) cues.push({ name: 'pop', at: b.spot, volume: 0.5 });
			const hlAt = b.highlight ?? b.gems;
			if (hlAt !== undefined) cues.push({ name: 'ding', at: hlAt, volume: 0.35 });
			if (b.click !== undefined) cues.push({ name: 'click', at: b.click, volume: 0.7 }, { name: 'pop', at: b.click + 8, volume: 0.35 });
			if (b.ff !== undefined) cues.push({ name: 'riser', at: b.ff - 6, volume: 0.3 });
			const verdict = b.verdict ?? (b.ff !== undefined ? b.ff + 28 : undefined);
			if (verdict !== undefined) cues.push({ name: 'ding', at: verdict, volume: 0.5 });
			if (b.revert !== undefined) cues.push({ name: 'click', at: b.revert, volume: 0.7 }, { name: 'swipe', at: b.revert + 6, volume: 0.35 });
			if (scene.page === 'video' && b.type !== undefined) {
				for (let k = 0; k < 38; k += 3) cues.push({ name: 'tick', at: b.type + k, volume: 0.4 });
				const submit = submitFrame(b, { mode: scene.form });
				cues.push({ name: 'click', at: submit, volume: 0.7 }, { name: 'ding', at: submit + 10, volume: 0.35 });
			}
			if (scene.notify) cues.push({ name: 'notify', at: cueFrame(scene.notify.at, words, FPS, 0), volume: 0.6 });
			if (scene.edit) {
				const at = cueFrame(scene.edit.at, words, FPS, 0);
				const typeAt = at + 16;
				const len = Math.ceil(scene.edit.new.length * PHONE_CHAR);
				cues.push({ name: 'whoosh', at, volume: 0.3 });
				for (let k = 0; k < len; k += 3) cues.push({ name: 'tick', at: typeAt + k, volume: 0.4 });
				cues.push({ name: 'click', at: typeAt + len + 6, volume: 0.7 });
				cues.push({ name: 'swipe', at: cueFrame(scene.edit.out, words, FPS, at + 90), volume: 0.3 });
			}
			break;
		}
		case 'features':
			scene.items.forEach((_, i) => cues.push({ name: 'pop', at: 8 + i * 8, volume: 0.35 }));
			break;
		case 'end':
			cues.push({ name: 'impact', at: 0, volume: 0.5 }, { name: 'pop', at: 14, volume: 0.4 });
			break;
	}
	return cues;
}

const SceneView: React.FC<SceneProps<Scene['type']>> = (props) => {
	switch (props.scene.type) {
		case 'hook':
			return <Hook {...(props as SceneProps<'hook'>)} />;
		case 'text':
			return <Text {...(props as SceneProps<'text'>)} />;
		case 'steps':
			return <Steps {...(props as SceneProps<'steps'>)} />;
		case 'change':
			return <Change {...(props as SceneProps<'change'>)} />;
		case 'alert':
			return <Alert {...(props as SceneProps<'alert'>)} />;
		case 'chart':
			return <Chart {...(props as SceneProps<'chart'>)} />;
		case 'verdict':
			return <Verdict {...(props as SceneProps<'verdict'>)} />;
		case 'map':
			return <MapScene {...(props as SceneProps<'map'>)} />;
		case 'quadrant':
			return <QuadrantScene {...(props as SceneProps<'quadrant'>)} />;
		case 'dashboard':
			return <DashboardScene {...(props as SceneProps<'dashboard'>)} />;
		case 'features':
			return <Features {...(props as SceneProps<'features'>)} />;
		case 'end':
			return <End {...(props as SceneProps<'end'>)} />;
	}
};

export const Video: React.FC<VideoProps> = ({ script, timeline = [], preview }) => {
	const { durationInFrames, fps } = useVideoConfig();
	const music = script.music;

	// Music sits under the voice: full level between lines, ducked while someone talks.
	const talkWindows = timeline
		.filter((t) => t.voice)
		.map((t) => [t.from - 4, t.from + Math.ceil((t.voice!.words.at(-1)?.end ?? 0) * fps) + 6] as const);
	const musicVolume = (f: number) => {
		if (!music) return 0;
		const talking = talkWindows.some(([a, b]) => f >= a && f <= b);
		const fade = interpolate(f, [0, 8, durationInFrames - 40, durationInFrames], [0, 1, 1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp'
		});
		return music.volume * (talking ? 0.42 : 1) * fade;
	};

	return (
		<AbsoluteFill>
			<Background preview={preview} />
			{music && (
				<Audio src={staticFile(music.track === 'midi' ? `generated/${script.id}/music.wav` : `music/${music.track}.wav`)} loop={music.track !== 'midi'} volume={musicVolume} />
			)}
			{script.scenes.map((scene, i) => {
				const t = timeline[i];
				if (!t) return null;
				const words = t.voice?.words;
				const next = script.scenes[i + 1];
				// Cues before the scene start belong to beats that "already happened": no sound.
				const cues = [
					...builtInSfx(scene, i, t.frames, words),
					...(scene.sfx ?? []).map((c) => ({ ...c, at: cueFrame(c.at, words, fps, 0) }))
				].filter((c) => c.at >= 0 && c.at < t.frames);
				const showCaptions = !!t.voice && script.captions && (scene.captions ?? !['hook', 'end'].includes(scene.type));
				return (
					<Sequence key={i} from={t.from} durationInFrames={t.frames} name={`${i} ${scene.type}`}>
						<SceneShell
							frames={t.frames}
							enter={scene.transition === 'cut' ? 0 : 7}
							exit={i === script.scenes.length - 1 || next?.transition === 'cut' ? 0 : 6}
						>
							<SceneView scene={scene} frames={t.frames} words={words} prev={script.scenes[i - 1]} />
						</SceneShell>
						{t.voice && <Audio src={staticFile(t.voice.file)} volume={1} />}
						{showCaptions && <Captions words={t.voice!.words} />}
						{cues.map((c, j) => (
							<Sequence key={j} from={c.at} durationInFrames={fps * 2} layout="none">
								<Audio src={staticFile(`sfx/${c.name}.wav`)} volume={c.volume ?? 0.5} />
							</Sequence>
						))}
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};
