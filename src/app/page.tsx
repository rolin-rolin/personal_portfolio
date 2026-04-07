"use client";

import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Hero from "@/components/sections/Hero";
import WorkExperience from "@/components/sections/WorkExperience";
import Projects from "@/components/sections/Projects";
import Miscellaneous from "@/components/sections/Miscellaneous";
import LineMinimap, {
  useScrollXFromWheel,
  MAX,
} from "@/components/sections/LineMinimap";
import { STRIP_MAX, FRAME_STEP } from "@/components/sections/ScrollStrip";

const BALL_EXTRA = 50;

const SECTIONS = [
  { label: "Home",       scrollX: 0 },
  { label: "Experience", scrollX: MAX / 3 },
  { label: "Projects",   scrollX: (MAX * 2) / 3 },
  { label: "Cool Stuff", scrollX: MAX },
];

export default function Home() {
  // vwRef: hot-path read with zero DOM overhead, updated on resize only.
  const vwRef = React.useRef(typeof window !== "undefined" ? window.innerWidth : 1440);
  const [totalMax, setTotalMax] = React.useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1440;
    return MAX + (STRIP_MAX * MAX) / (3 * w);
  });
  React.useEffect(() => {
    function update() {
      const w = window.innerWidth;
      vwRef.current = w;
      setTotalMax(MAX + (STRIP_MAX * MAX) / (3 * w));
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { scrollX, rawX, seekTo } = useScrollXFromWheel(totalMax);

  // Center frame i by seeking scrollX to the corresponding strip position
  function seekToFrame(i: number) {
    seekTo(MAX + (i * FRAME_STEP * MAX) / (3 * vwRef.current));
  }

  // Ball: tracks [0, MAX] for sections, then overshoots BALL_EXTRA into the strip indicator
  const ballXRaw = useTransform([scrollX, rawX], ([sx, rx]: number[]) => {
    if ((rx as number) < MAX) return sx as number;
    const ssu = (STRIP_MAX * MAX) / (3 * vwRef.current);
    return MAX + Math.min(1, ((sx as number) - MAX) / ssu) * BALL_EXTRA;
  });
  const ballX = useSpring(ballXRaw, { stiffness: 1000, damping: 60 });

  // Page translateX: clamped at MAX so the flex container never exceeds 400vw.
  // Uses vw units — identical feel to the original, no px/layout concerns.
  const x = useTransform(scrollX, (v) => `-${(Math.min(v, MAX) / MAX) * 300}vw`);

  // Strip internal translate: derived from scrollX beyond MAX.
  // Drives the strip's motion.div — same as the original translateX but sourced
  // from the unified page spring instead of a separate wheel handler.
  const stripTranslateX = useTransform(scrollX, (v) => {
    if (v <= MAX) return 0;
    const ssu = (STRIP_MAX * MAX) / (3 * vwRef.current);
    return -((v - MAX) / ssu) * STRIP_MAX;
  });

  return (
    <main className="h-screen overflow-hidden">
      <LineMinimap
        scrollX={scrollX}
        ballX={ballX}
        sections={SECTIONS}
        seekTo={seekTo}
      />
      <motion.div className="flex h-full" style={{ x }} data-scroll-x-container>
        <div className="w-[100vw] h-full flex-shrink-0">
          <Hero />
        </div>
        <div className="w-[100vw] h-full flex-shrink-0">
          <WorkExperience scrollX={scrollX} />
        </div>
        <div className="w-[100vw] h-full flex-shrink-0">
          <Projects scrollX={scrollX} />
        </div>
        <div className="w-[100vw] h-full flex-shrink-0 overflow-hidden">
          <Miscellaneous scrollX={scrollX} stripTranslateX={stripTranslateX} seekToFrame={seekToFrame} />
        </div>
      </motion.div>
    </main>
  );
}
