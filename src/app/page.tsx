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

const SECTIONS = [
  { label: "Home",       scrollX: 0 },
  { label: "Experience", scrollX: MAX / 3 },
  { label: "Projects",   scrollX: (MAX * 2) / 3 },
  { label: "Cool Stuff", scrollX: MAX },
];

export default function Home() {
  const { scrollX, rawX, seekTo } = useScrollXFromWheel(MAX);

  const stripProgress = useMotionValue(0);
  const ballXRaw = useTransform([scrollX, rawX, stripProgress], ([sx, rx, sp]) =>
    (rx as number) < MAX ? (sx as number) : MAX + (sp as number) * 100
  );
  const ballX = useSpring(ballXRaw, { stiffness: 1000, damping: 60 });

  // Page translateX: clamped at MAX so the flex container never exceeds 400vw.
  // Uses vw units — identical feel to the original, no px/layout concerns.
  const x = useTransform(scrollX, (v) => `-${(Math.min(v, MAX) / MAX) * 300}vw`);

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
        <div className="w-[100vw] h-full flex-shrink-0 overflow-hidden">
          <Projects scrollX={scrollX} />
        </div>
        <div className="w-[100vw] h-full flex-shrink-0" style={{ clipPath: "inset(0 0 0 -50px)" }}>
          <Miscellaneous stripProgress={stripProgress} onStripActivate={() => seekTo(MAX)} />
        </div>
      </motion.div>
    </main>
  );
}
