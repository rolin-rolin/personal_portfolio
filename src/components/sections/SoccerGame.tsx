"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ─── Physics constants ────────────────────────────────────────────────────────
const GRAVITY        = 0.28;   // px/frame²
const DRAG           = 0.991;  // velocity multiplier per frame (air resistance)
const ELASTICITY     = 0.68;   // energy retained on wall bounce
const FLOOR_FRICTION = 0.94;   // vx damping when bouncing off floor
const BALL_MASS      = 1.4;    // divides cursor impulse (heavier = harder to redirect)
const SPIN_DECAY     = 0.97;   // angular velocity decay per frame (in-air only)
const BALL_RADIUS    = 16;
const GAME_MS        = 60_000;
const GOAL_RATIO     = 0.28;   // goal height as fraction of canvas height
const GOAL_DEPTH     = 28;     // px the goal extends inward from right wall
const MIN_SPEED      = 1.5;    // enforce minimum ball speed
const GROUND_HEIGHT  = 22;     // px — grass strip at bottom (visual + physics floor)

// Hard mode
const GOALIE_RADIUS  = 18;     // px
const GOALIE_LEAP_MS = 300;    // ms for leap arc animation

// Goal celebration confetti
const CONFETTI_COUNT  = 32;
const CONFETTI_MS     = 1200;  // ms particles live
const CONFETTI_COLORS = ["#ff4d00", "#ffaa00", "#ffffff", "#171717", "#ffd700"];

type GameState = "idle" | "playing" | "gameover";

type Ball = {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  spin: number;   // rad/frame
  angle: number;  // accumulated rotation
};

type Goalie = {
  x: number;
  y: number;
  vy: number;
  state: "standing" | "leaping" | "falling";
  leapFromY: number;
  leapToY: number;
  leapStartTime: number;
};

type Confetti = {
  x: number; y: number;
  vx: number; vy: number;
  w: number; h: number;
  angle: number; spin: number;
  color: string;
  born: number;
};

type Sample = { x: number; y: number; t: number };

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function spawnBall(cw: number, ch: number): Ball {
  return {
    x:  cw * 0.15,
    y:  ch * 0.5 + (Math.random() - 0.5) * ch * 0.3,
    vx: 3.2 + Math.random() * 1.8,
    vy: (Math.random() - 0.5) * 2.5,
    radius: BALL_RADIUS,
    spin: 0,
    angle: 0,
  };
}

function spawnBallHard(cw: number, ch: number): Ball {
  // Fixed stationary spawn on the grass, left-center of field
  const floorY = ch - GROUND_HEIGHT;
  return {
    x:  cw * 0.28,
    y:  floorY - BALL_RADIUS,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    spin: 0,
    angle: 0,
  };
}

function hardSpawnPoint(cw: number, ch: number) {
  return { x: cw * 0.28, y: ch - GROUND_HEIGHT - BALL_RADIUS };
}

function goalBounds(ch: number) {
  const h = ch * GOAL_RATIO;
  const top = (ch - h) / 2;
  return { top, bottom: top + h };
}

function hardGoalBounds(ch: number) {
  const top = goalBounds(ch).top;
  return { top, bottom: ch - GROUND_HEIGHT };
}

function makeGoalie(cw: number, ch: number): Goalie {
  return {
    x: cw - GOAL_DEPTH - GOALIE_RADIUS - 4,
    y: ch - GROUND_HEIGHT - GOALIE_RADIUS,
    vy: 0,
    state: "standing",
    leapFromY: 0,
    leapToY: 0,
    leapStartTime: 0,
  };
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(ball.angle);
  ctx.font = `${ball.radius * 2.2}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⚽", 0, 0);
  ctx.restore();
}

function drawGoalie(ctx: CanvasRenderingContext2D, goalie: Goalie) {
  ctx.save();
  ctx.font = `${GOALIE_RADIUS * 2.2}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🧤", goalie.x, goalie.y);
  ctx.restore();
}

