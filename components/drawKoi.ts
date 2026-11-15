/**
 * Koi drawing: this is the file to rewrite.
 *
 * KoiPond.tsx handles movement and calls drawKoi() once per fish per frame.
 * Everything about how a fish *looks* belongs here.
 */

export type Fish = {
  x: number; // head position (px)
  y: number;
  vx: number; // velocity, px per frame at 60fps
  vy: number;
  size: number; // rough body width in px
  phase: number; // random offset so fish don't wiggle in sync
  trail: { x: number; y: number }[]; // recent head positions, newest first
};

/** Evenly spaced points along the fish's recent path, head first. */
export function spine(f: Fish, segments: number, gap: number) {
  const pts = [{ x: f.x, y: f.y }];
  let dist = 0;
  let prev = pts[0];
  for (const p of f.trail) {
    dist += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
    if (dist >= gap) {
      pts.push({ x: p.x, y: p.y });
      dist = 0;
      if (pts.length >= segments) break;
    }
  }
  // A brand new fish has no trail yet, so extend straight backwards.
  const heading = Math.atan2(f.vy, f.vx);
  while (pts.length < segments) {
    const last = pts[pts.length - 1];
    pts.push({
      x: last.x - Math.cos(heading) * gap,
      y: last.y - Math.sin(heading) * gap,
    });
  }
  return pts;
}

export function drawKoi(ctx: CanvasRenderingContext2D, f: Fish, time: number) {
  void time;
  
  ctx.fillStyle = "darkorange";
  ctx.beginPath();
  ctx.arc(1000, 500, 20, 0, Math.PI * 2 );
  ctx.fill();
}
