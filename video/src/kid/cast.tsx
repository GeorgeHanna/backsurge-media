import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Eye, type Face, Ink, K, KidBg, Mouth, Shape, Sun, useBlink, wob, WobbleDef } from './kit';

// The cast, kid-drawn. Daisy (the surfer cow) is the creator in every clip; the
// others stand for the four groups on the library map. No hands anywhere.

// ── Daisy, the surfer cow ──────────────────────────────────────────────────

/** Pose → [head tilt, front leg, rear-up] in degrees. */
export type CowPose = 'idle' | 'wave' | 'point' | 'pointUp' | 'present' | 'cheer' | 'shrug' | 'slump';
export const COW_POSES: Record<CowPose, (f: number) => number[]> = {
	idle: (f) => [Math.sin(f / 16) * 2, 0, 0],
	wave: (f) => [-4, -78 + Math.sin(f / 3) * 18, 0],
	point: () => [-6, -62, 0],
	pointUp: () => [-8, -80, 0],
	present: () => [-6, -62, 0],
	cheer: (f) => [-8, -70 + Math.sin(f / 2.5) * 12, -18],
	shrug: () => [-14, -14, 0],
	slump: () => [14, 0, 0]
};

const COW_W = 740;
const COW_H = 620;

export const Cow: React.FC<{ width: number; face: Face; params: number[]; look?: [number, number]; sweat?: boolean }> = ({ width, face, params, look = [0, 0], sweat }) => {
	const f = useCurrentFrame();
	const blink = useBlink(0) && face !== 'shock';
	const [head, leg, rear] = params;
	const bob = Math.sin(f / 12) * 6;
	const roll = Math.sin(f / 15) * 1.5;
	const tail = Math.sin(f / 6) * 8;
	const brow =
		face === 'unsure' || face === 'sad'
			? 'M532,138 L560,146 M590,136 L622,128'
			: face === 'shock'
				? 'M530,132 Q546,120 562,130 M586,122 Q604,110 622,120'
				: null;
	return (
		<svg viewBox={`0 0 ${COW_W} ${COW_H}`} width={width} height={(width * COW_H) / COW_W} style={{ overflow: 'visible' }}>
			<WobbleDef />
			<g filter={wob()} transform={`translate(0 ${bob}) rotate(${roll} 340 560)`}>
				{/* surfboard */}
				<Shape d="M10,560 Q30,515 280,512 Q580,506 660,534 Q690,560 640,580 Q400,610 180,606 Q10,602 10,560 Z" fill={K.orange} />
				<Ink c={K.orangeLine} w={7}>
					<path d="M60,560 L620,548" />
				</Ink>
				<g transform={`rotate(${rear} 160 540)`}>
					{/* tail */}
					<g transform={`rotate(${tail} 92 280)`}>
						<Ink>
							<path d="M92,280 Q40,260 46,200 Q50,170 28,156" />
						</Ink>
						<Shape d="M36,160 Q4,120 22,120 Q6,100 32,106 Q42,86 50,112 Q60,140 36,160 Z" fill={K.ink} w={5} />
					</g>
					{/* legs: back two, then the front two (which can lift) */}
					<Ink w={10}>
						<path d="M160,440 L156,540" />
						<path d="M220,446 L230,536" />
						<g transform={`rotate(${rear ? leg * 0.7 : 0} 380 446)`}>
							<path d="M380,446 L372,534" />
							<path d="M366,532 L380,532" strokeWidth={18} />
						</g>
						<g transform={`rotate(${leg} 440 440)`}>
							<path d="M440,440 L454,530" />
							<path d="M448,528 L462,528" strokeWidth={18} />
						</g>
						<path d="M150,538 L162,538 M224,534 L236,534" strokeWidth={18} />
					</Ink>
					{/* body + spots */}
					<Shape d="M90,250 Q100,210 180,216 Q320,200 460,222 Q512,240 500,320 Q508,420 450,446 Q320,466 170,450 Q90,446 86,360 Q78,300 90,250 Z" fill={K.white} w={9} />
					<Shape d="M190,240 Q230,228 260,256 Q272,300 230,312 Q184,316 180,280 Q178,252 190,240 Z" fill={K.ink} w={0} />
					<Shape d="M340,300 Q390,280 424,316 Q432,370 378,380 Q326,378 322,340 Q322,312 340,300 Z" fill={K.ink} w={0} />
					<Shape d="M132,370 Q164,358 178,390 Q174,426 140,426 Q116,412 132,370 Z" fill={K.ink} w={0} />
					<Shape d="M300,450 Q320,494 360,480 Q386,468 378,446" fill={K.pink} w={7} />
					{/* head */}
					<g transform={`rotate(${head} 490 250)`}>
						<Shape d="M488,148 Q436,120 424,160 Q450,186 490,180" fill={K.white} />
						<Shape d="M652,112 Q698,70 728,98 Q716,136 676,140" fill={K.white} />
						<Shape d="M530,100 Q516,54 544,36 Q550,70 560,90 Z" fill={K.sun} w={7} />
						<Shape d="M602,92 Q612,48 644,40 Q640,76 626,100 Z" fill={K.sun} w={7} />
						<Shape d="M472,160 Q520,70 622,100 Q696,130 690,216 Q682,300 606,316 Q520,324 486,268 Q456,216 472,160 Z" fill={K.white} w={9} />
						<Shape d="M614,112 Q650,110 662,142 Q660,168 632,166 Q610,150 614,112 Z" fill={K.ink} w={0} />
						<circle cx="520" cy="226" r="20" fill={K.blush} />
						<Eye x={550} y={176} r={17} face={face} look={look} blink={blink} />
						<Eye x={602} y={168} r={21} face={face} look={look} blink={blink} />
						{brow && (
							<Ink w={7}>
								<path d={brow} />
							</Ink>
						)}
						<ellipse cx="632" cy="262" rx="64" ry="44" transform="rotate(-12 632 262)" fill={K.pink} stroke={K.ink} strokeWidth="8" />
						<Ink w={6}>
							<path d="M606,252 Q612,240 618,252 M650,246 Q656,234 662,246" />
						</Ink>
						<Mouth x={634} y={284} w={64} face={face} />
						{sweat && <Shape d="M700,150 Q712,176 700,186 Q688,176 700,150 Z" fill="#8fd3ff" w={5} />}
					</g>
				</g>
				{/* splash */}
				<Ink c={K.waterLine} w={7}>
					<path d="M-8,540 L-40,516 M-4,514 L-26,482 M680,522 L716,500 M690,550 L732,546" />
				</Ink>
			</g>
		</svg>
	);
};
Cow.displayName = 'Cow';
export const cowHeight = (width: number) => (width * COW_H) / COW_W;

