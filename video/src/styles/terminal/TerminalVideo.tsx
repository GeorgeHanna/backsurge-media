// "Terminal" style: a retro phosphor-green diagnostic terminal on a CRT.
// Data comes from <id>.timeline.json, written by tools/styles/terminal_build.py
// (voice, music, sound effects and timing). Brand colours only on the end card.
import '@fontsource/vt323/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/700.css';
import React from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { color } from '../../brand';
import { LogoMark } from '../../components/ui';

export const T = {
	bg: '#03110c',
	glow: '#0b2a1e',
	fg: '#8cffc1',
	dim: '#4f9c78',
	err: '#ff4f8b',
	warn: '#f4f1a6',
	prompt: '#f4f1a6'
};
const MONO = '"IBM Plex Mono", monospace';
const VT = '"VT323", monospace';

type Line = { kind: string; text: string; t: number; type: number };
type Scene = { start: number; dur: number; head?: string | null; end?: boolean; lines: Line[] };
export type Timeline = {
	id: string;
	fps: number;
	durationInFrames: number;
	audio: string;
	scenes: Scene[];
	captions: { text: string; start: number; end: number }[];
};

const fontHandle = typeof document !== 'undefined' ? delayRender('terminal fonts') : null;
if (fontHandle !== null) {
	Promise.all([document.fonts.load('400 100px "VT323"'), document.fonts.load('500 40px "IBM Plex Mono"'), document.fonts.load('700 40px "IBM Plex Mono"')]).finally(() =>
		continueRender(fontHandle)
	);
}

const glowText = (c: string, r = 14) => `0 0 ${r}px ${c}aa, 0 0 ${r * 3}px ${c}44`;

const Cursor: React.FC<{ t: number; size: number; c?: string }> = ({ t, size, c = T.fg }) => (
	<span
		style={{
			display: 'inline-block',
			width: size * 0.5,
			height: size * 0.85,
			marginLeft: 6,
			verticalAlign: 'middle',
			background: c,
			opacity: Math.floor(t * 2.4) % 2 === 0 ? 1 : 0,
			boxShadow: glowText(c, 8)
		}}
	/>
);

