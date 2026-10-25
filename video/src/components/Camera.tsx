import React, { createContext, useContext } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export type Rect = { x: number; y: number; w: number; h: number };
export type CameraShot = { frame: number; rect: Rect; enter?: 'tilt' | 'rise' };

/** Current camera scale, so things like the cursor can stay the same size on screen. */
export const CameraScale = createContext(1);
export const useCameraScale = () => useContext(CameraScale);

type State = { cx: number; cy: number; s: number };

function fit(rect: Rect, vw: number, vh: number, pad: number): State {
	const s = Math.min(vw / rect.w, vh / rect.h) * pad;
	return { cx: rect.x + rect.w / 2, cy: rect.y + rect.h / 2, s };
}

/**
 * Films a large canvas (e.g. a dashboard page) inside a viewport. Each shot
 * frames a rectangle of the canvas; the camera glides between shots with a
 * critically damped spring, zooming in log space so it feels even.
 */
export const Camera: React.FC<{
	canvas: { w: number; h: number };
	viewport: { w: number; h: number };
	shots: CameraShot[];
	pad?: number;
	children: React.ReactNode;
}> = ({ canvas, viewport, shots, pad = 0.94, children }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const { w: vw, h: vh } = viewport;
	const sorted = [...shots].sort((a, b) => a.frame - b.frame);
	let state = fit(sorted[0].rect, vw, vh, pad);
	for (let i = 1; i < sorted.length; i++) {
		if (frame < sorted[i].frame) break;
		const target = fit(sorted[i].rect, vw, vh, pad);
		const p = spring({ frame: frame - sorted[i].frame, fps, config: { damping: 200, stiffness: 110, mass: 1 } });
		state = {
			cx: state.cx + (target.cx - state.cx) * p,
			cy: state.cy + (target.cy - state.cy) * p,
			s: Math.exp(Math.log(state.s) + (Math.log(target.s) - Math.log(state.s)) * p)
		};
	}
	const s = state.s;
	let tx = vw / 2 - state.cx * s;
	let ty = vh / 2 - state.cy * s;
	// Never show past the canvas edges (centre it when it is smaller than the view).
	tx = canvas.w * s <= vw ? (vw - canvas.w * s) / 2 : Math.min(0, Math.max(vw - canvas.w * s, tx));
	ty = canvas.h * s <= vh ? (vh - canvas.h * s) / 2 : Math.min(0, Math.max(vh - canvas.h * s, ty));

	// Entrances: "tilt" swings the page up from a 3D angle, "rise" slides it up.
	const enter = sorted[0].enter;
	const e = enter ? spring({ frame: frame - sorted[0].frame, fps, config: { damping: 20, stiffness: 90, mass: 1 } }) : 1;
	const enterTransform =
		enter === 'tilt'
			? `perspective(2200px) translateY(${(1 - e) * vh * 0.35}px) rotateX(${(1 - e) * 32}deg) rotateZ(${(1 - e) * -6}deg) scale(${0.82 + 0.18 * e})`
			: enter === 'rise'
				? `translateY(${(1 - e) * vh * 0.4}px) scale(${0.9 + 0.1 * e})`
				: undefined;

	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				transform: enterTransform,
				transformOrigin: '50% 30%',
				opacity: interpolate(e, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: canvas.w,
					height: canvas.h,
					transformOrigin: '0 0',
					transform: `translate(${tx}px, ${ty}px) scale(${s})`
				}}
			>
				<CameraScale.Provider value={s}>{children}</CameraScale.Provider>
			</div>
		</div>
	);
};