// ── The four groups ────────────────────────────────────────────────────────

/** Hidden gem: a shy mole popping out of a sandy mound, with a gem. */
export const Mole: React.FC<{ width?: number; face?: Face; look?: [number, number]; popAt?: number }> = ({ width = 330, face = 'happy', look = [0, 0], popAt = 6 }) => {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const up = spring({ frame: f - popAt, fps, config: { damping: 9, stiffness: 160, mass: 0.6 } });
	const blink = useBlink(23);
	return (
		<svg viewBox="0 0 360 360" width={width} height={width} style={{ overflow: 'visible' }}>
			<WobbleDef />
			<defs>
				<clipPath id="mole-hole">
					<rect x="-50" y="-200" width="460" height="500" />
				</clipPath>
			</defs>
			<g filter={wob()}>
				<g clipPath="url(#mole-hole)">
					<g transform={`translate(0 ${(1 - up) * 220})`}>
						<Shape d="M92,300 Q80,120 180,110 Q280,120 268,300 Z" fill={K.brown} w={9} />
						<Shape d="M130,300 Q130,220 180,214 Q230,220 230,300 Z" fill="#c89670" w={0} />
						<Eye x={148} y={170} r={13} face={face} look={look} blink={blink} />
						<Eye x={212} y={170} r={13} face={face} look={look} blink={blink} />
						<ellipse cx="180" cy="208" rx="30" ry="20" fill={K.pink} stroke={K.ink} strokeWidth="7" />
						<Mouth x={180} y={240} w={34} face={face} />
						<circle cx="128" cy="214" r="12" fill={K.blush} />
						<circle cx="232" cy="214" r="12" fill={K.blush} />
						<Ink w={5}>
							<path d="M140,206 L96,196 M140,216 L98,222 M220,206 L264,196 M220,216 L262,222" />
						</Ink>
					</g>
				</g>
				<Shape d="M0,340 Q40,270 120,282 Q180,262 240,282 Q320,270 360,340 Z" fill={K.sand} w={9} />
				<Ink w={5} c="#c9a24a">
					<path d="M60,318 l10,-4 M160,300 l12,2 M270,312 l8,-6" />
				</Ink>
				<Shape d="M282,300 L300,276 L322,276 L338,300 L310,330 Z" fill="#7fd3ff" w={6} />
				<Ink w={4} c="#fff">
					<path d="M300,288 L310,290" />
				</Ink>
			</g>
		</svg>
	);
};

