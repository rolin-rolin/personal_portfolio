"use client";

import { AnimatePresence, motion, useTransform, type MotionValue } from "motion/react";
import React from "react";
import { MAX } from "@/components/sections/LineMinimap";
import { useClickOutside } from "@/lib/useClickOutside";

const JOBS = [
  {
    company: "Acme Corp",
    role: "Senior Software Engineer",
    period: "2022 — Present",
    bullets: [
      "Led migration from monolith to microservices, cutting p99 latency by 40%.",
      "Architected real-time data pipeline handling 50k events/sec.",
    ],
  },
  {
    company: "Startup Inc",
    role: "Software Engineer",
    period: "2020 — 2022",
    bullets: [
      "Built core product features from 0→1, contributing to Series A fundraise.",
      "Owned frontend architecture, improving LCP from 4.2s to 1.1s.",
    ],
  },
  {
    company: "Big Tech Co",
    role: "Software Engineer Intern",
    period: "Summer 2019",
    bullets: ["Shipped A/B experiment that increased user engagement by 12%."],
  },
];

const JOB_RANGES: [number, number][] = [
  [MAX * 0.05, MAX * 0.27],
  [MAX * 0.10, MAX * 0.30],
  [MAX * 0.15, MAX * 0.33],
];

// TODO: Drop your resume PDF into /public and set the filename here
const RESUME_PDF = "/resume.pdf";

const PANEL_SPRING = {
  type: "spring",
  stiffness: 550,
  damping: 45,
  mass: 0.7,
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
  const { w, h } = useViewportSize();
  const [pillWidth, setPillWidth] = React.useState(100);

  // Measure the natural pill width once on mount so we can animate back to it smoothly
  React.useLayoutEffect(() => {
    if (rootRef.current) {
      setPillWidth(rootRef.current.scrollWidth);
    }
  }, []);

  // Panel fills the right half of the viewport with padding
  const panelW = Math.max(w * 0.5 - 48, 320);
  const panelH = Math.max(h - 100 - 48, 300); // 100px minimap offset + 48px bottom breathing room

  const close = React.useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close);

  return (
    <motion.div
      ref={rootRef}
      className="bg-(--background) border border-neutral-200 shadow-lg overflow-hidden flex flex-col"
      initial={false}
      animate={{
        width: open ? panelW : pillWidth,
        height: open ? panelH : 44,
        borderRadius: open ? 14 : 22,
      }}
      transition={{ ...PANEL_SPRING, delay: open ? 0 : 0.05 }}
    >
      {/* Single header row — acts as pill when closed, panel header when open */}
      <div
        className={`relative flex items-center justify-center px-4 h-[44px] shrink-0 whitespace-nowrap${open ? " border-b border-neutral-200" : ""}`}
      >
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 cursor-pointer"
          style={{ pointerEvents: open ? "none" : "all" }}
          aria-label="Open resume"
        >
          <span className="text-sm font-mono tracking-wide text-(--foreground)">
            Resume
          </span>
        </button>
        {/* Absolutely positioned so they never affect the layout width during morph */}
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

      {/* PDF */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={PANEL_SPRING}
            className="flex-1 flex items-center justify-center p-4"
          >
            <iframe
              src={`${RESUME_PDF}#toolbar=0&navpanes=0`}
              className="w-full h-full rounded-[8px]"
              title="Resume"
            />
          </motion.div>
        )}
      </AnimatePresence>
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
    <motion.div
      className="grid grid-cols-[180px_1fr] gap-8"
      style={{ opacity, y }}
    >
      <div>
        <p className="font-semibold">{job.company}</p>
        <p className="text-sm text-(--muted) font-mono mt-1">{job.period}</p>
      </div>
      <div>
        <p className="text-sm font-mono text-(--muted) uppercase tracking-widest mb-2">
          {job.role}
        </p>
        <ul className="space-y-1">
          {job.bullets.map((b) => (
            <li key={b} className="text-sm text-(--muted) leading-relaxed">
              <span className="text-(--accent) mr-2">—</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function WorkExperience({
  scrollX,
}: {
  scrollX: MotionValue<number>;
}) {
  const headerOpacity = useTransform(scrollX, [MAX * 0.0, MAX * 0.20], [0, 1]);
  const headerY = useTransform(scrollX, [MAX * 0.0, MAX * 0.20], [24, 0]);

  return (
    <section className="relative h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24">
      <motion.p
        className="text-sm font-mono tracking-widest uppercase text-(--muted) mb-6"
        style={{ opacity: headerOpacity, y: headerY }}
      >
        Work Experience
      </motion.p>
      <motion.h2
        className="text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.9] tracking-tight mb-16"
        style={{ opacity: headerOpacity, y: headerY }}
      >
        Experience<span className="text-(--accent)">.</span>
      </motion.h2>
      <div className="flex flex-col gap-10">
        {JOBS.map((job, i) => (
          <JobRow
            key={job.company}
            job={job}
            scrollX={scrollX}
            inputRange={JOB_RANGES[i]}
          />
        ))}
      </div>

      {/* Right half below the minimap — flex keeps the pill/panel centered as it morphs */}
      <div className="absolute left-[50vw] top-[100px] w-[50vw] h-[calc(100%-100px)] flex items-center justify-center z-10">
        <ResumePill />
      </div>
    </section>
  );
}
