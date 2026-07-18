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
  const mainRef = React.useRef<HTMLElement>(null);

  // Tab can focus an element in a section that's not currently in view. The
  // browser responds by yanking main's native scrollLeft to reveal it, which
  // fights our transform-based scrollX (main only overflows in the layout
  // sense — our transform is supposed to be the sole source of position).
  // Instead: treat a focus move like a minimap click (seekTo the section's
  // scrollX), and cancel out the native scroll the browser applied for us.
  React.useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    function onFocusIn(e: FocusEvent) {
      const target = e.target as HTMLElement | null;
      const sectionEl = target?.closest<HTMLElement>("[data-section]");
      if (sectionEl) {
        const index = Number(sectionEl.dataset.section);
        seekTo(SECTIONS[index].scrollX);
      }
      requestAnimationFrame(() => {
        if (!el) return;
        el.scrollLeft = 0;
        el.scrollTop = 0;
      });
    }
    el.addEventListener("focusin", onFocusIn);
    return () => el.removeEventListener("focusin", onFocusIn);
  }, [seekTo]);

  const stripProgress = useMotionValue(0);
  const ballXRaw = useTransform([scrollX, rawX, stripProgress], ([sx, rx, sp]) =>
    (rx as number) < MAX ? (sx as number) : MAX + (sp as number) * 100
  );
  const ballX = useSpring(ballXRaw, { stiffness: 1000, damping: 60 });

  // Page translateX: clamped at MAX so the flex container never exceeds 400vw.
  // Uses vw units — identical feel to the original, no px/layout concerns.
  const x = useTransform(scrollX, (v) => `-${(Math.min(v, MAX) / MAX) * 300}vw`);

  return (
    <main ref={mainRef} className="h-screen overflow-hidden">

      <LineMinimap
        scrollX={scrollX}
        ballX={ballX}
        sections={SECTIONS}
        seekTo={seekTo}
      />
      <motion.div className="flex h-full" style={{ x }} data-scroll-x-container>
        <div className="w-[100vw] h-full flex-shrink-0" data-section={0}>
          <Hero />
        </div>
        <div className="w-[100vw] h-full flex-shrink-0" data-section={1}>
          <WorkExperience scrollX={scrollX} />
        </div>
        <div className="w-[100vw] h-full flex-shrink-0 overflow-hidden" data-section={2}>
          <Projects scrollX={scrollX} />
        </div>
        <div className="w-[100vw] h-full flex-shrink-0" style={{ clipPath: "inset(0 0 0 -50px)" }} data-section={3}>
          <Miscellaneous stripProgress={stripProgress} onStripActivate={() => seekTo(MAX)} />
        </div>
      </motion.div>
    </main>
  );
}
