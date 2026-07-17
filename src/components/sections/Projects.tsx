"use client";

import React from "react";
import { motion, AnimatePresence, useTransform, type MotionValue } from "motion/react";
import { MAX } from "@/components/sections/LineMinimap";
import { useClickOutside } from "@/lib/useClickOutside";
import AccentLine from "@/components/ui/AccentLine";

// ── Data ──────────────────────────────────────────────────────────────────────

const PROJECTS = [
    {
        emoji: "⏱️",
        name: "Log15",
        desc: "Desktop productivity tracker — prompts you every 15 min to log what you're working on.",
        fullDesc:
            "Log15 is a full-stack desktop app built with Tauri and Rust on the backend, React + TypeScript on the frontend, and SQLite for local data persistence. It surfaces interactive time-tracking visualizations via Recharts and uses an automated daily archiving schema to keep data retrieval fast as logs grow.",
        tags: ["Tauri", "Rust", "React", "SQLite"],
        bg: "#F0F0FF",
        accent: "#6366F1",
        links: { github: "https://github.com/rolin-rolin/log15" },
        images: ["/projects/log15_project.png"],
    },
    {
        emoji: "💊",
        name: "OAPacks",
        desc: "Bootstrapping a sports nutrition startup — first $625 in 3 days of door-to-door sales.",
        fullDesc:
            "OAPacks is a sports nutrition startup I co-founded and am currently bootstrapping. Generated first $625 in revenue within 3 days through 50 door-to-door sales attempts. Advanced in Notre Dame's McCloskey Startup Competition as the only freshman-led team among 180 entrants.",
        tags: ["Startup", "Sales", "Entrepreneurship"],
        bg: "#FFF7ED",
        accent: "#F97316",
        links: {},
        images: ["/projects/oapacks_project.png"],
    },
    {
        emoji: "🧬",
        name: "OARecs",
        desc: "Personalized nutrition pack recommendations from biometric data and taste preferences.",
        fullDesc:
            "OARecs is a recommendation engine for OAPacks customers. A FastAPI backend runs PyTorch models and uses Chroma for vector similarity search to match users to ideal nutrition packs based on biometric data and taste preferences. The frontend is built with Next.js, TypeScript, and Tailwind.",
        tags: ["Next.js", "FastAPI", "PyTorch", "Chroma"],
        bg: "#F0FFF4",
        accent: "#16A34A",
        links: { live: "https://oa-recs.vercel.app" },
        images: ["/projects/oarecs_project_1.png", "/projects/oarecs_project_2.png"],
    },
    {
        emoji: "🗄️",
        name: "SQL Chat",
        desc: "Optimized an AI-powered open-source database tool, cutting query latency in half.",
        fullDesc:
            "Contributed to SQL Chat, an open-source AI-powered database interface, for a professional networking company. Identified and resolved bottlenecks that cut query latency by 50%. Deployed a production-ready Docker instance on a company virtual machine.",
        tags: ["TypeScript", "PostgreSQL", "Docker"],
        bg: "#F0F9FF",
        accent: "#0EA5E9",
        links: { live: "https://sqlchat.ai" },
        images: ["/projects/sqlchat_project.png"],
    },
    {
        emoji: "✉️",
        name: "app to make rideshare cheaper",
        desc: "Coming soon.",
        fullDesc: "Coming soon.",
        tags: [] as string[],
        bg: "#F5F0FF",
        accent: "#7C3AED",
        links: {},
        images: [] as string[],
        disabled: true,
    },
    {
        emoji: "🎵",
        name: "something related to coding workflows",
        desc: "Coming soon.",
        fullDesc: "Coming soon.",
        tags: [] as string[],
        bg: "#FFF0F2",
        accent: "#FF4757",
        links: {},
        images: [] as string[],
        disabled: true,
    },
];

type Project = (typeof PROJECTS)[number];

// ── Physics constants ─────────────────────────────────────────────────────────

const CW = 210;
const CH = 155;
const STAGE_W = 830; // 2 × 310px strides + CW

// 100px horizontal gutters (310px column stride), 150px vertical gutters (305px row stride)
const CHAOS_BASES = [
    { x: 0, y: 0, r: -5 },
    { x: 310, y: 12, r: 4 },
    { x: 620, y: 0, r: -3 },
    { x: 20, y: 305, r: 6 },
    { x: 315, y: 315, r: -4 },
    { x: 615, y: 298, r: 3 },
];

