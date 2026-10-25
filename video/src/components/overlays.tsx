import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { color, font } from '../brand';
import { clamp } from '../layout';
import { LogoMark } from './ui';

/** Slide-in / hold / slide-out progress for something shown at `at` for `hold` frames. */
function useShow(at: number, hold: number) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const inP = spring({ frame: frame - at, fps, config: { damping: 16, stiffness: 170, mass: 0.8 } });
	const outP = interpolate(frame - at - hold, [0, 8], [0, 1], clamp);
	return { inP, outP, visible: frame >= at && outP < 1 };
}

/** App toast, like the dashboard's ("Experiment set for 14 days"). Screen space. */
export const Toast: React.FC<{ at: number; text: string; hold?: number; bottom: number; tone?: string }> = ({
	at,
	text,
	hold = 45,
	bottom,
	tone = color.green
}) => {
	const { inP, outP, visible } = useShow(at, hold);
	if (!visible) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: bottom,
				display: 'flex',
				justifyContent: 'center',
				transform: `translateY(${(1 - inP) * 80 + outP * 30}px)`,
				opacity: Math.min(inP * 2, 1 - outP),
				zIndex: 60
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					padding: '22px 34px',
					borderRadius: 22,
					background: '#14181f',
					border: `2px solid ${color.border}`,
					boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
					fontFamily: font.family,
					fontSize: 34,
					fontWeight: 650,
					color: color.fg
				}}
			>
				<span
					style={{
						width: 40,
						height: 40,
						borderRadius: 20,
						background: tone,
						color: '#0b0d10',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 26,
						fontWeight: 900
					}}
				>
					✓
				</span>
				{text}
			</div>
		</div>
	);
};

/** Phone-style email notification sliding down from the top. Screen space. */
export const Notify: React.FC<{ at: number; title: string; text: string; top: number; width: number; hold?: number }> = ({
	at,
	title,
	text,
	top,
	width,
	hold = 70
}) => {
	const { inP, outP, visible } = useShow(at, hold);
	if (!visible) return null;
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: 0,
				right: 0,
				display: 'flex',
				justifyContent: 'center',
				transform: `translateY(${(1 - inP) * -260 - outP * 260}px)`,
				opacity: 1 - outP,
				zIndex: 70
			}}
		>
			<div
				style={{
					width,
					display: 'flex',
					gap: 24,
					padding: '26px 30px',
					borderRadius: 34,
					background: 'rgba(30,34,42,0.92)',
					backdropFilter: 'blur(20px)',
					border: '1.5px solid rgba(255,255,255,0.08)',
					boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
					fontFamily: font.family,
					color: color.fg
				}}
			>
				<div style={{ borderRadius: 16, overflow: 'hidden', width: 76, height: 76, flexShrink: 0 }}>
					<LogoMark size={76} />
				</div>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: color.fgSoft }}>
						<span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>BACKSURGE · EMAIL</span>
						<span>now</span>
					</div>
					<div style={{ fontSize: 34, fontWeight: 750, marginTop: 6, lineHeight: 1.2 }}>{title}</div>
					<div style={{ fontSize: 29, color: color.fgSoft, marginTop: 4, lineHeight: 1.3 }}>{text}</div>
				</div>
			</div>
		</div>
	);
};

/** Fast-forward icon (no emoji font needed). */
const FastForward: React.FC<{ size: number }> = ({ size }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: '-0.12em' }}>
		<path d="M2 5l9 7-9 7z M12 5l9 7-9 7z" fill="currentColor" />
	</svg>
);

/** "12 days later" time-skip badge with a fast-forward icon. Screen space. */
export const TimeSkip: React.FC<{ at: number; text: string; top: number; hold?: number }> = ({ at, text, top, hold = 40 }) => {
	const frame = useCurrentFrame();
	const { inP, outP, visible } = useShow(at, hold);
	if (!visible) return null;
	const blink = 0.75 + 0.25 * Math.sin(((frame - at) / 30) * Math.PI * 6);
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: 0,
				right: 0,
				display: 'flex',
				justifyContent: 'center',
				transform: `scale(${0.6 + 0.4 * inP})`,
				opacity: Math.min(inP * 2, 1 - outP),
				zIndex: 65
			}}
		>
			<div
				style={{
					padding: '16px 34px',
					borderRadius: 999,
					background: color.surge,
					color: '#111',
					fontFamily: font.family,
					fontWeight: 850,
					fontSize: 40,
					letterSpacing: '-0.01em',
					boxShadow: `0 0 60px ${color.surgeGlow}`
				}}
			>
				<span style={{ opacity: blink, marginRight: 12 }}>
					<FastForward size={36} />
				</span>
				{text}
			</div>
		</div>
	);
};