/** Star: a show-off rooster on a little island, with a star over its head. */
export const Rooster: React.FC<{ width?: number; face?: Face; look?: [number, number] }> = ({ width = 330, face = 'smug', look = [0, 0] }) => {
	const f = useCurrentFrame();
	const blink = useBlink(41);
	const puff = 1 + Math.max(0, Math.sin(f / 9)) * 0.05;
	const crow = Math.floor(f / 30) % 3 === 1;
	return (
		<svg viewBox="0 0 400 520" width={width} height={(width * 520) / 400} style={{ overflow: 'visible' }}>
			<WobbleDef />
			<g filter={wob()}>
				{/* star */}
				<g transform={`translate(250 ${40 + Math.sin(f / 8) * 8}) rotate(${f * 2})`}>
					<Shape d="M0,-40 L11,-13 L40,-12 L17,6 L25,35 L0,18 L-25,35 L-17,6 L-40,-12 L-11,-13 Z" fill={K.sun} w={6} />
				</g>
				{/* island */}
				<Shape d="M30,520 Q70,450 200,452 Q330,450 370,520 Z" fill={K.sand} w={9} />
				{/* legs */}
				<Ink w={9} c={K.sunLine}>
					<path d="M180,380 L172,456 M224,380 L232,456 M156,456 L188,456 M218,456 L250,456" />
				</Ink>
				<g transform={`scale(${puff})`} style={{ transformOrigin: '200px 300px' }}>
					{/* tail feathers */}
					<Shape d="M110,300 Q40,230 70,160 Q110,220 130,260 Z" fill={K.green} w={7} />
					<Shape d="M110,310 Q20,290 30,210 Q90,250 128,282 Z" fill={K.water} w={7} />
					<Shape d="M114,320 Q50,350 40,290 Q90,300 130,300 Z" fill={K.purple} w={7} />
					{/* body */}
					<Shape d="M110,320 Q90,210 200,206 Q300,206 300,300 Q292,384 200,388 Q124,386 110,320 Z" fill={K.red} w={9} />
					<Ink w={7}>
						<path d="M160,290 Q200,330 240,296" />
					</Ink>
					{/* head */}
					<Shape d="M236,150 Q250,120 262,148 Q272,116 288,146 Q304,124 306,158 Z" fill={K.red} w={7} />
					<circle cx="270" cy="200" r="56" fill={K.red} stroke={K.ink} strokeWidth="9" />
					<Shape d={crow ? 'M318,194 L370,176 L330,206 Z M320,208 L366,222 L326,216 Z' : 'M318,196 L366,206 L320,216 Z'} fill={K.sun} w={6} />
					<Shape d="M312,224 Q326,258 304,256 Q296,240 304,226 Z" fill="#ff6b6b" w={6} />
					<Eye x={282} y={188} r={15} face={face} look={look} blink={blink} />
				</g>
			</g>
		</svg>
	);
};

/** Wide reach: a goldfish that jumps up for a look, then can't wait to leave. */
export const Goldfish: React.FC<{ width?: number; face?: Face; look?: [number, number]; jumpAt?: number }> = ({ width = 360, face = 'neutral', look = [0, 0], jumpAt = 0 }) => {
	const f = useCurrentFrame();
	const blink = useBlink(11);
	const t = Math.max(0, f - jumpAt);
	const hop = Math.abs(Math.sin(t / 14)) * 110;
	const tilt = Math.cos(t / 14) * 18;
	const wag = Math.sin(f / 3) * 10;
	return (
		<svg viewBox="0 0 320 320" width={width} height={width} style={{ overflow: 'visible' }}>
			<WobbleDef />
			<g filter={wob()}>
				<g transform={`translate(0 ${120 - hop}) rotate(${tilt} 170 110)`}>
					<g transform={`rotate(${wag} 70 110)`}>
						<Shape d="M70,110 L10,50 L26,110 L10,170 Z" fill={K.orange} w={8} />
					</g>
					<Shape d="M150,48 Q180,10 210,46 Z" fill={K.orange} w={7} />
					<ellipse cx="170" cy="110" rx="108" ry="68" fill={K.orange} stroke={K.ink} strokeWidth="9" />
					<Ink w={6} c={K.orangeLine}>
						<path d="M120,70 Q100,110 120,150 M150,66 Q130,110 150,154" />
					</Ink>
					<Eye x={222} y={92} r={20} face={face} look={look} blink={blink} />
					<Mouth x={262} y={126} w={30} face={face === 'neutral' ? 'shock' : face} />
				</g>
				<Ink c={K.waterLine} w={7}>
					<circle cx="270" cy={60 - (t % 40)} r="10" />
					<circle cx="300" cy={20 - ((t + 20) % 40)} r="7" />
					<path d="M90,300 L70,276 M250,300 L272,276" />
				</Ink>
			</g>
		</svg>
	);
};

