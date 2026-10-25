/** Linear 0..1 progress of something that starts at `at` and takes `dur` frames. */
export const prog = (frame: number, at: number, dur: number) => Math.min(1, Math.max(0, (frame - at) / Math.max(1, dur)));

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** A pop: overshoots a little then settles (0 → ~1.08 → 1). */
export const pop = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : easeOut(t) + Math.sin(t * Math.PI) * 0.12);

/** Never: for beats a script did not ask for. */
export const NEVER = 1e9;

export type Rect = { x: number; y: number; w: number; h: number };

/** A beat's frame, given the resolved beat map and a default. */
export const beat = (beats: Record<string, number>, name: string, fallback = NEVER) => beats[name] ?? fallback;