interface PhysState {
    bx: number;
    by: number;
    br: number;
    x: number;
    y: number;
    rot: number;
    vx: number;
    vy: number;
    rotV: number;
    fx: number;
    fy: number;
    px: number;
    py: number;
    wob: boolean;
    wobT: number;
}

// ── ProjectDetail ─────────────────────────────────────────────────────────────

function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
    return (
        <div className="h-full overflow-y-scroll p-[26px]">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="w-[36px] h-[3px] rounded-full mb-3" style={{ backgroundColor: project.accent }} />
                    <span className="text-[28px] leading-none block mb-2">{project.emoji}</span>
                    <h3 className="text-[20px] font-semibold text-[#1A1A2E] leading-tight">{project.name}</h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-neutral-400 hover:text-neutral-900 transition-colors text-[22px] leading-none mt-1 cursor-pointer select-none"
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            <p className="text-[13px] leading-relaxed text-[#44445A] mb-4">{project.fullDesc}</p>

            {project.images.length > 0 && (
                <div className="flex flex-col gap-3 mb-4">
                    {project.images.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={i}
                            src={src}
                            alt={`${project.name} screenshot ${i + 1}`}
                            className="w-full h-auto rounded-[10px] border border-neutral-200"
                        />
                    ))}
                </div>
            )}

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

            <div className="flex gap-3">
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
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
    const stageRef = React.useRef<HTMLDivElement>(null);
    const detailRef = React.useRef<HTMLDivElement>(null);
    const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const mouseRef = React.useRef({ x: -999, y: -999 });

    const physRef = React.useRef<PhysState[]>(
        CHAOS_BASES.map((b) => ({
            bx: b.x,
            by: b.y,
            br: b.r,
            x: b.x,
            y: b.y,
            rot: b.r,
            vx: 0,
            vy: 0,
            rotV: 0,
            fx: 0.28 + Math.random() * 0.35,
            fy: 0.22 + Math.random() * 0.35,
            px: Math.random() * Math.PI * 2,
            py: Math.random() * Math.PI * 2,
            wob: false,
            wobT: 0,
        })),
    );

    useClickOutside(detailRef, () => {
        if (selectedIndex !== null) setSelectedIndex(null);
    });

    const [stageScale, setStageScale] = React.useState(1);
    const stageScaleRef = React.useRef(1);
    const stageWrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const el = stageWrapperRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const mobile = window.innerWidth < 1024;
            const scale = Math.min((entry.contentRect.width / STAGE_W) * (mobile ? 0.75 : 1), 1);
            stageScaleRef.current = scale;
            setStageScale(scale);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    React.useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setSelectedIndex(null);
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    React.useEffect(() => {
        function onMouseMove(e: MouseEvent) {
            const stage = stageRef.current;
            if (!stage) return;
            const r = stage.getBoundingClientRect();
            const scale = stageScaleRef.current;
            mouseRef.current = { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
        }
        document.addEventListener("mousemove", onMouseMove);
        return () => document.removeEventListener("mousemove", onMouseMove);
    }, []);

    // Animation loop — chaos only, directly writes to DOM
    React.useEffect(() => {
        let raf: number;

        function tick() {
            const t = performance.now() / 1000;
            const { x: mX, y: mY } = mouseRef.current;
            const phys = physRef.current;
            const cards = cardRefs.current;

            phys.forEach((p, i) => {
                let tx = p.bx + Math.sin(t * p.fx + p.px) * 20;
                let ty = p.by + Math.cos(t * p.fy + p.py) * 16;
                let tr = p.br + Math.sin(t * 0.55 + p.px) * 2.2;

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

                if (p.wob) {
                    p.wobT += 0.22;
                    tr += Math.sin(p.wobT * 5) * 6 * Math.exp(-p.wobT * 0.12);
                }

                p.vx += (tx - p.x) * 0.075;
                p.vx *= 0.78;
                p.x += p.vx;
                p.vy += (ty - p.y) * 0.075;
                p.vy *= 0.78;
                p.y += p.vy;
                p.rotV += (tr - p.rot) * 0.11;
                p.rotV *= 0.72;
                p.rot += p.rotV;

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

    const headerOpacity = useTransform(scrollX, [MAX * 0.3, MAX * 0.52], [0, 1]);
    const headerY = useTransform(scrollX, [MAX * 0.3, MAX * 0.52], [24, 0]);

    return (
        <section className="h-screen flex flex-col justify-center px-8 lg:px-24">
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-8 lg:gap-6 lg:flex-1 min-h-0">
                {/* Left column — title, subtitle, and detail panel overlay */}
                <div className="lg:flex-[35] relative flex flex-col lg:justify-center min-w-0">
                    <motion.p
                        className="text-sm font-mono tracking-widest uppercase text-(--muted) mb-4"
                        style={{ opacity: headerOpacity, y: headerY }}
                    >
                        Selected Work
                    </motion.p>
                    <motion.h2
                        className="text-[clamp(2rem,6vw,6.5rem)] font-semibold leading-[0.9] tracking-tight"
                        style={{ opacity: headerOpacity, y: headerY }}
                    >
                        Projects
                    </motion.h2>
                    <AccentLine />
                    <motion.div className="mt-6 flex flex-col gap-2" style={{ opacity: headerOpacity, y: headerY }}>
                        <p className="text-[clamp(0.75rem,1.4vw,1rem)] leading-relaxed text-(--muted) font-mono">
                            <span className="text-(--accent) font-mono mr-2">1.</span>I love actually{" "}
                            <span className="text-(--foreground) font-medium">owning</span> my work — scoping, shipping,
                            watching users interact with it, and iterating.
                        </p>
                        <p className="text-[clamp(0.75rem,1.4vw,1rem)] leading-relaxed text-(--muted) font-mono">
                            <span className="text-(--accent) font-mono mr-2">2.</span>
                            At <span className="text-(--foreground) font-medium">Athena</span>, I learned that while
                            data is great, the best signals come from{" "}
                            <span className="text-(--foreground) font-medium">field work</span>: direct conversations
                            with users that tell you what no metric can.
                        </p>
                    </motion.div>

                    {/* Detail panel slides in over the left column when a card is selected */}
                    <AnimatePresence>
                        {selectedIndex !== null && (
                            <motion.div
                                ref={detailRef}
                                key={selectedIndex}
                                className="absolute inset-[5%] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[90%] lg:aspect-[3/4] rounded-[22px] border-[2.5px] border-neutral-900 bg-white overflow-hidden z-10"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
                                onWheel={(e) => e.stopPropagation()}
                            >
                                <ProjectDetail project={PROJECTS[selectedIndex]} onClose={() => setSelectedIndex(null)} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Card stage — shown on all sizes, scales to fit */}
                <div ref={stageWrapperRef} className="flex lg:flex-[65] items-center justify-center min-h-0 min-w-0">
                    <div
                        style={{
                            width: STAGE_W * stageScale,
                            height: 460 * stageScale,
                            position: "relative",
                            flexShrink: 0,
                        }}
                    >
                        <div
                            ref={stageRef}
                            style={{
                                width: STAGE_W,
                                height: 460,
                                transform: `scale(${stageScale})`,
                                transformOrigin: "top left",
                                position: "absolute",
                                top: 0,
                                left: 0,
                            }}
                        >
                            {PROJECTS.map((p, i) => (
                                <div
                                    key={p.name}
                                    ref={(el) => {
                                        cardRefs.current[i] = el;
                                    }}
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
                                    onClick={p.disabled ? undefined : () => setSelectedIndex(i)}
                                    role={p.disabled ? undefined : "button"}
                                    tabIndex={p.disabled ? undefined : 0}
                                    aria-label={p.disabled ? undefined : `View ${p.name} project details`}
                                    onKeyDown={
                                        p.disabled
                                            ? undefined
                                            : (e) => {
                                                  if (e.key === "Enter" || e.key === " ") {
                                                      e.preventDefault();
                                                      setSelectedIndex(i);
                                                  }
                                              }
                                    }
                                >
                                    <div
                                        className={`rounded-[22px] border-[2.5px] border-neutral-900 select-none p-[22px] ${
                                            p.disabled ? "cursor-default" : "cursor-pointer"
                                        }`}
                                        style={{
                                            backgroundColor: p.bg,
                                            boxShadow: `4px 4px 0 ${p.accent}`,
                                        }}
                                    >
                                        <span className="block text-[26px] mb-[11px] leading-none">{p.emoji}</span>
                                        <div className="font-semibold text-base mb-[5px]" style={{ color: "#1A1A2E" }}>
                                            {p.name}
                                        </div>
                                        <div
                                            className="text-[13px] leading-relaxed mb-[14px]"
                                            style={{ color: "#44445A" }}
                                        >
                                            {p.desc}
                                        </div>
                                        {p.tags.length > 0 && (
                                            <div className="flex gap-[5px] flex-wrap">
                                                {p.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-[11px] font-semibold px-[10px] py-[3px] rounded-full border border-neutral-900"
                                                        style={{
                                                            backgroundColor: "rgba(255,255,255,0.7)",
                                                            color: "#1A1A2E",
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
