"use client";

import { AnimatePresence, motion, useTransform, type MotionValue } from "motion/react";
import React from "react";
import dynamic from "next/dynamic";
import { MAX } from "@/components/sections/LineMinimap";
import { useClickOutside } from "@/lib/useClickOutside";
import AccentLine from "@/components/ui/AccentLine";

const ResumePdf = dynamic(() => import("@/components/ui/ResumePdf"), { ssr: false });

const JOBS = [
    {
        company: "Athena (Acquired)",
        role: "Founding Software Engineer",
        period: "May 2024 — Dec. 2025",
        bullets: [
            "Data pipeline cut essay transcription time 10×; auth feature cut account fraud 5×.",
            "Social strategy: 200k+ views, 50% DAU lift; led ops, managed team of 8.",
        ],
    },
    {
        company: "PricewaterhouseCoopers",
        role: "Technology and Data Solutions Intern",
        period: "June 2025 — Aug. 2025",
        bullets: [
            "Personalization algo for 7M+ users; 40% retention lift.",
            "Monte Carlo model: 2× revenue/employee uplift for client.",
        ],
    },
    {
        company: "Amazon",
        role: "Product Management Extern",
        period: "Jan. 2024 — April 2024",
        bullets: [
            "Surveys and A/B tests to surface pain points and features.",
            "Prototyped Echo Show feature; presented to Amazon leadership.",
        ],
    },
];

const JOB_RANGES: [number, number][] = [
    [MAX * 0.05, MAX * 0.27],
    [MAX * 0.1, MAX * 0.3],
    [MAX * 0.15, MAX * 0.33],
];

const RESUME_PDF = "/resume.pdf";

const PANEL_SPRING = {
    type: "spring",
    stiffness: 220,
    damping: 40,
    mass: 1.2,
} as const;

function useViewportSize() {
    const [size, setSize] = React.useState({ w: 0, h: 0 });
    React.useEffect(() => {
        function update() {
            setSize({ w: window.innerWidth, h: window.innerHeight });
        }
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);
    return size;
}

function ResumePill() {
    const [open, setOpen] = React.useState(false);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const { w, h } = useViewportSize();
    const [pillWidth, setPillWidth] = React.useState(100);

    React.useLayoutEffect(() => {
        if (rootRef.current) setPillWidth(rootRef.current.scrollWidth);
    }, []);

    // Panel fills the right half of the viewport with padding
    const panelW = Math.max(w * 0.5 - 48, 320);
    const panelH = Math.max(h - 100 - 120, 300);

    // PDF content width = panel width minus padding (2 * 16px)
    const contentW = panelW - 32;

    const close = React.useCallback(() => setOpen(false), []);
    useClickOutside(rootRef, close);

    // When the panel is open, intercept wheel events and redirect them to the PDF scroll container
    React.useEffect(() => {
        if (!open) return;
        const el = rootRef.current;
        if (!el) return;
        function handleWheel(e: WheelEvent) {
            e.preventDefault();
            if (scrollRef.current) scrollRef.current.scrollTop += e.deltaY;
        }
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [open]);

    return (
        <motion.div
            ref={rootRef}
            className="bg-(--background) border border-neutral-200 shadow-lg overflow-hidden flex flex-col"
            onClick={!open ? () => setOpen(true) : undefined}
            role={!open ? "button" : undefined}
            tabIndex={!open ? 0 : undefined}
            aria-label={!open ? "Open resume" : undefined}
            onKeyDown={
                !open
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setOpen(true);
                          }
                      }
                    : undefined
            }
            style={{ cursor: open ? "default" : "pointer" }}
            initial={false}
            animate={{
                width: open ? panelW : pillWidth,
                height: open ? panelH : 44,
                borderRadius: open ? 14 : 22,
            }}
            whileHover={!open ? { scale: 1.3 } : {}}
            whileTap={!open ? { scale: 0.97 } : {}}
            transition={{
                ...PANEL_SPRING,
                delay: open ? 0 : 0.05,
                scale: { type: "spring", stiffness: 250, damping: 25 },
            }}
        >
            {/* Header row — pill when closed, panel header when open */}
            <div
                className={`relative flex items-center justify-center px-4 h-[44px] shrink-0 whitespace-nowrap${open ? " border-b border-neutral-200" : ""}`}
            >
                <span className="text-sm font-mono tracking-wide text-(--foreground)">Resume</span>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-4 flex items-center gap-4"
                        >
                            <a
                                href={RESUME_PDF}
                                download
                                className="text-xs font-mono text-(--muted) hover:text-(--foreground) transition-colors"
                            >
                                Download
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* PDF — always mounted, canvas re-renders at liveWidth each frame of the morph.
                inert when collapsed so its annotation-layer links/canvas can't steal Tab focus. */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-scroll overflow-x-hidden flex justify-center p-4"
                inert={!open}
            >
                <ResumePdf file={RESUME_PDF} width={contentW} />
            </div>
        </motion.div>
    );
}