function drawGoal(
  ctx: CanvasRenderingContext2D,
  cw: number,
  top: number,
  bottom: number,
) {
  const postH = 5;

  // Net hatch (clipped to goal rect)
  ctx.save();
  ctx.beginPath();
  ctx.rect(cw - GOAL_DEPTH, top, GOAL_DEPTH, bottom - top);
  ctx.clip();
  ctx.strokeStyle = "rgba(0,0,0,0.09)";
  ctx.lineWidth = 1;
  for (let x = cw - GOAL_DEPTH; x <= cw; x += 7) {
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
  }
  for (let y = top; y <= bottom; y += 7) {
    ctx.beginPath(); ctx.moveTo(cw - GOAL_DEPTH, y); ctx.lineTo(cw, y); ctx.stroke();
  }
  ctx.restore();

  // Posts — accent orange
  ctx.fillStyle = "#ff4d00";
  ctx.fillRect(cw - GOAL_DEPTH, top - postH, GOAL_DEPTH + postH, postH); // top
  ctx.fillRect(cw - GOAL_DEPTH, bottom, GOAL_DEPTH + postH, postH);      // bottom
  ctx.fillRect(cw - GOAL_DEPTH - 3, top - postH, 4, bottom - top + postH * 2); // side
}

function drawGround(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  const groundY = ch - GROUND_HEIGHT;

  // Grass base gradient
  const grad = ctx.createLinearGradient(0, groundY, 0, ch);
  grad.addColorStop(0, "#3a8c3a");
  grad.addColorStop(1, "#245224");
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY, cw, GROUND_HEIGHT);

  // Alternating mow-stripe highlights
  const stripeW = 36;
  for (let x = 0; x < cw; x += stripeW * 2) {
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(x, groundY, stripeW, GROUND_HEIGHT);
  }

  // Grass blade fringe along the top edge
  for (let x = 0; x < cw; x += 4) {
    const tall = (x % 12 === 0);
    const h = tall ? 7 : 4 + Math.round(Math.sin(x * 0.53) * 1.5);
    ctx.fillStyle = tall ? "#5dba5d" : "#4da84d";
    ctx.fillRect(x, groundY - h + 2, 2, h);
  }
}

// Elastic collision between two equal-mass balls (modifies both in place)
function resolveBallBall(a: Ball, b: Ball) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = a.radius + b.radius;
  if (dist >= minDist || dist < 0.01) return;

  const nx = dx / dist, ny = dy / dist;
  const overlap = minDist - dist;
  a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5;

  const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
  const dot = dvx * nx + dvy * ny;
  if (dot <= 0) return;
  const j = dot * ELASTICITY;
  a.vx -= j * nx; a.vy -= j * ny;
  b.vx += j * nx; b.vy += j * ny;
  a.spin += b.vx * 0.03;
  b.spin += a.vx * 0.03;
}

type PageRect = { left: number; top: number; right: number; bottom: number };

// Bounce a ball off an AABB rect (page-absolute coords)
function resolveAABBCircle(ball: Ball, rect: PageRect) {
  const cx = Math.max(rect.left, Math.min(ball.x, rect.right));
  const cy = Math.max(rect.top,  Math.min(ball.y, rect.bottom));
  const dx = ball.x - cx, dy = ball.y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist >= ball.radius || dist < 0.01) return;
  const nx = dx / dist, ny = dy / dist;
  ball.x += nx * (ball.radius - dist);
  ball.y += ny * (ball.radius - dist);
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot >= 0) return; // already separating — don't re-apply
  ball.vx -= 2 * dot * nx * ELASTICITY;
  ball.vy -= 2 * dot * ny * ELASTICITY;
  ball.spin = ball.vx * 0.06; // reset to rolling spin, same formula as ground
}

function spawnConfetti(wallX: number, gTop: number, gBottom: number, now: number): Confetti[] {
  const cy = (gTop + gBottom) / 2;
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    x: wallX - 8 + Math.random() * 6,
    y: cy + (Math.random() - 0.5) * (gBottom - gTop) * 0.7,
    vx: -(3 + Math.random() * 9),         // burst leftward out of the goal
    vy: (Math.random() - 0.65) * 8,        // mostly upward
    w: 4 + Math.random() * 5,
    h: 3 + Math.random() * 3,
    angle: Math.random() * Math.PI * 2,
    spin:  (Math.random() - 0.5) * 0.35,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    born: now,
  }));
}

