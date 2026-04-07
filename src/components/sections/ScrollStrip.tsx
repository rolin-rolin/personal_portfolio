"use client";

import React from "react";
import {
  animate,
  motion,
  TargetAndTransition,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { clamp } from "@/lib/clamp";
import { useMobileDetect } from "@/lib/useMobileDetect";

export const FRAME_WIDTH = 72;
export const FRAME_WIDTH_EXPANDED = 480;
export const FRAME_HEIGHT = FRAME_WIDTH * 4;
export const FRAME_HEIGHT_EXPANDED = 720;
export const FRAME_WIDTH_DIFF = FRAME_WIDTH_EXPANDED - FRAME_WIDTH;
export const FRAME_HEIGHT_DIFF = FRAME_HEIGHT_EXPANDED - FRAME_HEIGHT;
export const FRAME_GAP = 16;
export const FRAME_DIFF_CENTER = FRAME_WIDTH_DIFF / 2;
export const FRAME_STEP = FRAME_GAP + FRAME_WIDTH;

const DIRECTORY_LABELS = [
  "beach",   "hiking",  "travel",  "family",  "food",
  "city",    "nature",  "friends", "music",   "art",
  "sport",   "work",    "home",    "pets",    "books",
  "film",    "coffee",  "sunset",  "snow",    "rain",
  "road",    "market",  "night",   "garden",  "ocean",
];

const CARD_W = 80;
const CARD_THUMB_H = 90;
const CARD_GAP = 8;
const GRID_COLS = 5;
const GRID_ROWS = 5;
// Right edge of grid in overlay coords: anchored 48px left of the arrow.
// Arrow is at -40 in inner-div coords; inner-div starts at calc(50vw - 248px) in overlay.
// Grid right from overlay-left = (50vw - 248) + (-40 - 48) = 50vw - 336.
// Grid right from overlay-RIGHT = 100vw - (50vw - 336) = 50vw + 336.
const GRID_OVERLAY_RIGHT = `calc(50vw + ${FRAME_DIFF_CENTER + FRAME_STEP / 2 + 40 + 48}px)`;

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
const STRIP_MAX = FRAME_STEP * (FRAMES.length - 1);

export default function ScrollStrip() {
  const detect = useMobileDetect();
  const isMobile = detect.isMobile();

  const [activeIndex, setActiveIndex] = React.useState<null | number>(null);
  const translateX = useMotionValue(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const wheelEndRef = React.useRef<ReturnType<typeof setTimeout>>();

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

  // Non-passive wheel listener — only active when this section is fully
  // in the viewport. IntersectionObserver gates it so that page-level
  // transitions (Projects → ScrollStrip) are never hijacked mid-flight.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || isMobile) return;

    const inView = { current: false };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowInView = entry.intersectionRatio >= 0.99;
        if (!nowInView && inView.current) {
          setActiveIndex(null);
          animate(translateX, 0, { type: "spring", stiffness: 500, damping: 30 });
        }
        inView.current = nowInView;
      },
      { threshold: 0.99 }
    );
    observer.observe(el);

    function handleWheel(e: WheelEvent) {
      if (!inView.current) return; // section not fully visible — let page handle

      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const current = translateX.get();

      if (delta > 0 && current <= -STRIP_MAX) return; // end — let page handle
      if (delta < 0 && current >= 0) return; // start — let page handle

      e.preventDefault();

      translateX.stop();
      translateX.set(clamp(current - delta, [-STRIP_MAX, 0]));
      setActiveIndex(null);

      clearTimeout(wheelEndRef.current);
      wheelEndRef.current = setTimeout(() => {
        const index = Math.round(
          clamp(-translateX.get() / FRAME_STEP, [0, FRAMES.length - 1])
        );
        setActiveIndex((cur) => (cur === null ? index : cur));
      }, 150);
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      observer.disconnect();
    };
  }, [isMobile, translateX]);

  // Animate translateX when activeIndex changes (click or arrow keys)
  React.useEffect(() => {
    if (activeIndex !== null) {
      animate(translateX, -activeIndex * FRAME_STEP, {
        type: "spring",
        stiffness: 500,
        damping: 30,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

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
    <div
      ref={containerRef}
      className="relative flex h-full w-[100vw] items-center"
    >
      {/* Directory overlay — full section height, same translateX as frames */}
      <motion.div
        style={{ x: translateX }}
        className="absolute inset-0 pointer-events-none"
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 flex flex-col pointer-events-auto"
          style={{ right: GRID_OVERLAY_RIGHT, gap: CARD_GAP }}
        >
          {Array.from({ length: GRID_ROWS }, (_, row) => (
            <div key={row} className="flex" style={{ gap: CARD_GAP }}>
              {Array.from({ length: GRID_COLS }, (_, col) => {
                const idx = row * GRID_COLS + col;
                const gradient = FRAMES[idx % FRAMES.length];
                return (
                  <div key={col} className="flex flex-col items-center gap-[3px]">
                    <div
                      className="rounded-[2px] flex-shrink-0"
                      style={{
                        width: CARD_W,
                        height: CARD_THUMB_H,
                        background: `linear-gradient(to bottom, ${gradient[0]}, ${gradient[1]})`,
                      }}
                    />
                    <span className="text-[9px] font-mono text-(--muted) truncate text-center" style={{ width: CARD_W }}>
                      {DIRECTORY_LABELS[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>

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
