"use client";

import { useEffect, useRef } from "react";
import { drawKoi, type Fish } from "./drawKoi";



type Ripple = { x: number; y: number; r: number; max: number; life: number };

const TRAIL_LEN = 8; // body length in segments (shorter = stubbier fish)
const SEGMENT_GAP = 0.9; // body segment spacing, in multiples of fish size

function makeFish(w: number, h: number): Fish {
  const size = 11 + Math.random() * 5;
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.5 + Math.random() * 0.4;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size,
    phase: Math.random() * Math.PI * 2,
    trail: [],
  };
}

export default function KoiPond() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let fish: Fish[] = [];
    const ripples: Ripple[] = [];
    const pointer = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let last = performance.now();
    let time = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Fish count scales with screen area, capped for performance.
      const target = Math.max(3, Math.min(5, Math.round((w * h) / 260000)));
      while (fish.length < target) fish.push(makeFish(w, h));
      if (fish.length > target) fish.length = target;
    };

    const addRipple = (x: number, y: number, max = 150) => {
      ripples.push({ x, y, r: 4, max, life: 1 });
      if (ripples.length > 24) ripples.shift();
    };

    // ---- simulation -------------------------------------------------------
    const step = (dt: number) => {
      const PERCEPTION = 140;
      const SEPARATION = 38;

      for (const f of fish) {
        let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;

        for (const o of fish) {
          if (o === f) continue;
          const dx = o.x - f.x;
          const dy = o.y - f.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > PERCEPTION * PERCEPTION) continue;
          n++;
          cx += o.x; cy += o.y;
          ax += o.vx; ay += o.vy;
          if (d2 < SEPARATION * SEPARATION && d2 > 0.01) {
            const d = Math.sqrt(d2);
            sx -= dx / d;
            sy -= dy / d;
          }
        }

        let fx = 0;
        let fy = 0;
        if (n > 0) {
          fx += (cx / n - f.x) * 0.00012 + (ax / n - f.vx) * 0.02;
          fy += (cy / n - f.y) * 0.00012 + (ay / n - f.vy) * 0.02;
        }
        fx += sx * 0.05;
        fy += sy * 0.05;

        // Wander: slowly turning heading keeps motion lively.
        const heading = Math.atan2(f.vy, f.vx);
        const turn = Math.sin(time * 0.6 + f.phase) * 0.03;
        fx += Math.cos(heading + Math.PI / 2) * turn;
        fy += Math.sin(heading + Math.PI / 2) * turn;

        // Soft walls: steer back from the edges.
        const margin = 80;
        if (f.x < margin) fx += (margin - f.x) * 0.0016;
        if (f.x > w - margin) fx -= (f.x - (w - margin)) * 0.0016;
        if (f.y < margin) fy += (margin - f.y) * 0.0016;
        if (f.y > h - margin) fy -= (f.y - (h - margin)) * 0.0016;

        // Flee the pointer.
        let boost = 1;
        if (pointer.active) {
          const dx = f.x - pointer.x;
          const dy = f.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < 170 && d > 0.01) {
            const push = (1 - d / 170) * 0.32;
            fx += (dx / d) * push;
            fy += (dy / d) * push;
            boost = 1 + (1 - d / 170) * 1.6;
          }
        }

        // Ripples shove fish outward a little.
        for (const r of ripples) {
          const dx = f.x - r.x;
          const dy = f.y - r.y;
          const d = Math.hypot(dx, dy);
          if (Math.abs(d - r.r) < 40 && d > 0.01) {
            const push = 0.12 * r.life;
            fx += (dx / d) * push;
            fy += (dy / d) * push;
            boost = Math.max(boost, 1.6);
          }
        }

        // Desired new velocity from all the steering forces above.
        let nvx = f.vx + fx * dt * 60;
        let nvy = f.vy + fy * dt * 60;

        // Limit how fast the heading can change. Turning radius = speed / turn
        // rate, so keeping the radius above MIN_TURN_RADIUS stops the body
        // (which follows the head's path) from curling back onto itself.
        const MIN_TURN_RADIUS = 70;
        const oldAngle = Math.atan2(f.vy, f.vx);
        let diff = Math.atan2(nvy, nvx) - oldAngle;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // wrap to [-PI, PI]
        const curSpeed = Math.hypot(f.vx, f.vy) || 0.0001;
        const maxTurn = ((curSpeed * 60) / MIN_TURN_RADIUS) * dt;
        diff = Math.max(-maxTurn, Math.min(maxTurn, diff));
        const newAngle = oldAngle + diff;

        const maxSpeed = 0.9 * boost + (f.size > 14 ? 0 : 0.15);
        const minSpeed = 0.35;
        const sp = Math.hypot(nvx, nvy) || 0.0001;
        const speed = Math.min(maxSpeed, Math.max(minSpeed, sp));
        nvx = Math.cos(newAngle) * speed;
        nvy = Math.sin(newAngle) * speed;
        f.vx = nvx;
        f.vy = nvy;

        f.x += f.vx * dt * 60;
        f.y += f.vy * dt * 60;

        // Record the path so the body can follow the head in a curve.
        const lastPt = f.trail[0];
        if (!lastPt || Math.hypot(lastPt.x - f.x, lastPt.y - f.y) > f.size * SEGMENT_GAP * 0.5) {
          f.trail.unshift({ x: f.x, y: f.y });
          if (f.trail.length > TRAIL_LEN * 2) f.trail.pop();
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.r += dt * 90;
        r.life = Math.max(0, 1 - r.r / r.max);
        if (r.life <= 0) ripples.splice(i, 1);
      }
    };

    // ---- drawing ----------------------------------------------------------
    const drawWater = () => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#0a3a4a");
      g.addColorStop(0.5, "#06222e");
      g.addColorStop(1, "#04161f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Slow caustic-style light bands.
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 5; i++) {
        const t = time * 0.12 + i * 1.7;
        const x = w * (0.15 + 0.7 * ((Math.sin(t) + 1) / 2));
        const y = h * (0.1 + 0.8 * ((Math.cos(t * 0.8 + i) + 1) / 2));
        const rg = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h) * 0.35);
        rg.addColorStop(0, "rgba(90,170,170,0.06)");
        rg.addColorStop(1, "rgba(90,170,170,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();
    };

    const drawLilyPads = () => {
      // Fixed positions derived from the viewport so they don't jump on resize.
      const pads = [
        { x: 0.12, y: 0.22, r: 34 },
        { x: 0.17, y: 0.27, r: 22 },
        { x: 0.86, y: 0.72, r: 38 },
        { x: 0.8, y: 0.8, r: 24 },
        { x: 0.63, y: 0.14, r: 26 },
      ];
      for (const p of pads) {
        const bob = Math.sin(time * 0.5 + p.x * 10) * 1.2;
        const x = p.x * w;
        const y = p.y * h + bob;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, p.r, 0.35, Math.PI * 2 - 0.35);
        ctx.closePath();
        ctx.fillStyle = "rgba(60,130,80,0.55)";
        ctx.fill();
        ctx.strokeStyle = "rgba(120,190,120,0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const drawRipples = () => {
      for (const r of ripples) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,235,235,${0.35 * r.life})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,235,235,${0.18 * r.life})`;
        ctx.stroke();
      }
    };

    const render = () => {
      drawWater();
      drawLilyPads();
      //for (const f of fish) drawKoi(ctx, f, time);
      drawRipples();
    };

    // ---- loop & events ----------------------------------------------------
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      step(dt);
      render();
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      // Ignore clicks on links and buttons so the UI still feels normal.
      if ((e.target as HTMLElement).closest("a, button")) return;
      addRipple(e.clientX, e.clientY);
      setTimeout(() => addRipple(e.clientX, e.clientY, 100), 140);
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduceMotion) {
      // Warm the simulation briefly so the fish are spread into a natural pose.
      for (let i = 0; i < 120; i++) {
        time += 1 / 60;
        step(1 / 60);
      }
      render();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 h-full w-full"
    />
  );
}
