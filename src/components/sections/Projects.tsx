"use client";

import React from "react";
import { motion, AnimatePresence, useTransform, type MotionValue } from "motion/react";
import { MAX } from "@/components/sections/LineMinimap";
import { useClickOutside } from "@/lib/useClickOutside";

// ── Data ──────────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    emoji: "🎨",
    name: "Palettify",
    desc: "AI color palette generator with brand-aware suggestions.",
    fullDesc:
      "Palettify analyzes your brand assets and generates cohesive color palettes that match your identity. Integrates directly with Figma via plugin, letting designers apply AI-suggested palettes in one click. Supports WCAG accessibility checks and exports to CSS variables, Tailwind config, or design tokens.",
    tags: ["React", "OpenAI", "Figma API"],
    bg: "#FFF0F0",
    accent: "#FF6B6B",
    links: { github: "https://github.com", live: "https://example.com" },
    images: [] as string[],
  },
  {
    emoji: "📊",
    name: "DataPulse",
    desc: "Real-time analytics dashboard with drag-and-drop widgets.",
    fullDesc:
      "DataPulse is a modular analytics platform that streams live metrics via WebSocket and renders them as interactive D3.js visualizations. Users can build custom dashboards by dragging widget tiles, configure alert thresholds, and share snapshots with a permalink. Handles 50k events/second in production.",
    tags: ["Vue", "D3.js", "WebSocket"],
    bg: "#F0FAFA",
    accent: "#4ECDC4",
    links: { github: "https://github.com" },
    images: [] as string[],
  },
  {
    emoji: "🎮",
    name: "PixelForge",
    desc: "In-browser pixel art editor with animation timeline.",
    fullDesc:
      "PixelForge brings a full-featured pixel art workflow to the browser using the Canvas API. Draw, fill, and erase at any resolution, manage animation frames on a timeline, and preview sprite sheets side-by-side. Exports to PNG, GIF, or structured JSON for game engines.",
    tags: ["Canvas API", "TypeScript"],
    bg: "#FFFDE8",
    accent: "#D4A800",
    links: { github: "https://github.com", live: "https://example.com" },
    images: [] as string[],
  },
  {
    emoji: "🌿",
    name: "Rootd",
    desc: "Plant care companion app with smart watering schedules.",
    fullDesc:
      "Rootd tracks your plants and builds adaptive watering schedules based on species data, local weather via API, and the sensor readings from an optional Bluetooth soil probe. Push notifications remind you before a plant dries out. SQLite keeps everything offline-first.",
    tags: ["React Native", "SQLite"],
    bg: "#F0FAF5",
    accent: "#00B894",
    links: { github: "https://github.com" },
    images: [] as string[],
  },
  {
    emoji: "✉️",
    name: "Nudge",
    desc: "AI email assistant that summarizes threads and drafts replies.",
    fullDesc:
      "Nudge plugs into Gmail and uses GPT-4 to surface the most important threads each morning, summarize long conversations into a single paragraph, and suggest reply drafts tuned to your writing style. Learns from accepted vs. discarded suggestions over time.",
    tags: ["Next.js", "GPT-4", "Gmail API"],
    bg: "#F5F0FF",
    accent: "#7C3AED",
    links: { github: "https://github.com", live: "https://example.com" },
    images: [] as string[],
  },
  {
    emoji: "🎵",
    name: "Waveform",
    desc: "Collaborative music production for remote bands. Real-time sync.",
    fullDesc:
      "Waveform gives distributed bands a shared DAW in the browser. Each member's track is streamed via WebRTC with sub-100ms latency. The Web Audio API handles mixing, effects, and a shared metronome. Sessions are recorded server-side and exported as mixed-down MP3 or individual stems.",
    tags: ["WebRTC", "Web Audio API"],
    bg: "#FFF0F2",
    accent: "#FF4757",
    links: { github: "https://github.com" },
    images: [] as string[],
  },
];

type Project = (typeof PROJECTS)[number];

// ── Physics constants ─────────────────────────────────────────────────────────

const CW = 264;
const CH = 192;
const GAP = 22;
const COLS = 3;
const STAGE_W = COLS * CW + (COLS - 1) * GAP + 8; // 836px
const DETAIL_W = 520;
const DETAIL_H = 560;

const GRID_POS = PROJECTS.map((_, i) => ({
  x: (i % COLS) * (CW + GAP) + 4,
  y: Math.floor(i / COLS) * (CH + GAP) + 4,
  r: 0,
}));