/** Underperformer: a snail asleep on a rock. */
export const Snail: React.FC<{ width?: number; face?: Face }> = ({ width = 380, face = 'deadpan' }) => {
	const f = useCurrentFrame();
	const breathe = Math.sin(f / 20) * 4;
	return (
		<svg viewBox="0 0 380 320" width={width} height={(width * 320) / 380} style={{ overflow: 'visible' }}>
			<WobbleDef />
			<g filter={wob()}>
				<Shape d="M20,320 Q40,250 190,246 Q340,250 360,320 Z" fill="#b9b2a6" w={9} />
				<Shape d={`M60,250 Q60,${214 - breathe} 130,${218 - breathe} L270,${218 - breathe} Q320,206 330,150 Q336,118 312,112 Q288,112 284,150 Q280,190 250,196 L130,200 Q60,200 60,250 Z`} fill="#c8d96a" w={9} />
				<Ink w={7}>
					<path d="M300,116 L284,70 M322,118 L330,72" />
				</Ink>
				<circle cx="284" cy="66" r="12" fill="#fff" stroke={K.ink} strokeWidth="6" />
				<circle cx="331" cy="68" r="12" fill="#fff" stroke={K.ink} strokeWidth="6" />
				<Ink w={6}>
					<path d="M272,66 L296,66 M319,68 L343,68" />
				</Ink>
				<Mouth x={312} y={150} w={26} face={face === 'deadpan' ? 'sad' : face} />
				<circle cx="180" cy={150 - breathe} r="86" fill={K.purple} stroke={K.ink} strokeWidth="9" />
				<Ink w={7}>
					<path d={`M180,${150 - breathe} m-8,0 a8,8 0 1,1 16,4 a22,22 0 1,1 -34,-10 a40,40 0 1,1 64,30 a60,60 0 1,1 -98,-34`} />
				</Ink>
				<text x="300" y={20 - (f % 60) * 0.5} fontFamily="Caveat, cursive" fontWeight="700" fontSize="56" fill={K.ink} opacity={1 - (f % 60) / 60}>
					z z z
				</text>
			</g>
		</svg>
	);
};

/** One frame to judge the whole cast. */
export const CastSheet: React.FC = () => (
	<AbsoluteFill style={{ background: K.paper }}>
		<KidBg sun={null} />
		<div style={{ position: 'absolute', left: 40, top: 360 }}>
			<Cow width={620} face="happy" params={[0, -60, 0]} />
		</div>
		<div style={{ position: 'absolute', left: 120, top: 1060 }}>
			<Mole width={300} face="happy" popAt={-30} />
		</div>
		<div style={{ position: 'absolute', left: 620, top: 930 }}>
			<Rooster width={320} face="smug" />
		</div>
		<div style={{ position: 'absolute', left: 660, top: 520 }}>
			<Goldfish width={300} face="neutral" jumpAt={-20} />
		</div>
		<div style={{ position: 'absolute', left: 380, top: 1300 }}>
			<Snail width={340} />
		</div>
		<div style={{ position: 'absolute', left: 800, top: 80 }}>
			<Sun size={220} />
		</div>
		<div style={{ position: 'absolute', left: 60, top: 90, fontFamily: '"Bricolage Grotesque Variable", sans-serif', fontWeight: 800, fontSize: 84, letterSpacing: '-0.03em', color: K.ink, lineHeight: 1.05 }}>
			Daisy & friends
		</div>
	</AbsoluteFill>
);