const LineView: React.FC<{ line: Line; t: number; showCursor: boolean }> = ({ line, t, showCursor }) => {
	const since = t - line.t;
	if (since < 0) return null;
	const n = line.type > 0 ? Math.min(line.text.length, Math.floor((since / line.type) * line.text.length)) : line.text.length;
	const typing = line.type > 0 && n < line.text.length;
	const text = line.text.slice(0, n);
	const pop = interpolate(since, [0, 0.12], [1.12, 1], { extrapolateRight: 'clamp' });
	const k = line.kind;

	if (k === 'hook' || k === 'hookerr') {
		const shake = k === 'hookerr' ? Math.sin(since * 90) * interpolate(since, [0, 0.35], [14, 0], { extrapolateRight: 'clamp' }) : 0;
		const c = k === 'hookerr' ? T.err : T.fg;
		return (
			<div style={{ fontFamily: VT, fontSize: 190, lineHeight: 0.95, color: c, textShadow: glowText(c, 18), transform: `translateX(${shake}px) scale(${k === 'hookerr' ? pop : 1})`, transformOrigin: 'left center' }}>
				{text}
			</div>
		);
	}
	if (k === 'errbig' || k === 'okbig') {
		const c = k === 'errbig' ? T.err : T.fg;
		const blink = k === 'errbig' && since < 1.2 ? (Math.floor(since * 6) % 2 === 0 ? 1 : 0.35) : 1;
		return (
			<div style={{ marginTop: 26, display: 'inline-block', transform: `scale(${pop})`, transformOrigin: 'left center' }}>
				<span style={{ fontFamily: VT, fontSize: k === 'errbig' ? 230 : 104, whiteSpace: 'nowrap', lineHeight: 1, padding: '0 28px', background: c, color: T.bg, opacity: blink, boxShadow: `0 0 60px ${c}88` }}>
					{text}
				</span>
			</div>
		);
	}
	if (k === 'table' || k === 'row' || k === 'row1') {
		const hi = k === 'row1';
		const slide = interpolate(since, [0, 0.18], [-30, 0], { extrapolateRight: 'clamp' });
		return (
			<div
				style={{
					fontFamily: VT,
					fontSize: 88,
					whiteSpace: 'pre',
					lineHeight: 1.15,
					color: hi ? T.bg : k === 'table' ? T.warn : T.fg,
					background: hi ? T.fg : 'transparent',
					textShadow: hi ? 'none' : glowText(k === 'table' ? T.warn : T.fg, 10),
					borderBottom: k === 'table' ? `3px dashed ${T.dim}` : 'none',
					padding: '0 16px',
					marginBottom: k === 'table' ? 14 : 2,
					transform: `translateX(${slide}px)`,
					boxShadow: hi ? `0 0 40px ${T.fg}66` : 'none'
				}}
			>
				{text}
			</div>
		);
	}
	if (k === 'check') {
		const ticked = since > 0.7;
		return (
			<div style={{ fontFamily: VT, fontSize: 110, lineHeight: 1.2, color: ticked ? T.fg : T.dim, textShadow: glowText(T.fg, 10), whiteSpace: 'pre' }}>
				{ticked ? text.replace('[ ]', '[x]') : text}
			</div>
		);
	}
	const c = k === 'err' ? T.err : k === 'warn' ? T.warn : k === 'dim' ? T.dim : T.fg;
	const prefix = k === 'cmd' ? '> ' : k === 'ok' ? '[OK] ' : k === 'warn' ? '[!] ' : '';
	const size = k === 'dim' ? 70 : 92;
	return (
		<div style={{ fontFamily: VT, fontSize: size, lineHeight: 1.2, color: c, textShadow: glowText(c, 10), whiteSpace: 'pre', marginTop: k === 'err' ? 18 : 0 }}>
			{prefix && <span style={{ color: k === 'cmd' ? T.prompt : c, textShadow: glowText(k === 'cmd' ? T.prompt : c, 10) }}>{prefix}</span>}
			{text}
			{(typing || showCursor) && <Cursor t={since} size={size} c={c} />}
		</div>
	);
};