function drawConfetti(ctx: CanvasRenderingContext2D, confetti: Confetti[], now: number) {
  for (const c of confetti) {
    const t = (now - c.born) / CONFETTI_MS;
    if (t >= 1) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t * t); // ease out
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    ctx.restore();
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SoccerGame() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef   = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [hardMode,  setHardMode]  = useState(false);
  const [mounted,   setMounted]   = useState(false);

  // All mutable game state lives in refs so the rAF loop never goes stale
  const stateRef       = useRef<GameState>("idle");
  const ballRef        = useRef<Ball | null>(null);
  const scoreRef       = useRef(0);
  const startRef       = useRef(0);
  const bornRef        = useRef(0);
  const samplesRef     = useRef<Sample[]>([]);
  const cursorRef      = useRef({ x: -1000, y: -1000 });

  // Hard mode refs
  const hardModeRef        = useRef(false);
  const escapedBallsRef    = useRef<Ball[]>([]);
  const confettiRef        = useRef<Confetti[]>([]);
  const goalieRef          = useRef<Goalie | null>(null);
  const globalCursorRef    = useRef({ x: -9999, y: -9999 }); // viewport coords
  const globalSamplesRef   = useRef<Sample[]>([]);             // viewport coords
  const scrollContainerRef = useRef<Element | null>(null);     // the CSS-transform scroller
  const groundYRef       = useRef(9999);
  const collidablesRef   = useRef<PageRect[]>([]);
  const frameCountRef    = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    // ── Resize ──────────────────────────────────────────────────────────────
    function resize() {
      if (!canvas || !container) return;
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.width  = window.innerWidth;
        overlay.height = window.innerHeight;
      }
      updateGroundAndCollidables();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ── Ground + collidable cache (layout-space coords) ──────────────────────
    // Layout-space = the coordinate system of the untransformed flex container.
    // x_layout = x_viewport - cLeft   (cLeft = containerEl.getBoundingClientRect().left)
    // y_layout = y_viewport            (no vertical scroll)
    function toLayoutRect(r: DOMRect, cLeft: number): PageRect {
      return {
        left:   r.left   - cLeft,
        top:    r.top,
        right:  r.right  - cLeft,
        bottom: r.bottom,
      };
    }
    function updateGroundAndCollidables() {
      // Cache scroll container element
      if (!scrollContainerRef.current) {
        scrollContainerRef.current = document.querySelector("[data-scroll-x-container]");
      }
      const cLeft = scrollContainerRef.current?.getBoundingClientRect().left ?? 0;
      const gl = document.querySelector("[data-ground-line]");
      if (gl) groundYRef.current = gl.getBoundingClientRect().top; // Y same in both spaces
      const rect = canvas!.getBoundingClientRect();
      collidablesRef.current = [toLayoutRect(rect, cLeft)];
    }
    updateGroundAndCollidables();

    // ── Cursor velocity helpers ──────────────────────────────────────────────
    function cursorVelocity() {
      const s = samplesRef.current;
      if (s.length < 2) return { vx: 0, vy: 0 };
      const a = s[0], b = s[s.length - 1];
      const dt = b.t - a.t;
      if (dt < 2) return { vx: 0, vy: 0 };
      return { vx: ((b.x - a.x) / dt) * 16, vy: ((b.y - a.y) / dt) * 16 };
    }

    function globalCursorVelocity() {
      const s = globalSamplesRef.current;
      if (s.length < 2) return { vx: 0, vy: 0 };
      const a = s[0], b = s[s.length - 1];
      const dt = b.t - a.t;
      if (dt < 2) return { vx: 0, vy: 0 };
      return { vx: ((b.x - a.x) / dt) * 16, vy: ((b.y - a.y) / dt) * 16 };
    }

    // ── Transitions ─────────────────────────────────────────────────────────
    function goIdle() {
      stateRef.current = "idle";
      setGameState("idle");
      escapedBallsRef.current = [];
      confettiRef.current = [];
      goalieRef.current = null;
    }
    function goOver() {
      stateRef.current = "gameover";
      setGameState("gameover");
      escapedBallsRef.current = [];
      confettiRef.current = [];
      goalieRef.current = null;
    }
    function goPlay() {
      const now = performance.now();
      const cw = canvas!.width, ch = canvas!.height;
      if (hardModeRef.current) {
        ballRef.current  = spawnBallHard(cw, ch);
        goalieRef.current = makeGoalie(cw, ch);
      } else {
        ballRef.current = spawnBall(cw, ch);
      }
      scoreRef.current = 0;
      startRef.current = now;
      bornRef.current  = now;
      stateRef.current = "playing";
      setGameState("playing");
      escapedBallsRef.current = [];
    }

    function respawnBall(cw: number, ch: number, now: number) {
      ballRef.current = hardModeRef.current ? spawnBallHard(cw, ch) : spawnBall(cw, ch);
      bornRef.current = now;
      if (hardModeRef.current) goalieRef.current = makeGoalie(cw, ch);
    }

    // ── Event handlers ──────────────────────────────────────────────────────
    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cursorRef.current = { x, y };
      samplesRef.current.push({ x, y, t: performance.now() });
      if (samplesRef.current.length > 8) samplesRef.current.shift();
    }
    function onMouseLeave() {
      cursorRef.current = { x: -1000, y: -1000 };
      samplesRef.current = [];
    }
    function onClick() {
      const s = stateRef.current;
      if (s === "idle")     goPlay();
      if (s === "gameover") goIdle();
    }
    function onGlobalMouseMove(e: MouseEvent) {
      globalCursorRef.current = { x: e.clientX, y: e.clientY }; // viewport coords
      globalSamplesRef.current.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (globalSamplesRef.current.length > 8) globalSamplesRef.current.shift();
    }

    canvas.addEventListener("mousemove",  onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click",      onClick);
    window.addEventListener("mousemove",  onGlobalMouseMove);

    // ── rAF loop ─────────────────────────────────────────────────────────────
    let raf = 0;

    function loop(now: number) {
      const state = stateRef.current;
      const cw = canvas!.width;
      const ch = canvas!.height;

      frameCountRef.current++;
      if (frameCountRef.current % 30 === 0) updateGroundAndCollidables();

      const overlay    = overlayRef.current;
      const overlayCtx = overlay?.getContext("2d") ?? null;

      // ── IDLE ──────────────────────────────────────────────────────────────
      if (state === "idle") {
        ctx.clearRect(0, 0, cw, ch);
        const bob = Math.sin(now * 0.002) * 5;
        drawBall(ctx, {
          x: cw / 2, y: ch / 2 + bob,
          vx: 0, vy: 0, radius: BALL_RADIUS,
          spin: 0, angle: now * 0.0006,
        });
        ctx.globalAlpha = 0.38 + Math.sin(now * 0.0028) * 0.28;
        ctx.fillStyle = "#737373";
        ctx.font = "11px 'Geist Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("click to play", cw / 2, ch / 2 + BALL_RADIUS + 22);
        ctx.globalAlpha = 1;
      }

      // ── PLAYING ───────────────────────────────────────────────────────────
      else if (state === "playing") {
        const ball = ballRef.current;
        if (!ball) { raf = requestAnimationFrame(loop); return; }

        const hard = hardModeRef.current;
        const { top: gTop, bottom: gBottom } = hard ? hardGoalBounds(ch) : goalBounds(ch);
        const elapsed   = now - startRef.current;
        const remaining = Math.max(0, GAME_MS - elapsed);
        const canvasRect = canvas!.getBoundingClientRect();
        const HIT_R = ball.radius + 4;

        if (remaining <= 0) { goOver(); raf = requestAnimationFrame(loop); return; }

        // ── Physics ────────────────────────────────────────────────────────
        const floorY = ch - GROUND_HEIGHT;

        ball.vy += GRAVITY;
        ball.vx *= DRAG;
        ball.vy *= DRAG;
        ball.x  += ball.vx;
        ball.y  += ball.vy;

        // Rolling on surface vs. in-air spin decay
        const onFloor = ball.y + ball.radius >= floorY - 1;
        const onCeil  = ball.y - ball.radius <= 1;
        if (onFloor || onCeil) {
          ball.spin = ball.vx / ball.radius; // rolling condition: ω = v/r
        } else {
          ball.spin *= SPIN_DECAY;
        }
        ball.angle += ball.spin;

        if (!hard) {
          const spd = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
          if (spd > 0 && spd < MIN_SPEED) {
            ball.vx = (ball.vx / spd) * MIN_SPEED;
            ball.vy = (ball.vy / spd) * MIN_SPEED;
          }
        }

        // ── Cursor hit ─────────────────────────────────────────────────────
        const cv = cursorVelocity();
        const px = cursorRef.current.x + cv.vx;
        const py = cursorRef.current.y + cv.vy;
        const dx = px - ball.x;
        const dy = py - ball.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < HIT_R && dist > 0.1) {
          const cspd    = Math.sqrt(cv.vx ** 2 + cv.vy ** 2);
          const impulse = Math.min(cspd / BALL_MASS, 20);
          ball.vx += cv.vx / BALL_MASS;
          ball.vy += cv.vy / BALL_MASS;
          const nx = (ball.x - px) / dist;
          const ny = (ball.y - py) / dist;
          const overlap = HIT_R - dist;
          ball.x += nx * overlap * 0.6;
          ball.y += ny * overlap * 0.6;
          ball.vx += nx * impulse * 0.25;
          ball.vy += ny * impulse * 0.25;
          ball.spin += cv.vx * 0.05;

          // Trigger goalie leap on every kick, but only if already landed (hard mode)
          const goalie = goalieRef.current;
          if (hard && goalie && goalie.state === "standing") {
            const { top: hTop, bottom: hBottom } = hardGoalBounds(ch);
            const range = hBottom - hTop - GOALIE_RADIUS * 2;
            goalie.leapToY       = hTop + GOALIE_RADIUS + Math.random() * range;
            goalie.leapFromY     = goalie.y;
            goalie.leapStartTime = now;
            goalie.state         = "leaping";
          }
        }

        // ── Goalie physics + ball collision (hard mode) ─────────────────────
        const goalie = hard ? goalieRef.current : null;
        if (goalie) {
          if (goalie.state === "leaping") {
            const t = Math.min(1, (now - goalie.leapStartTime) / GOALIE_LEAP_MS);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            goalie.y = goalie.leapFromY + (goalie.leapToY - goalie.leapFromY) * ease;
            if (t >= 1) { goalie.state = "falling"; goalie.vy = 0; }
          } else if (goalie.state === "falling") {
            goalie.vy += GRAVITY;
            goalie.y  += goalie.vy;
            if (goalie.y + GOALIE_RADIUS >= ch - GROUND_HEIGHT) {
              goalie.y  = ch - GROUND_HEIGHT - GOALIE_RADIUS;
              goalie.vy = 0;
              goalie.state = "standing";
            }
          }

          const gdx   = ball.x - goalie.x, gdy = ball.y - goalie.y;
          const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
          const gMin  = ball.radius + GOALIE_RADIUS;
          if (gdist < gMin && gdist > 0.01) {
            // Goalie saves the shot — reset the ball
            respawnBall(cw, ch, now);
            raf = requestAnimationFrame(loop); return;
          }
        }

        // ── Wall collisions ────────────────────────────────────────────────
        const wallX = cw - GOAL_DEPTH;

        // Goal post collisions — top crossbar only; bottom and side posts don't rebound
        {
          const pH = 5; // post thickness — must match drawGoal
          resolveAABBCircle(ball, { left: wallX - 1, top: gTop - pH, right: cw, bottom: gTop });
        }

        if (hard) {
          // Goal detection first
          if (ball.x + ball.radius >= wallX && ball.y > gTop && ball.y < gBottom) {
            scoreRef.current += 1;
            confettiRef.current.push(...spawnConfetti(wallX, gTop, gBottom, now));
            respawnBall(cw, ch, now);
            raf = requestAnimationFrame(loop); return;
          }
          // Hard mode: top bounces; left/right(non-goal) escape; grass is floor
          if (ball.y - ball.radius < 0) {
            ball.y  =  ball.radius;
            ball.vy =  Math.abs(ball.vy) * ELASTICITY;
            ball.vx *= FLOOR_FRICTION;
            ball.spin = ball.vx * 0.06;
          }
          const escaped = (
            ball.x - ball.radius < 0 ||
            (ball.x + ball.radius > wallX && !(ball.y > gTop && ball.y < gBottom))
          );
          if (escaped) {
            // Convert to layout-space coords (invariant across CSS-transform scroll)
            const cLeft = scrollContainerRef.current?.getBoundingClientRect().left ?? 0;
            escapedBallsRef.current.push({
              ...ball,
              x: ball.x + canvasRect.left - cLeft, // layout x
              y: ball.y + canvasRect.top,           // y is same in both spaces
            });
            respawnBall(cw, ch, now);
            raf = requestAnimationFrame(loop); return;
          }
          // Grass floor (hard mode — always a wall)
          if (ball.y + ball.radius > floorY) {
            ball.y  = floorY - ball.radius;
            ball.vy = -Math.abs(ball.vy) * ELASTICITY;
            ball.vx *= FLOOR_FRICTION;
            ball.spin = ball.vx * 0.06;
          }
        } else {
          // Normal mode: top bounces, grass is floor, left/right bounce or goal
          if (ball.y - ball.radius < 0) {
            ball.y  =  ball.radius;
            ball.vy =  Math.abs(ball.vy) * ELASTICITY;
            ball.vx *= FLOOR_FRICTION;
            ball.spin = ball.vx * 0.06; // same as ground — resets spin to rolling value
          }
          if (ball.y + ball.radius > floorY) {
            ball.y  = floorY - ball.radius;
            ball.vy = -Math.abs(ball.vy) * ELASTICITY;
            ball.vx *= FLOOR_FRICTION;
            ball.spin = -ball.spin * 0.4; // rolling takes over next frame
          }
          if (ball.x - ball.radius < 0) {
            ball.x  = ball.radius;
            ball.vx = Math.abs(ball.vx) * ELASTICITY;
            ball.spin += ball.vy * 0.04;
          }
          if (ball.x + ball.radius >= wallX) {
            if (ball.y > gTop && ball.y < gBottom) {
              scoreRef.current += 1;
              confettiRef.current.push(...spawnConfetti(wallX, gTop, gBottom, now));
              ballRef.current = spawnBall(cw, ch);
              bornRef.current = now;
              raf = requestAnimationFrame(loop); return;
            } else {
              ball.x  = wallX - ball.radius;
              ball.vx = -Math.abs(ball.vx) * ELASTICITY;
              ball.spin += ball.vy * 0.04;
            }
          }
        }

        // ── Active ball ↔ escaped balls collision ──────────────────────────
        if (hard && escapedBallsRef.current.length > 0) {
          // Project active ball into layout-space to collide with escaped balls
          const cLeft = scrollContainerRef.current?.getBoundingClientRect().left ?? 0;
          const vpBall: Ball = {
            ...ball,
            x: ball.x + canvasRect.left - cLeft,
            y: ball.y + canvasRect.top,
          };
          const ox = vpBall.x, oy = vpBall.y, ovx = vpBall.vx, ovy = vpBall.vy;
          for (const eb of escapedBallsRef.current) resolveBallBall(vpBall, eb);
          ball.x  += vpBall.x  - ox;
          ball.y  += vpBall.y  - oy;
          ball.vx += vpBall.vx - ovx;
          ball.vy += vpBall.vy - ovy;
        }

        // ── Escaped ball physics ───────────────────────────────────────────
        if (hard) {
          const gY  = groundYRef.current;
          // Convert cursor from viewport → layout-space each frame
          const cLeft = scrollContainerRef.current?.getBoundingClientRect().left ?? 0;
          const gcv = globalCursorVelocity();
          const gpx = (globalCursorRef.current.x - cLeft) + gcv.vx;
          const gpy = globalCursorRef.current.y + gcv.vy;
          const GHR = BALL_RADIUS + 4;

          for (const eb of escapedBallsRef.current) {
            eb.vy += GRAVITY;
            eb.vx *= DRAG;
            eb.vy *= DRAG;
            eb.x  += eb.vx;
            eb.y  += eb.vy;

            // Ground bounce
            if (eb.y + eb.radius >= gY) {
              eb.y  = gY - eb.radius;
              eb.vy = -Math.abs(eb.vy) * ELASTICITY;
              eb.vx *= FLOOR_FRICTION;
            }

            // Left page-edge bounce (so balls don't escape off the left)
            if (eb.x - eb.radius < 0) {
              eb.x  = eb.radius;
              eb.vx = Math.abs(eb.vx) * ELASTICITY;
            }

            // DOM + canvas rect collisions (page-absolute coords)
            for (const rect of collidablesRef.current) resolveAABBCircle(eb, rect);

            // Global cursor kick
            const edx   = gpx - eb.x, edy = gpy - eb.y;
            const edist = Math.sqrt(edx * edx + edy * edy);
            if (edist < GHR && edist > 0.1) {
              const gcspd    = Math.sqrt(gcv.vx ** 2 + gcv.vy ** 2);
              const gimpulse = Math.min(gcspd / BALL_MASS, 20);
              eb.vx += gcv.vx / BALL_MASS;
              eb.vy += gcv.vy / BALL_MASS;
              const enx = (eb.x - gpx) / edist;
              const eny = (eb.y - gpy) / edist;
              const eoverlap = GHR - edist;
              eb.x += enx * eoverlap * 0.6;
              eb.y += eny * eoverlap * 0.6;
              eb.vx += enx * gimpulse * 0.25;
              eb.vy += eny * gimpulse * 0.25;
            }

            // Spin & angle update AFTER all velocity changes (prevents rotation glitch at bounces)
            if (eb.y + eb.radius >= gY - 1) {
              eb.spin = eb.vx / eb.radius;
            } else {
              eb.spin *= SPIN_DECAY;
            }
            eb.angle += eb.spin;
          }

          // Escaped-escaped collisions
          for (let i = 0; i < escapedBallsRef.current.length; i++) {
            for (let j = i + 1; j < escapedBallsRef.current.length; j++) {
              resolveBallBall(escapedBallsRef.current[i], escapedBallsRef.current[j]);
            }
          }

          // Render escaped balls on the fixed overlay (layout-space → viewport)
          // x_viewport = x_layout + cLeft  (cLeft already computed above)
          if (overlayCtx && overlay) {
            overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
            for (const eb of escapedBallsRef.current) {
              drawBall(overlayCtx, { ...eb, x: eb.x + cLeft, y: eb.y });
            }
            // Cursor ring — check in layout-space, draw in viewport-space
            if (globalCursorRef.current.x > -9000) {
              const GHR2 = BALL_RADIUS + 4;
              const cursorLayoutX = globalCursorRef.current.x - cLeft;
              let near = false;
              for (const eb of escapedBallsRef.current) {
                const d = Math.sqrt(
                  (cursorLayoutX - eb.x) ** 2 +
                  (globalCursorRef.current.y - eb.y) ** 2
                );
                if (d < GHR2 * 2) { near = true; break; }
              }
              if (near) {
                overlayCtx.beginPath();
                overlayCtx.arc(globalCursorRef.current.x, globalCursorRef.current.y, GHR2, 0, Math.PI * 2);
                overlayCtx.strokeStyle = "rgba(255,77,0,0.7)";
                overlayCtx.lineWidth = 2.5;
                overlayCtx.setLineDash([3, 5]);
                overlayCtx.stroke();
                overlayCtx.setLineDash([]);
              }
            }
          }
        }

        // ── Confetti physics ──────────────────────────────────────────────
        for (const c of confettiRef.current) {
          c.vy += GRAVITY * 0.35;
          c.vx *= 0.98;
          c.x  += c.vx;
          c.y  += c.vy;
          c.angle += c.spin;
        }
        confettiRef.current = confettiRef.current.filter(c => now - c.born < CONFETTI_MS);

        // ── Draw ──────────────────────────────────────────────────────────
        ctx.clearRect(0, 0, cw, ch);
        drawGround(ctx, cw, ch);

        // Top border (hard mode only)
        if (hard) {
          ctx.fillStyle = "#ff4d00";
          ctx.fillRect(0, 0, cw, 5);
        }


        drawGoal(ctx, cw, gTop, gBottom);
        if (hard && goalie) drawGoalie(ctx, goalie);
        drawBall(ctx, ball);
        if (confettiRef.current.length > 0) drawConfetti(ctx, confettiRef.current, now);

        // Cursor hit-zone ring
        if (cursorRef.current.x > 0 && cursorRef.current.x < cw) {
          ctx.beginPath();
          ctx.arc(cursorRef.current.x, cursorRef.current.y, HIT_R, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,77,0,0.7)";
          ctx.lineWidth = 2.5;
          ctx.setLineDash([3, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Timer
        const secs   = Math.floor(remaining / 1000);
        const tenths = Math.floor((remaining % 1000) / 100);
        ctx.fillStyle  = remaining < 10_000 ? "#ff4d00" : "#737373";
        ctx.font       = "bold 20px 'Geist Mono', monospace";
        ctx.textAlign  = "center";
        ctx.fillText(`${secs}.${tenths}`, cw / 2, 34);

        // Score
        ctx.fillStyle = "#171717";
        ctx.font      = "13px 'Geist Mono', monospace";
        ctx.fillText(
          `${scoreRef.current} ${scoreRef.current === 1 ? "goal" : "goals"}`,
          cw / 2, 56
        );
      }

      // ── GAMEOVER ──────────────────────────────────────────────────────────
      else if (state === "gameover") {
        ctx.clearRect(0, 0, cw, ch);
        if (overlayCtx && overlay) overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillRect(0, 0, cw, ch);

        const big = Math.min(68, cw * 0.22);
        ctx.fillStyle  = "#171717";
        ctx.font       = `bold ${big}px 'Geist Mono', monospace`;
        ctx.textAlign  = "center";
        ctx.fillText(`${scoreRef.current}`, cw / 2, ch / 2 - 8);

        ctx.font      = "13px 'Geist Mono', monospace";
        ctx.fillStyle = "#737373";
        ctx.fillText(
          `${scoreRef.current === 1 ? "goal" : "goals"} in 60 seconds`,
          cw / 2, ch / 2 + 18
        );

        ctx.globalAlpha = 0.4 + Math.sin(now * 0.004) * 0.28;
        ctx.font        = "11px 'Geist Mono', monospace";
        ctx.fillStyle   = "#737373";
        ctx.fillText("click to play again", cw / 2, ch / 2 + 50);
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("click",      onClick);
      window.removeEventListener("mousemove",  onGlobalMouseMove);
    };
  }, []); // single mount — all state in refs

  // Sync hardMode state → ref
  useEffect(() => {
    hardModeRef.current = hardMode;
  }, [hardMode]);

  function toggleHardMode() {
    const next = !hardMode;
    const container = containerRef.current;
    if (container) {
      if (next) {
        // Extend container 50px upward only — bottom stays aligned with normal mode
        container.style.height    = (container.clientHeight + 50) + "px";
        container.style.transform = "translateY(-50px)";
      } else {
        container.style.height    = "";
        container.style.transform = "";
      }
    }
    setHardMode(next);
    hardModeRef.current = next;
    stateRef.current = "idle";
    setGameState("idle");
    escapedBallsRef.current = [];
    goalieRef.current = null;
  }

  return (
    <div ref={containerRef} className="hidden lg:flex flex-[2] relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: gameState === "playing" ? "none" : "default" }}
      />
      <button
        onClick={toggleHardMode}
        className="absolute bottom-2 right-3 font-mono text-[10px] text-(--muted) hover:text-(--foreground) transition-colors px-2 py-1 rounded border border-transparent hover:border-[rgba(0,0,0,0.12)]"
        style={{ zIndex: 10 }}
      >
        {hardMode ? "normal mode" : "hard mode"}
      </button>
      {mounted && hardMode && createPortal(
        <canvas
          ref={overlayRef}
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 9999,
            width: "100vw",
            height: "100vh",
          }}
        />,
        document.body
      )}
    </div>
  );
}
