import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { Camera, type Rect } from '../components/Camera';
import { Notify, PHONE_W, PhoneEdit, TimeSkip, Toast } from '../components/overlays';
import { Thumb } from '../components/Thumb';
import { cueFrame } from '../cues';
import { NEVER } from '../dashboard/anim';
import { Changes, changesLayout, changesToasts } from '../dashboard/Changes';
import { Overview, overviewLayout } from '../dashboard/Overview';
import { VideoPage, videoLayout, videoToasts } from '../dashboard/VideoPage';
import { useLayout, type Format } from '../layout';
import type { SceneOf, SceneProps, Word } from '../schema';

// A dashboard page (mock data) filmed by a camera: shots say where to look,
// beats say when things happen on the page. Region names per page:
//   overview: full, page, title, stats, stat-tracking, map, map-plot, legend, tracking, tracking-row, videos
//   changes:  full, page, title, cardA, cardA-top, cardA-table, cardA-box, cardA-verdict, cardB, cardB-thumbs, cardB-footer
//   video:    full, page, header, stats, chart, form, form-input, history, form+history

const PAGES = {
	overview: { layout: overviewLayout, Page: Overview, toasts: (_b: Record<string, number>, _o?: object) => [] as { at: number; text: string }[] },
	changes: { layout: changesLayout, Page: Changes, toasts: changesToasts },
	video: { layout: videoLayout, Page: VideoPage, toasts: videoToasts }
};

/** Dashboard canvas width per format: narrower on phones so text stays readable. */
export const canvasWidth = (format: Format) => (format === 'wide' ? 1280 : format === 'square' ? 760 : 680);

/** Beat name → frame, resolved against the scene's voiceover. */
export function resolveBeats(scene: SceneOf<'dashboard'>, words: Word[] | undefined, fps: number) {
	const out: Record<string, number> = {};
	for (const [k, v] of Object.entries(scene.beats)) {
		const f = cueFrame(v, words, fps, NEVER);
		if (f < NEVER) out[k] = f;
	}
	return out;
}

export const DashboardScene: React.FC<SceneProps<'dashboard'>> = ({ scene, words }) => {
	const { fps } = useVideoConfig();
	const { format, content, height } = useLayout();
	const W = canvasWidth(format);
	const page = PAGES[scene.page];
	const L = page.layout(W);
	const vw = content.width;
	const vh = content.height;
	const regions: Record<string, Rect> = {
		...L.regions,
		full: { x: 0, y: 0, w: W, h: Math.min(L.H, (W * vh) / vw) },
		page: { x: 0, y: 0, w: W, h: L.H }
	};
	const beats = resolveBeats(scene, words, fps);
	const shots = scene.shots.map((s) => ({
		frame: cueFrame(s.at, words, fps, 0),
		rect: regions[s.focus] ?? regions.full,
		enter: s.enter
	}));
	// Toasts from beats that happened before this scene are already gone.
	const opts = { mode: scene.form, highlight: scene.highlight };
	const toasts = page.toasts(beats, opts).filter((t) => t.at > -40);
	const Page = page.Page;
	const notifyAt = scene.notify ? cueFrame(scene.notify.at, words, fps, NEVER) : NEVER;
	const editAt = scene.edit ? cueFrame(scene.edit.at, words, fps, 0) : NEVER;
	const editOut = scene.edit ? cueFrame(scene.edit.out, words, fps, editAt + 90) : NEVER;
	const phoneLeft = format === 'vertical' ? (content.left + content.right - PHONE_W) / 2 : content.right - PHONE_W - 40;
	const phoneTop = format === 'vertical' ? content.top + 190 : content.top + 50;

	// Fade the dashboard out towards the top and bottom of the frame, so zoomed
	// shots can run past the content box without hard edges.
	const fadeTop = Math.max(0, content.top - 120);
	const fadeBottom = Math.min(height, content.bottom + 90);
	const vMask = `linear-gradient(to bottom, transparent ${fadeTop}px, black ${content.top + 20}px, black ${content.bottom - 30}px, transparent ${fadeBottom}px)`;
	// ...and soften the sides, so tight zooms fade out instead of cutting words off hard.
	const hMask = `linear-gradient(to right, transparent ${Math.max(0, content.left - 60)}px, black ${content.left + 30}px, black ${content.right - 30}px, transparent ${content.right + 60}px)`;
	const mask = `${vMask}, ${hMask}`;

	return (
		<AbsoluteFill>
			<AbsoluteFill style={{ maskImage: mask, WebkitMaskImage: mask, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }}>
				<div style={{ position: 'absolute', left: content.left, top: content.top, width: vw, height: vh }}>
					<Camera canvas={{ w: W, h: L.H }} viewport={{ w: vw, h: vh }} shots={shots} pad={0.96}>
						<Page W={W} beats={beats} opts={opts} />
					</Camera>
				</div>
			</AbsoluteFill>
			{toasts.map((t) => (
				<Toast key={t.at} at={t.at} text={t.text} bottom={content.bottom - 130} />
			))}
			{scene.page === 'changes' && beats.ff !== undefined && <TimeSkip at={beats.ff} text="12 days later" top={content.top + 30} />}
			{scene.edit && (
				<PhoneEdit
					at={editAt}
					out={editOut}
					oldTitle={scene.edit.old}
					newTitle={scene.edit.new}
					left={phoneLeft}
					top={phoneTop}
					thumb={<Thumb seed={0} width={PHONE_W - 66} />}
				/>
			)}
			{scene.notify && notifyAt < NEVER && (
				<Notify at={notifyAt} title={scene.notify.title} text={scene.notify.text} top={content.top + 10} width={Math.min(900, vw)} />
			)}
		</AbsoluteFill>
	);
};
