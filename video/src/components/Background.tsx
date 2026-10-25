import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { color } from '../brand';

/** Dark backdrop with a slow drifting orange glow, faint grid and film grain (grain is skipped in previews). */
export const Background: React.FC<{ preview?: boolean }> = ({ preview }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const t = frame / fps;
	const gx = 50 + Math.sin(t * 0.35) * 18;
	const gy = 30 + Math.cos(t * 0.27) * 12;
	const grid = 90;
	return (
		<AbsoluteFill style={{ background: color.bg, overflow: 'hidden' }}>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 70% 55% at ${gx}% ${gy}%, rgba(255,137,24,0.16), transparent 70%),
					radial-gradient(ellipse 60% 50% at ${100 - gx}% ${100 - gy * 0.6}%, rgba(59,130,246,0.07), transparent 70%)`
				}}
			/>
			<AbsoluteFill
				style={{
					backgroundImage: `linear-gradient(${color.border}55 1px, transparent 1px), linear-gradient(90deg, ${color.border}55 1px, transparent 1px)`,
					backgroundSize: `${grid}px ${grid}px`,
					backgroundPosition: `${(t * 6) % grid}px ${(t * 10) % grid}px`,
					maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 20%, transparent 75%)',
					WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 20%, transparent 75%)'
				}}
			/>
			{!preview && (
				// A tiled noise texture, shifted every frame: film grain for almost no render cost.
				<AbsoluteFill
					style={{
						opacity: 0.07,
						mixBlendMode: 'overlay',
						backgroundImage: `url(${staticFile('noise.png')})`,
						backgroundRepeat: 'repeat',
						backgroundPosition: `${(frame * 37) % 256}px ${(frame * 61) % 256}px`,
						imageRendering: 'pixelated'
					}}
				/>
			)}
			<AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55))' }} />
		</AbsoluteFill>
	);
};