const EndCard: React.FC<{ t: number; dur: number }> = ({ t }) => {
	const a = interpolate(t, [0.15, 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const up = interpolate(t, [0.15, 0.6], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	return (
		<AbsoluteFill style={{ background: color.bg, alignItems: 'center', justifyContent: 'center', gap: 44, fontFamily: '"Inter Variable", sans-serif' }}>
			<div style={{ opacity: a, transform: `translateY(${up}px)`, display: 'flex', alignItems: 'center', gap: 30 }}>
				<LogoMark size={130} />
				<span style={{ fontSize: 110, fontWeight: 800, letterSpacing: '-0.03em', color: color.fg }}>backsurge</span>
			</div>
			<div style={{ opacity: a, fontSize: 52, fontWeight: 600, color: color.fgSoft, transform: `translateY(${up * 1.4}px)`, textAlign: 'center', lineHeight: 1.3 }}>
				Logs every title change.
				<br />
				Shows which one moved your views.
			</div>
			<div style={{ opacity: interpolate(t, [0.6, 0.9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), fontSize: 64, fontWeight: 800, padding: '22px 54px', borderRadius: 22, background: color.surge, color: '#111', boxShadow: `0 0 80px ${color.surgeGlow}` }}>
				backsurge.com
			</div>
		</AbsoluteFill>
	);
};

export const TerminalVideo: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const time = frame / fps;
	const si = Math.max(0, timeline.scenes.findIndex((s) => time >= s.start && time < s.start + s.dur));
	const scene = timeline.scenes[si];
	const t = time - scene.start;
	const cap = timeline.captions.find((c) => time >= c.start - 0.05 && time <= c.end + 0.25);

	// scan-in at each scene start, RGB glitch in the last frames before a cut
	const scan = si === 0 ? 1 : interpolate(t, [0, 0.22], [0, 1], { extrapolateRight: 'clamp' });
	const toEnd = scene.dur - t;
	const glitch = toEnd < 0.13 && !scene.end ? 1 : 0;
	const flicker = 0.97 + 0.03 * Math.sin(frame * 2.1) * Math.sin(frame * 0.37);
	const visible = scene.lines.filter((l) => t >= l.t);
	const lastIdx = visible.length - 1;
	const isHook = si === 0;

	return (
		<AbsoluteFill style={{ background: '#000' }}>
			<Audio src={staticFile(timeline.audio)} />
			{scene.end ? (
				<>
					<EndCard t={t} dur={scene.dur} />
					{/* CRT shut-off flash into the brand card */}
					<AbsoluteFill style={{ pointerEvents: 'none', alignItems: 'center', justifyContent: 'center' }}>
						<div
							style={{
								width: '100%',
								height: interpolate(t, [0, 0.12], [1080, 4], { extrapolateRight: 'clamp' }),
								background: T.fg,
								opacity: interpolate(t, [0.1, 0.25], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
								boxShadow: `0 0 80px ${T.fg}`
							}}
						/>
					</AbsoluteFill>
				</>
			) : (
				<AbsoluteFill
					style={{
						background: `radial-gradient(ellipse at 50% 45%, ${T.glow} 0%, ${T.bg} 62%, #010604 100%)`,
						opacity: flicker,
						filter: glitch ? 'saturate(1.6)' : undefined
					}}
				>
					{/* top status bar */}
					<div
						style={{
							position: 'absolute',
							top: 50,
							left: 120,
							right: 120,
							display: 'flex',
							justifyContent: 'space-between',
							fontFamily: MONO,
							fontWeight: 500,
							fontSize: 28,
							color: T.dim,
							letterSpacing: '0.08em',
							borderBottom: `2px solid ${T.dim}55`,
							paddingBottom: 14
						}}
					>
						<span>{scene.head ?? 'CHANNEL DIAGNOSTIC // tty1'}</span>
						<span>
							{String(Math.floor(time / 60)).padStart(2, '0')}:{String(Math.floor(time % 60)).padStart(2, '0')}.{String(frame % fps).padStart(2, '0')}
						</span>
					</div>
					{/* lines */}
					<div
						style={{
							position: 'absolute',
							left: 140,
							right: 120,
							top: isHook ? 240 : 210,
							clipPath: `inset(0 0 ${(1 - scan) * 100}% 0)`,
							transform: glitch ? `translateX(${frame % 2 ? 10 : -10}px)` : undefined,
							textShadow: glitch ? `6px 0 ${T.err}, -6px 0 #3cf` : undefined
						}}
					>
						{visible.map((l, i) => (
							<LineView key={i} line={l} t={t} showCursor={i === lastIdx && !isHook} />
						))}
					</div>
					{/* scan bar during scan-in */}
					{scan < 1 && <div style={{ position: 'absolute', left: 0, right: 0, top: `${scan * 100}%`, height: 6, background: T.fg, boxShadow: `0 0 40px ${T.fg}` }} />}
				</AbsoluteFill>
			)}
			{/* captions: full lines */}
			{cap && !scene.end && (
				<div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', justifyContent: 'center' }}>
					<div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 44, color: '#fff', background: 'rgba(0,0,0,0.78)', padding: '12px 28px', borderRadius: 6, maxWidth: 1600, textAlign: 'center' }}>
						{cap.text}
					</div>
				</div>
			)}
			{cap && scene.end && (
				<div style={{ position: 'absolute', left: 0, right: 0, bottom: 70, display: 'flex', justifyContent: 'center' }}>
					<div style={{ fontFamily: '"Inter Variable", sans-serif', fontWeight: 600, fontSize: 36, color: color.fgSoft }}>{cap.text}</div>
				</div>
			)}
			{/* CRT: scanlines + vignette over everything */}
			<AbsoluteFill
				style={{
					pointerEvents: 'none',
					background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 5px)',
					opacity: scene.end ? 0.25 : 1
				}}
			/>
			<AbsoluteFill style={{ pointerEvents: 'none', boxShadow: 'inset 0 0 260px rgba(0,0,0,0.85)', borderRadius: scene.end ? 0 : 40 }} />
		</AbsoluteFill>
	);
};