function JobRow({
    job,
    scrollX,
    inputRange,
}: {
    job: (typeof JOBS)[number];
    scrollX: MotionValue<number>;
    inputRange: [number, number];
}) {
    const opacity = useTransform(scrollX, inputRange, [0, 1]);
    const y = useTransform(scrollX, inputRange, [16, 0]);

    return (
        <motion.div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4 max-[480px]:gap-2 lg:gap-8 max-w-full lg:max-w-[45vw]" style={{ opacity, y }}>
            <div>
                <p className="text-[clamp(0.75rem,1.2vw,1rem)] font-semibold">{job.company}</p>
                <p className="text-[clamp(0.65rem,1.2vw,0.875rem)] text-(--muted) font-mono mt-1">{job.period}</p>
            </div>
            <div>
                <p className="text-[clamp(0.65rem,1.2vw,0.875rem)] font-mono text-(--muted) uppercase tracking-widest mb-2">{job.role}</p>
                <ul className="space-y-1">
                    {job.bullets.map((b) => (
                        <li key={b} className="text-[clamp(0.65rem,1.2vw,0.875rem)] text-(--muted) leading-relaxed">
                            <span className="text-(--accent) mr-2">—</span>
                            {b}
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
}

export default function WorkExperience({ scrollX }: { scrollX: MotionValue<number> }) {
    const headerOpacity = useTransform(scrollX, [MAX * 0.0, MAX * 0.2], [0, 1]);
    const headerY = useTransform(scrollX, [MAX * 0.0, MAX * 0.2], [24, 0]);

    return (
        <section className="relative h-screen flex flex-col justify-center pt-(--minimap-safe-top) lg:pt-0 px-8 lg:px-24">
            <motion.p
                className="text-sm font-mono tracking-widest uppercase text-(--muted) mb-6 max-[480px]:mb-3"
                style={{ opacity: headerOpacity, y: headerY }}
            >
                Work Experience
            </motion.p>
            <motion.h2
                className="text-[clamp(3rem,7.8vw,6.5rem)] font-semibold leading-[0.9] tracking-tight max-[480px]:text-[2.25rem]"
                style={{ opacity: headerOpacity, y: headerY }}
            >
                Experience
            </motion.h2>
            <AccentLine />
            <motion.div
                className="mt-6 mb-[clamp(1rem,3vw,2.5rem)] max-w-full lg:max-w-[40vw] flex flex-col gap-2 max-[480px]:mt-3 max-[480px]:mb-4"
                style={{ opacity: headerOpacity, y: headerY }}
            >
                <p className="text-[clamp(0.75rem,1.2vw,1rem)] leading-relaxed text-(--muted) font-mono">
                    <span className="text-(--accent) font-mono mr-2">1.</span>
                    At <span className="text-(--foreground) font-medium">Athena</span>, I learned the best signals
                    come from <span className="text-(--foreground) font-medium">field work</span>: direct user
                    interaction.
                </p>
                <p className="text-[clamp(0.75rem,1.2vw,1rem)] leading-relaxed text-(--muted) font-mono">
                    <span className="text-(--accent) font-mono mr-2">2.</span>
                    At <span className="text-(--foreground) font-medium">PwC</span>, I learned{" "}
                    <span className="text-(--foreground) font-medium">data</span> is field work at scale, revealing
                    patterns no single interaction can.
                </p>
            </motion.div>
            <div className="flex flex-col gap-[clamp(1rem,3vw,2.5rem)] max-[480px]:gap-3">
                {JOBS.map((job, i) => (
                    <JobRow key={job.company} job={job} scrollX={scrollX} inputRange={JOB_RANGES[i]} />
                ))}
            </div>

            {/* Mobile resume link — opens PDF in new tab */}
            <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="block lg:hidden mt-8 max-[480px]:mt-4 w-fit px-5 py-2.5 rounded-full border border-neutral-200 shadow-sm text-sm font-mono text-(--foreground) hover:bg-neutral-50 transition-colors"
            >
                Resume ↗
            </a>

            {/* Desktop resume pill — expand-in-place panel */}
            <div className="hidden lg:flex absolute left-[50vw] top-[100px] w-[50vw] h-[calc(100%-100px)] items-center justify-center z-10">
                <ResumePill />
            </div>
        </section>
    );
}
