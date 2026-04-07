"use client";

import React from "react";
import { motion, type MotionValue } from "motion/react";
import ScrollStrip, {
  FRAME_DIFF_CENTER,
  FRAME_STEP,
} from "@/components/sections/ScrollStrip";

// ── Film strip ────────────────────────────────────────────────────────────────

const FILM_FRAMES: [string, string][] = [
  ["#8b7355", "#3d2e1a"],
  ["#3d6b7e", "#1a2f3d"],
  ["#5c7a3e", "#27361a"],
  ["#7e5c6b", "#3d1f2b"],
  ["#6b6b3d", "#2e2e1a"],
  ["#3d5c7e", "#1a2733"],
];

function Perforation() {
  return (
    <div
      className="flex-shrink-0 rounded-[2px] bg-(--background)"
      style={{ width: 7, height: 12 }}
    />
  );
}

function FilmStrip() {
  return (
    <motion.div
      className="flex flex-col py-3 px-2 gap-[3px] rounded-[4px]"
      style={{ backgroundColor: "#111", width: 76 }}
      animate={{ y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
    >
      {FILM_FRAMES.map(([top, bottom], i) => (
        <div key={i} className="flex items-center gap-[5px]">
          <Perforation />
          <div
            className="flex-1 rounded-[1px]"
            style={{
              height: 38,
              background: `linear-gradient(to bottom, ${top}, ${bottom})`,
            }}
          />
          <Perforation />
        </div>
      ))}
    </motion.div>
  );
}

// ── Miscellaneous ─────────────────────────────────────────────────────────────

export default function Miscellaneous({
  scrollX,
  stripTranslateX,
  seekToFrame,
}: {
  scrollX: MotionValue<number>;
  stripTranslateX: MotionValue<number>;
  seekToFrame: (i: number) => void;
}) {
  // The overlay fills the dead space to the left of where the strip frames begin
  const overlayWidth = `calc(50vw - ${FRAME_DIFF_CENTER + FRAME_STEP / 2 + 40}px)`;

  return (
    <div className="relative h-full w-full">
      <ScrollStrip
        pageScrollX={scrollX}
        translateX={stripTranslateX}
        seekToFrame={seekToFrame}
      />

      <div
        className="absolute left-0 top-0 h-full pointer-events-none flex items-center justify-center"
        style={{ width: overlayWidth }}
      >
        <div className="pointer-events-auto flex flex-col items-center gap-6">
          <FilmStrip />
          <p className="text-[11px] font-mono tracking-widest uppercase text-(--muted) text-center leading-relaxed">
            more about me<br />told through pictures
          </p>
          <motion.span
            animate={{ x: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            className="text-(--accent) text-lg font-mono select-none"
          >
            →
          </motion.span>
        </div>
      </div>
    </div>
  );
}