const CHAOS_BASES = [
  { x: 16,  y: 16,  r: -5 },
  { x: 316, y: 44,  r:  4 },
  { x: 605, y: 10,  r: -3 },
  { x: 90,  y: 255, r:  6 },
  { x: 380, y: 272, r: -4 },
  { x: 668, y: 248, r:  3 },
];

interface PhysState {
  bx: number; by: number; br: number;
  x: number;  y: number;  rot: number;
  vx: number; vy: number; rotV: number;
  fx: number; fy: number;
  px: number; py: number;
  wob: boolean; wobT: number;
}

// ── ProjectDetail ─────────────────────────────────────────────────────────────

function ProjectDetail({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full p-[26px] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div
            className="w-[36px] h-[3px] rounded-full mb-3"
            style={{ backgroundColor: project.accent }}
          />
          <span className="text-[28px] leading-none block mb-2">{project.emoji}</span>
          <h3 className="text-[20px] font-semibold text-[#1A1A2E] leading-tight">
            {project.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-900 transition-colors text-[22px] leading-none mt-1 cursor-pointer select-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Full description */}
      <p className="text-[13px] leading-relaxed text-[#44445A] mb-5">
        {project.fullDesc}
      </p>

      {/* Images row (placeholder) */}
      {project.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-5 pb-1">
          {project.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`${project.name} screenshot ${i + 1}`}
              className="h-[100px] rounded-[10px] border border-neutral-200 flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Tech tags */}
      <div className="flex gap-[6px] flex-wrap mb-5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] font-semibold px-[10px] py-[3px] rounded-full border border-neutral-900"
            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1A1A2E" }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Links */}
      <div className="flex gap-3 mt-auto">
        {project.links.github && (
          <a
            href={project.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-semibold px-4 py-2 rounded-full border-[2px] border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
          >
            GitHub ↗
          </a>
        )}
        {project.links.live && (
          <a
            href={project.links.live}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-semibold px-4 py-2 rounded-full border-[2px] border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            Live ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Projects({ scrollX }: { scrollX: MotionValue<number> }) {
  const [mode, setMode] = React.useState<"chaos" | "order">("chaos");
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const prevSelectedRef = React.useRef<number | null>(null);
  const modeRef = React.useRef(mode);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const detailRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const mouseRef = React.useRef({ x: -999, y: -999 });

  const physRef = React.useRef<PhysState[]>(
    CHAOS_BASES.map((b) => ({
      bx: b.x, by: b.y, br: b.r,
      x: b.x,  y: b.y,  rot: b.r,
      vx: 0, vy: 0, rotV: 0,
      fx: 0.28 + Math.random() * 0.35,
      fy: 0.22 + Math.random() * 0.35,
      px: Math.random() * Math.PI * 2,
      py: Math.random() * Math.PI * 2,
      wob: false, wobT: 0,
    }))
  );

  React.useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Keep prevSelectedRef one render behind so the returning card gets the spring
  React.useEffect(() => {
    prevSelectedRef.current = selectedIndex;
  }, [selectedIndex]);

  // Click-outside closes detail panel
  useClickOutside(detailRef, () => {
    if (selectedIndex !== null) setSelectedIndex(null);
  });

  // Escape key closes detail panel
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedIndex(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Track mouse relative to stage
  React.useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const stage = stageRef.current;
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, []);

  // Animation loop — directly writes to DOM, no React re-renders
  React.useEffect(() => {
    let raf: number;

    function tick() {
      const t = performance.now() / 1000;
      const { x: mX, y: mY } = mouseRef.current;
      const phys = physRef.current;
      const cards = cardRefs.current;
      const m = modeRef.current;

      phys.forEach((p, i) => {
        let tx: number, ty: number, tr: number;

        if (m === "chaos") {
          tx = p.bx + Math.sin(t * p.fx + p.px) * 20;
          ty = p.by + Math.cos(t * p.fy + p.py) * 16;
          tr = p.br + Math.sin(t * 0.55 + p.px) * 2.2;

          const cx = p.x + CW / 2;
          const cy = p.y + CH / 2;
          const dx = cx - mX;
          const dy = cy - mY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 240 && dist > 0) {
            const force = Math.pow((240 - dist) / 240, 1.8) * 72;
            tx += (dx / dist) * force;
            ty += (dy / dist) * force;
          }
        } else {
          tx = GRID_POS[i].x;
          ty = GRID_POS[i].y;
          tr = 0;
        }

        if (p.wob) {
          p.wobT += 0.22;
          tr += Math.sin(p.wobT * 5) * 6 * Math.exp(-p.wobT * 0.12);
        }

        const k    = m === "order" ? 0.13  : 0.075;
        const damp = m === "order" ? 0.70  : 0.78;

        p.vx += (tx - p.x) * k;   p.vx *= damp;  p.x += p.vx;
        p.vy += (ty - p.y) * k;   p.vy *= damp;  p.y += p.vy;
        p.rotV += (tr - p.rot) * 0.11; p.rotV *= 0.72; p.rot += p.rotV;

        const card = cards[i];
        if (card) {
          card.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
        }
      });

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const headerOpacity = useTransform(scrollX, [MAX * 0.30, MAX * 0.52], [0, 1]);
  const headerY = useTransform(scrollX, [MAX * 0.30, MAX * 0.52], [24, 0]);

  return (
    <section className="h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24">
      <motion.p
        className="text-sm font-mono tracking-widest uppercase text-(--muted) mb-4"
        style={{ opacity: headerOpacity, y: headerY }}
      >
        Selected Work
      </motion.p>
      <motion.h2
        className="text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.9] tracking-tight mb-6"
        style={{ opacity: headerOpacity, y: headerY }}
      >
        Projects<span className="text-(--accent)">.</span>
      </motion.h2>

      {/* Mode toggle */}
      <motion.div className="flex gap-3 mb-6" style={{ opacity: headerOpacity }}>
        {(["chaos", "order"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs font-mono px-4 py-1.5 rounded-full border border-neutral-900 cursor-pointer select-none transition-colors ${
              mode === m
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            {m === "chaos" ? "✦ Chaos" : "⊞ Order"}
          </button>
        ))}
      </motion.div>

      {/* Stage — panel lives inside as an absolute child so it never affects layout */}
      <div
        ref={stageRef}
        className="relative flex-shrink-0"
        style={{
          width: STAGE_W,
          height: mode === "order" ? 420 : 480,
          transition: "height .5s cubic-bezier(.34, 1.1, .64, 1)",
        }}
      >
          {PROJECTS.map((p, i) => (
            <div
              key={p.name}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="absolute top-0 left-0"
              style={{
                width: CW,
                willChange: "transform",
                visibility: selectedIndex === i ? "hidden" : "visible",
              }}
              onMouseEnter={() => {
                physRef.current[i].wob = true;
                physRef.current[i].wobT = 0;
              }}
              onMouseLeave={() => {
                physRef.current[i].wob = false;
              }}
              onClick={() => setSelectedIndex(i)}
            >
              <motion.div
                layoutId={`card-${i}`}
                className="rounded-[22px] border-[2.5px] border-neutral-900 cursor-pointer select-none p-[22px]"
                style={{
                  backgroundColor: p.bg,
                  boxShadow: `4px 4px 0 ${p.accent}`,
                }}
                transition={
                  selectedIndex === i || prevSelectedRef.current === i
                    ? { type: "spring", stiffness: 550, damping: 45, mass: 0.7 }
                    : { duration: 0 }
                }
              >
                <span className="block text-[26px] mb-[11px] leading-none">{p.emoji}</span>
                <div className="font-semibold text-base mb-[5px]" style={{ color: "#1A1A2E" }}>
                  {p.name}
                </div>
                <div className="text-[13px] leading-relaxed mb-[14px]" style={{ color: "#44445A" }}>
                  {p.desc}
                </div>
                <div className="flex gap-[5px] flex-wrap">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-semibold px-[10px] py-[3px] rounded-full border border-neutral-900"
                      style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1A1A2E" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          ))}

          {/* Detail panel — absolute inside the stage, to the right; zero layout impact */}
          <div
            ref={detailRef}
            className="absolute bottom-0"
            style={{ left: STAGE_W + 128 }}
          >
            <AnimatePresence>
              {selectedIndex !== null && (
                <motion.div
                  key={selectedIndex}
                  layoutId={`card-${selectedIndex}`}
                  className="overflow-hidden rounded-[22px] border-[2.5px] border-neutral-900 bg-white"
                  style={{ width: DETAIL_W, height: DETAIL_H }}
                  transition={{ type: "spring", stiffness: 550, damping: 45, mass: 0.7 }}
                >
                  <motion.div
                    key={selectedIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ width: DETAIL_W, height: DETAIL_H }}
                  >
                    <ProjectDetail
                      project={PROJECTS[selectedIndex]}
                      onClose={() => setSelectedIndex(null)}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
    </section>
  );
}
