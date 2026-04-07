"use client";

import React from "react";
import {
  motion,
  TargetAndTransition,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { clamp } from "@/lib/clamp";
import { MAX } from "@/components/sections/LineMinimap";

export const FRAME_WIDTH = 72;
export const FRAME_WIDTH_EXPANDED = 480;
export const FRAME_HEIGHT = FRAME_WIDTH * 4;
export const FRAME_HEIGHT_EXPANDED = 720;
export const FRAME_WIDTH_DIFF = FRAME_WIDTH_EXPANDED - FRAME_WIDTH;
export const FRAME_HEIGHT_DIFF = FRAME_HEIGHT_EXPANDED - FRAME_HEIGHT;
export const FRAME_GAP = 16;
export const FRAME_DIFF_CENTER = FRAME_WIDTH_DIFF / 2;
export const FRAME_STEP = FRAME_GAP + FRAME_WIDTH;

// Placeholder gradients — swap these out for real <Image> imports
const BASE_FRAMES: [string, string][] = [
  ["#8b7355", "#3d2e1a"],
  ["#3d6b7e", "#1a2f3d"],
  ["#5c7a3e", "#27361a"],
  ["#7e5c6b", "#3d1f2b"],
  ["#6b6b3d", "#2e2e1a"],
  ["#3d5c7e", "#1a2733"],
  ["#7e6b3d", "#3d2e1a"],
  ["#5c3d7e", "#271a3d"],
  ["#3d7e6b", "#1a3d2e"],
];

const FRAMES = [...BASE_FRAMES, ...BASE_FRAMES, ...BASE_FRAMES, ...BASE_FRAMES];
export const STRIP_MAX = FRAME_STEP * (FRAMES.length - 1);

export default function ScrollStrip({
  pageScrollX,
  translateX,
  seekToFrame,
}: {
  pageScrollX: MotionValue<number>;
  translateX: MotionValue<number>;
  seekToFrame: (i: number) => void;
}) {
  const [activeIndex, setActiveIndex] = React.useState<null | number>(null);

  // Reset active frame when the user scrolls back to a previous section
  useMotionValueEvent(pageScrollX, "change", (v) => {
    if (v < MAX * 0.95) setActiveIndex(null);
  });

  // Seek page to center the active frame whenever it changes
  React.useEffect(() => {
    if (activeIndex !== null) seekToFrame(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // Keyboard navigation
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") arrow(1)(e);
      if (e.key === "ArrowLeft") arrow(-1)(e);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function arrow(dir: 1 | -1) {
    return (e: KeyboardEvent) => {
      e.preventDefault();
      setActiveIndex((i) => {
        if (i === null) return i;
        return clamp(i + dir, [0, FRAMES.length - 1]);
      });
    };
  }

  function x(i: number) {
    if (activeIndex === i) return 0;
    if (activeIndex === 0 && i !== 0) return FRAME_DIFF_CENTER;
    if (activeIndex) return i > activeIndex ? FRAME_DIFF_CENTER : -FRAME_DIFF_CENTER;
    return 0;
  }

  return (
    <div className="relative flex h-full w-[100vw] items-center">
      <div
        className="relative"
        style={{
          height: FRAME_HEIGHT,
          marginLeft: `calc(50vw - ${FRAME_DIFF_CENTER + FRAME_STEP / 2}px)`,
        }}
      >
        <motion.div style={{ x: translateX, height: FRAME_HEIGHT }} className="relative">
          {/* Arrow sits at a fixed negative offset from frame 0 — moves with the strip
              so it can never be overlapped by frames no matter how far you scroll */}
          <motion.span
            className="absolute top-1/2 -translate-y-1/2 text-(--accent) text-lg font-mono select-none pointer-events-none"
            style={{ left: -40 }}
            animate={{ x: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          >
            →
          </motion.span>
          {FRAMES.map((gradient, i) => {
            const active = activeIndex === i;
            return (
              <Frame
                key={i}
                active={active}
                onClick={() => setActiveIndex(i === activeIndex ? null : i)}
                animate={{ x: x(i) }}
                style={{ left: `${i * FRAME_STEP + FRAME_GAP / 2}px` }}
              >
                <div
                  className="pointer-events-none h-full w-full select-none"
                  style={{
                    background: `linear-gradient(to bottom, ${gradient[0]}, ${gradient[1]})`,
                  }}
                />
              </Frame>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

interface FrameProps {
  children: React.ReactNode;
  active: boolean;
  animate?: TargetAndTransition;
  style?: React.CSSProperties;
  onClick?: () => void;
}

function Frame({ children, active, animate: animateProp, style, ...props }: FrameProps) {
  const clip = useSpring(FRAME_DIFF_CENTER, { stiffness: 500, damping: 50 });

  React.useEffect(() => {
    clip.set(active ? 0 : FRAME_DIFF_CENTER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <motion.div
      initial={false}
      className="absolute h-full cursor-pointer grayscale transition-[filter] duration-300 hover:grayscale-0 [&[data-active=true]]:grayscale-0"
      data-active={active}
      animate={{
        height: active ? FRAME_HEIGHT_EXPANDED : FRAME_HEIGHT,
        y: active ? -FRAME_HEIGHT_DIFF / 2 : 0,
        ...animateProp,
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 50,
      }}
      style={{
        width: FRAME_WIDTH_EXPANDED,
        clipPath: useTransform(clip, (c) => `inset(0 ${c}px 0 ${c}px)`),
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
