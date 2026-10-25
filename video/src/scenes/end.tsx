import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand, color } from '../brand';
import { Logo } from '../components/ui';
import { useEnter, useLayout, useRise } from '../layout';
import type { SceneProps } from '../schema';
import { Center } from './text';

/** Closing card: logo hit, "for YouTube creators", headline, CTA + URL, or "Follow for more". */
export const End: React.FC<SceneProps<'end'>> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const { format } = useLayout();
	const logo = useEnter(0, 'springPop');
	const kicker = spring({ frame: frame - 5, fps, config: { damping: 14, stiffness: 200 } });
	const head = useRise(8);
	const cta = useEnter(14, 'springPop');
	const sub = useRise(20);
	const breathe = 1 + Math.sin((frame / fps) * Math.PI * 1.2) * 0.02;
	const size = { vertical: 72, square: 64, wide: 78 }[format];
	const kickerText = scene.kicker ?? brand.audience;

	return (
		<Center gap={format === 'square' ? 26 : 38}>
			<div style={{ transform: `scale(${logo})` }}>
				<Logo size={format === 'square' ? 88 : 110} />
			</div>
			{kickerText && (
				<div
					style={{
						fontSize: 28,
						fontWeight: 800,
						letterSpacing: '0.14em',
						textTransform: 'uppercase',
						color: color.surge,
						padding: '8px 18px',
						borderRadius: 999,
						background: color.surgeSoft,
						border: `2px solid ${color.surge}44`,
						transform: `scale(${kicker})`
					}}
				>
					{kickerText}
				</div>
			)}
			<div style={{ ...head, fontSize: size, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, maxWidth: 1300 }}>
				{scene.headline ?? brand.tagline}
			</div>
			<div
				style={{
					transform: `scale(${cta * breathe})`,
					fontSize: 46,
					fontWeight: 800,
					padding: '28px 56px',
					borderRadius: 24,
					background: color.surge,
					color: '#111',
					boxShadow: `0 0 80px ${color.surgeGlow}`
				}}
			>
				{scene.follow ? scene.cta ?? 'Follow for more' : scene.cta ?? brand.cta}
			</div>
			<div style={{ ...sub, fontSize: 36, fontWeight: 700, color: color.fgSoft, textAlign: 'center' }}>
				{scene.follow ? `More at ${brand.url}` : brand.url}
				{!scene.follow && (
					<div style={{ fontSize: 26, fontWeight: 500, color: color.fgMuted, marginTop: 8 }}>{scene.sub ?? brand.ctaSub}</div>
				)}
			</div>
		</Center>
	);
};
