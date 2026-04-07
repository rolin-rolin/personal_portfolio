"use client";

import React from "react";
import { motion, useSpring, useTransform } from "motion/react";
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
  const { scrollX, seekTo } = useScrollXFromWheel(MAX);

  const ballX = useSpring(scrollX, { stiffness: 1000, damping: 60 });

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
        <div className="w-[100vw] h-full flex-shrink-0">
          <Projects scrollX={scrollX} />
        </div>
        <div className="w-[100vw] h-full flex-shrink-0 overflow-hidden">
          <Miscellaneous />
        </div>
      </motion.div>
    </main>
  );
}
