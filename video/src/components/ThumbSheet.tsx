import React from 'react';
import { AbsoluteFill } from 'remotion';
import { THUMBS, VideoCard } from './Thumb';

/** All sample thumbnails as feed cards, for checking the designs (composition "thumbs-sheet"). */
export const ThumbSheet: React.FC = () => (
	<AbsoluteFill style={{ background: '#0f0f0f', padding: 40, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 36 }}>
		{THUMBS.map((_, i) => (
			<VideoCard key={i} seed={i} width={440} />
		))}
	</AbsoluteFill>
);
