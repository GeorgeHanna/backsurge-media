import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { color, font } from '../brand';
import { clamp, useEnter } from '../layout';
import { useCameraScale } from './Camera';

/** The Backsurge mark: lowercase "b" on an orange circle (same paths as Logo.svelte). */
export const LogoMark: React.FC<{ size: number }> = ({ size }) => (
	<svg width={size} height={size} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
		<circle cx="32" cy="32" r="32" fill={color.surge} />
		<path
			fill="#111111"
			d="M17.5 13H25.5V51H17.5Z M46.5 38A13 13 0 1 1 20.5 38A13 13 0 1 1 46.5 38Z M39.5 38A6 6 0 1 0 27.5 38A6 6 0 1 0 39.5 38Z"
		/>
	</svg>
);

export const Logo: React.FC<{ size?: number; wordmark?: boolean }> = ({ size = 64, wordmark = true }) => (
	<div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
		<LogoMark size={size} />
		{wordmark && (
			<span style={{ fontFamily: font.family, fontWeight: 700, fontSize: size * 0.78, letterSpacing: '-0.02em', color: color.fg }}>
				backsurge
			</span>
		)}
	</div>
);

/** Panel styled like the app's cards. */
export const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode; glow?: boolean }> = ({ style, children, glow }) => (
	<div
		style={{
			background: 'rgba(12,16,21,0.88)',
			border: `2px solid ${color.border}`,
			borderRadius: 32,
			padding: 40,
			boxShadow: glow ? `0 0 120px ${color.surgeSoft}, 0 30px 80px rgba(0,0,0,0.5)` : '0 30px 80px rgba(0,0,0,0.5)',
			...style
		}}
	>
		{children}
	</div>
);

/** Pill badge, like the app's "Title changed · +22%" chips. */
export const Pill: React.FC<{ tone: string; children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({
	tone,
	children,
	size = 30,
	style
}) => (
	<span
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 10,
			padding: `${size * 0.3}px ${size * 0.7}px`,
			borderRadius: 999,
			fontSize: size,
			fontWeight: 650,
			color: tone,
			background: `${tone}1f`,
			border: `2px solid ${tone}55`,
			whiteSpace: 'nowrap',
			...style
		}}
	>
		{children}
	</span>
);

/** Number that counts up from `from` to `to` starting at `delay`. */
export const CountUp: React.FC<{ from?: number; to: number; delay?: number; decimals?: number; prefix?: string; suffix?: string }> = ({
	from = 0,
	to,
	delay = 0,
	decimals = 0,
	prefix = '',
	suffix = ''
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const t = interpolate(frame - delay, [0, fps * 1.1], [0, 1], clamp);
	const eased = 1 - Math.pow(1 - t, 3);
	const v = from + (to - from) * eased;
	return (
		<span style={{ fontVariantNumeric: 'tabular-nums' }}>
			{prefix}
			{v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
			{suffix}
		</span>
	);
};

/** Animated mouse pointer that glides to (x, y) and clicks at `clickAt`. */
export const Cursor: React.FC<{ path: { x: number; y: number; at: number }[]; clickAt?: number; size?: number }> = ({
	path,
	clickAt,
	size = 56
}) => {
	const frame = useCurrentFrame();
	// Inside a Camera, stay the same size on screen however far it zooms.
	const k = 1 / useCameraScale();
	const frames = path.map((p) => p.at);
	const ease = (k: 'x' | 'y') =>
		interpolate(frame, frames, path.map((p) => p[k]), { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
	const press = clickAt === undefined ? 0 : interpolate(frame - clickAt, [0, 3, 8], [0, 1, 0], clamp);
	const ring = clickAt === undefined ? 0 : interpolate(frame - clickAt, [0, 14], [0, 1], clamp);
	const visible =
		interpolate(frame, [frames[0], frames[0] + 6], [0, 1], clamp) *
		(clickAt === undefined ? 1 : interpolate(frame, [clickAt + 26, clickAt + 34], [1, 0], clamp));
	return (
		<div
			style={{
				position: 'absolute',
				left: ease('x'),
				top: ease('y'),
				opacity: visible,
				zIndex: 50,
				pointerEvents: 'none',
				transform: `scale(${k})`,
				transformOrigin: '0 0'
			}}
		>
			{ring > 0 && ring < 1 && (
				<div
					style={{
						position: 'absolute',
						left: -40 * ring,
						top: -40 * ring,
						width: 80 * ring,
						height: 80 * ring,
						borderRadius: '50%',
						border: `4px solid ${color.surge}`,
						opacity: 1 - ring
					}}
				/>
			)}
			<svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `scale(${1 - press * 0.15})`, transformOrigin: '0 0' }}>
				<path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#000" strokeWidth="1.3" strokeLinejoin="round" />
			</svg>
		</div>
	);
};

/**
 * Wraps a scene: it rises in over `enter` frames and lifts out over the last
 * `exit` frames, so scenes hand over quickly without hard cuts. 0 = no motion
 * (for scenes that continue each other).
 */
export const SceneShell: React.FC<{ frames: number; enter?: number; exit?: number; children: React.ReactNode }> = ({
	frames,
	enter = 7,
	exit = 6,
	children
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const into = enter > 0 ? spring({ frame, fps, config: { damping: 16, stiffness: 220, mass: 0.7 } }) : 1;
	const out = exit > 0 ? interpolate(frame, [frames - exit, frames], [0, 1], { ...clamp, easing: (t) => t * t }) : 0;
	return (
		<AbsoluteFill
			style={{
				opacity: Math.min(1, into * 2.4) * (1 - out),
				transform: `translateY(${(1 - into) * 70 - out * 60}px) scale(${0.96 + 0.04 * into + out * 0.02})`,
				fontFamily: font.family,
				color: color.fg
			}}
		>
			{children}
		</AbsoluteFill>
	);
};
