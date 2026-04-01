"use client";

import { animate, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Hero from "@/components/sections/Hero";
import WorkExperience from "@/components/sections/WorkExperience";
import Projects from "@/components/sections/Projects";
import Miscellaneous from "@/components/sections/Miscellaneous";
import LineMinimap, {
  useScrollXFromWheel,
  MAX,
} from "@/components/sections/LineMinimap";
import { STRIP_MAX } from "@/components/sections/ScrollStrip";

const NUM_SECTIONS = 4;
// How many px past the last minimap line the ball rolls when strip is fully scrolled
const BALL_EXTRA = 50;

const SECTIONS = [
  { label: "Home", scrollX: 0 },
  { label: "Experience", scrollX: MAX / 3 },
  { label: "Projects", scrollX: (MAX * 2) / 3 },
  { label: "Cool Stuff", scrollX: MAX },
];

export default function Home() {
  const { scrollX, rawX, seekTo: rawSeekTo } = useScrollXFromWheel(MAX);
  const stripTranslateX = useMotionValue(0); // range [0, -STRIP_MAX], owned here

  function seekTo(target: number) {
    rawSeekTo(target);
    if (target === MAX) {
      animate(stripTranslateX, 0, { type: "spring", stiffness: 500, damping: 40 });
    }
  }

  // Raw ball position: rawX gates the mode switch (no lag), scrollX drives position.
  // A tight spring on top smooths the ~frame discontinuity when rawX first hits MAX.
  const ballXRaw = useTransform(
    [scrollX, rawX, stripTranslateX],
    ([sx, rx, tx]: number[]) =>
      rx < MAX ? sx : MAX + (-tx / STRIP_MAX) * BALL_EXTRA
  );
  const ballX = useSpring(ballXRaw, { stiffness: 1000, damping: 60 });

  const x = useTransform(
    scrollX,
    (v) => `-${(v / MAX) * (NUM_SECTIONS - 1) * 100}vw`
  );

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
          <Miscellaneous scrollX={scrollX} stripTranslateX={stripTranslateX} />
        </div>
      </motion.div>
    </main>
  );
}