/**
 * A phone editing a video's title somewhere else (any app, no branding): the
 * old title is selected, the new one typed, then Save is tapped. Screen space.
 */
export const PhoneEdit: React.FC<{
	at: number;
	out: number;
	oldTitle: string;
	newTitle: string;
	left: number;
	top: number;
	thumb: React.ReactNode;
}> = ({ at, out, oldTitle, newTitle, left, top, thumb }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const inP = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 150, mass: 0.9 } });
	const outP = interpolate(frame - out, [0, 10], [0, 1], { ...clamp, easing: (t) => t * t });
	if (frame < at || outP >= 1) return null;
	const selectAt = at + 10;
	const typeAt = at + 16;
	const typed = frame < typeAt ? null : newTitle.slice(0, Math.floor((frame - typeAt) / PHONE_CHAR));
	const doneTyping = typeAt + Math.ceil(newTitle.length * PHONE_CHAR);
	const saveAt = doneTyping + 6;
	const saved = frame >= saveAt + 4;
	const tap = interpolate(frame - saveAt, [0, 12], [0, 1], clamp);
	const caret = typed !== null && !saved && Math.floor(frame / 6) % 2 === 0;
	return (
		<>
		{/* Dim the dashboard behind while the phone is up. */}
		<div style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0.5 * Math.min(1, inP) * (1 - outP), zIndex: 54 }} />
		<div
			style={{
				position: 'absolute',
				left,
				top,
				width: PHONE_W,
				height: 640,
				borderRadius: 60,
				background: '#0d1117',
				border: '7px solid #2b313b',
				boxShadow: '0 50px 120px rgba(0,0,0,0.75), 0 0 0 2px #11151b',
				transform: `translateY(${(1 - inP) * 700 + outP * 760}px) rotate(${(1 - inP) * 6 - outP * 4}deg)`,
				padding: '22px 26px',
				fontFamily: font.family,
				color: color.fg,
				zIndex: 55,
				overflow: 'hidden'
			}}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700, color: color.fgSoft }}>
				<span>9:41</span>
				<span style={{ width: 90, height: 24, borderRadius: 12, background: '#000' }} />
				<span>●●●</span>
			</div>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
				<span style={{ fontSize: 30, fontWeight: 800 }}>Edit details</span>
				<span
					style={{
						position: 'relative',
						fontSize: 24,
						fontWeight: 800,
						padding: '8px 20px',
						borderRadius: 999,
						background: saved ? color.green : '#e4e8ef',
						color: '#0b0d10'
					}}
				>
					{saved ? '✓ Saved' : 'Save'}
					{tap > 0 && tap < 1 && (
						<span
							style={{
								position: 'absolute',
								left: '50%',
								top: '50%',
								width: 110 * tap,
								height: 110 * tap,
								marginLeft: -55 * tap,
								marginTop: -55 * tap,
								borderRadius: '50%',
								background: 'rgba(255,255,255,0.35)',
								opacity: 1 - tap
							}}
						/>
					)}
				</span>
			</div>
			<div style={{ marginTop: 22 }}>{thumb}</div>
			<div style={{ fontSize: 21, color: color.fgMuted, marginTop: 22, fontWeight: 600 }}>Title</div>
			<div
				style={{
					marginTop: 8,
					padding: '14px 16px',
					borderRadius: 14,
					border: `2px solid ${frame >= selectAt && !saved ? color.surge : color.border}`,
					background: '#151a21',
					fontSize: 27,
					fontWeight: 600,
					lineHeight: 1.3,
					minHeight: 70
				}}
			>
				{typed === null ? (
					<span style={{ background: frame >= selectAt ? 'rgba(56,130,246,0.5)' : 'transparent' }}>{oldTitle}</span>
				) : (
					typed
				)}
				{caret && <span style={{ color: color.surge }}>|</span>}
			</div>
		</div>
		</>
	);
};

export const PHONE_W = 430;
export const PHONE_CHAR = 1.1;
