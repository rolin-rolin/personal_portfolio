"use client";

import { motion, useTransform } from "motion/react";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import ScrollStrip from "@/components/sections/ScrollStrip";
import LineMinimap, {
  useScrollXFromWheel,
  MAX,
} from "@/components/sections/LineMinimap";

const NUM_SECTIONS = 3;

export default function Home() {
  const scrollX = useScrollXFromWheel(MAX);
  const x = useTransform(
    scrollX,
    (v) => `-${(v / MAX) * (NUM_SECTIONS - 1) * 100}vw`
  );

  return (
    <main className="h-screen overflow-hidden">
      <LineMinimap scrollX={scrollX} />
      <motion.div className="flex h-full" style={{ x }}>
        <div className="w-[100vw] h-full flex-shrink-0">
          <Hero />
        </div>
        <div className="w-[100vw] h-full flex-shrink-0">
          <Projects scrollX={scrollX} />
        </div>
        <div className="w-[100vw] h-full flex-shrink-0">
          <ScrollStrip />
        </div>
      </motion.div>
    </main>
  );
}
