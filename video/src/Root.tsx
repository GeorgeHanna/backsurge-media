import '@fontsource-variable/inter';
import '@fontsource/caveat/700.css';
import React from 'react';
import { Composition, continueRender, delayRender, Still } from 'remotion';
import { POSTS } from './posts/posts';
import { LAUNCH, LaunchShort } from './launch/LaunchShort';
import { CHANGE_HISTORY, ChangeHistory, DID_IT_WORK, DidItWork, VIEWS_STUCK, ViewsStuck, WHICH_VIDEOS, WhichVideos } from './flat/clips';
import { TerminalVideo } from './styles/terminal/TerminalVideo';
import searchTerms from './styles/terminal/search-terms.timeline.json';
import { ThumbSheet } from './components/ThumbSheet';
import { CastSheet } from './kid/cast';
import { POST } from './posts/kit';
import { videos } from '../videos';
import { FORMATS } from './layout';
import { videoSchema, type VideoProps } from './schema';
import { calculateMetadata, Video } from './Video';

// Hold the first frame until Inter has loaded, so no frame renders in a fallback font.
const fontHandle = typeof document !== 'undefined' ? delayRender('Loading Inter') : null;
if (fontHandle !== null) {
	Promise.all([
		document.fonts.load('900 100px "Inter Variable"'),
		document.fonts.load('500 100px "Inter Variable"'),
		document.fonts.load('700 100px "Caveat"'),
		document.fonts.load('800 100px "Bricolage Grotesque Variable"')
	]).finally(() => continueRender(fontHandle));
}

/** One composition per video script per format, e.g. "explainer-vertical". */
export const RemotionRoot: React.FC = () => (
	<>
		{videos.map((raw) => {
			const script = videoSchema.parse(raw);
			return script.formats.map((format) => (
				<Composition<any, VideoProps>
					key={`${script.id}-${format}`}
					id={`${script.id}-${format}`}
					component={Video}
					width={FORMATS[format].width}
					height={FORMATS[format].height}
					fps={30}
					durationInFrames={300}
					defaultProps={{ script }}
					calculateMetadata={calculateMetadata}
				/>
			));
		})}
		<Still id="thumbs-sheet" component={ThumbSheet} width={1920} height={760} />
		<Still id="cast-sheet" component={CastSheet} width={1080} height={1920} />
		{/* The channel launch Short: text + sound effects only (npm run preview -- launch). */}
		<Composition id="launch-vertical" component={LaunchShort} width={1080} height={1920} fps={LAUNCH.fps} durationInFrames={LAUNCH.frames} defaultProps={{ music: true, musicVolume: 0.5 }} />
		{/* Flat-style Shorts (src/flat/clips.tsx): npm run make -- did-it-work | which-videos | change-history | views-stuck */}
		{(
			[
				['did-it-work', DidItWork, DID_IT_WORK.frames],
				['which-videos', WhichVideos, WHICH_VIDEOS.frames],
				['change-history', ChangeHistory, CHANGE_HISTORY.frames],
				['views-stuck', ViewsStuck, VIEWS_STUCK.frames]
			] as const
		).flatMap(([id, C, frames]) => [
			<Composition key={id} id={`${id}-vertical`} component={C} width={1080} height={1920} fps={30} durationInFrames={frames} defaultProps={{ music: true }} />,
			<Composition key={`${id}-nm`} id={`${id}-nomusic-vertical`} component={C} width={1080} height={1920} fps={30} durationInFrames={frames} defaultProps={{ music: false }} />
		])}
		{/* Terminal-style videos (src/styles/terminal/): python3 tools/styles/terminal_build.py <id>, then render <id>-wide. */}
		<Composition id="search-terms-wide" component={TerminalVideo} width={1920} height={1080} fps={30} durationInFrames={searchTerms.durationInFrames} defaultProps={{ timeline: searchTerms }} />
		<Composition id="launch-nomusic-vertical" component={LaunchShort} width={1080} height={1920} fps={LAUNCH.fps} durationInFrames={LAUNCH.frames} defaultProps={{ music: false }} />
		{/* Image posts: carousels and single images (npm run posts). */}
		{POSTS.map((p) => (
			<Still key={p.id} id={p.id} component={p.component} width={POST.w} height={POST.h} />
		))}
	</>
);
