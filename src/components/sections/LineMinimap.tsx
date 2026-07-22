"use client";

import { motion, useSpring, useMotionValueEvent, useTransform, MotionValue, useMotionValue } from "motion/react";
import * as React from "react";
import { clamp } from "@/lib/clamp";

export const LINE_GAP = 8;
export const LINE_WIDTH = 1;
export const LINE_COUNT = 40;
export const LINE_HEIGHT = 24;
export const LINE_HEIGHT_ACTIVE = 32;

export const LINE_STEP = LINE_WIDTH + LINE_GAP;
export const MIN = 0;
export const MAX = LINE_STEP * (LINE_COUNT - 1);

// Transformer constants
export const DEFAULT_INTENSITY = 3.5;
export const DISTANCE_LIMIT = 48;

// Entrance timing: fires 1s after the (delayed) social links start revealing
// in Hero. Shared by anything meant to appear alongside the minimap/ball
// (the scroll hint, the hard-mode toggle).
export const REVEAL_DELAY = 2.9;

export function lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
}

type Section = { label: string; scrollX: number };

export default function LineMinimap({
    scrollX,
    ballX,
    sections,
    seekTo,
}: {
    scrollX: MotionValue<number>;
    ballX?: MotionValue<number>;
    sections: Section[];
    seekTo: (x: number) => void;
}) {
    const { mouseX, onMouseMove, onMouseLeave } = useMouseX();

    const sectionIndices = new Set(sections.map((s) => Math.round(s.scrollX / LINE_STEP)));

    // Motion doesn't reliably delay non-numeric CSS values (like pointerEvents)
    // through animate/transition the way it does numeric ones — it can apply
    // the final value immediately on hydration instead of waiting. A plain
    // timer keyed to the same reveal moment is deterministic.
    const [interactive, setInteractive] = React.useState(false);
    React.useEffect(() => {
        const t = setTimeout(() => setInteractive(true), (REVEAL_DELAY + 0.6) * 1000);
        return () => clearTimeout(t);
    }, []);

    // Measures our own rendered footprint (post-transform, via getBoundingClientRect) so
    // other sections can reserve exactly enough top clearance to clear us, rather than
    // guessing a constant that drifts whenever this component's size changes.
    const rootRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        function measure() {
            const el = rootRef.current;
            if (!el) return;
            const bottom = el.getBoundingClientRect().bottom;
            document.documentElement.style.setProperty("--minimap-safe-top", `${Math.ceil(bottom) + 16}px`);
            window.dispatchEvent(new Event("minimap-safe-top-change"));
        }
        measure();
        const ro = new ResizeObserver(measure);
        if (rootRef.current) ro.observe(rootRef.current);
        window.addEventListener("resize", measure);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, []);

    // Scale the whole bar down just enough that the ball's max travel (past the
    // last tick, where "keep it rollin" reveals) always stays within the
    // viewport with a safety margin — instead of a fixed two-tier scale that
    // still clips the text on real phones.
    const [navScale, setNavScale] = React.useState(1);
    React.useEffect(() => {
        function recomputeScale() {
            const margin = 16;
            const raw = (window.innerWidth / 2 - margin) / RIGHTMOST_FROM_CENTER;
            setNavScale(Math.min(1, Math.max(0.5, raw)));
        }
        recomputeScale();
        window.addEventListener("resize", recomputeScale);
        return () => window.removeEventListener("resize", recomputeScale);
    }, []);

    return (
        <motion.div
            ref={rootRef}
            className="fixed top-10 left-1/2 z-50 cursor-pointer"
            style={{ transform: `translateX(-50%) scale(${navScale})`, pointerEvents: interactive ? "auto" : "none" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: REVEAL_DELAY }}
            onPointerMove={onMouseMove}
            onPointerLeave={onMouseLeave}
            onClick={(e) => {
                if (!interactive) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const mappedScrollX = (offsetX / (LINE_STEP * (LINE_COUNT - 1))) * MAX;
                const nearest = sections.reduce((prev, curr) =>
                    Math.abs(curr.scrollX - mappedScrollX) < Math.abs(prev.scrollX - mappedScrollX) ? curr : prev,
                );
                seekTo(nearest.scrollX);
            }}
        >
            <div className="relative">
                {sections.map((s) => {
                    return (
                        <button
                            key={s.label}
                            className="absolute -top-7 text-[10px] font-mono uppercase tracking-widest text-(--muted) hover:text-(--foreground) transition-colors cursor-pointer"
                            style={{ left: s.scrollX, transform: "translateX(-50%)" }}
                            disabled={!interactive}
                            onClick={(e) => {
                                e.stopPropagation();
                                seekTo(s.scrollX);
                            }}
                        >
                            {s.label}
                        </button>
                    );
                })}
                <div className="flex items-end" style={{ gap: LINE_GAP }}>
                    {[...Array(LINE_COUNT)].map((_, i) => (
                        <Line
                            key={i}
                            index={i}
                            scrollX={scrollX}
                            mouseX={mouseX}
                            active={isActive(i, LINE_COUNT)}
                            isSection={sectionIndices.has(i)}
                        />
                    ))}
                </div>
                <Indicator x={ballX ?? scrollX} />
                <RollinText x={ballX ?? scrollX} />
            </div>
        </motion.div>
    );
}

function Line({
    active,
    isSection,
    mouseX,
    scrollX,
    index,
}: {
    active?: boolean;
    isSection?: boolean;
    mouseX: MotionValue<number>;
    scrollX: MotionValue<number>;
    index: number;
}) {
    const ref = React.useRef<HTMLDivElement>(null);
    const scaleY = useSpring(1, { damping: 45, stiffness: 600 });
    const centerX = index * LINE_STEP + LINE_WIDTH / 2;
    const baseHeight = isSection ? LINE_HEIGHT_ACTIVE : LINE_HEIGHT;
    const height = useSpring(baseHeight, { damping: 45, stiffness: 600 });

    useProximity(scaleY, {
        ref,
        baseValue: 1,
        mouseX,
        scrollX,
        centerX,
        intensity: isSection ? DEFAULT_INTENSITY * 0.6 : DEFAULT_INTENSITY,
        reset: false,
    });

    useMotionValueEvent(scrollX, "change", (latest) => {
        if (!isSection) return;
        const distance = Math.abs(latest - centerX);
        const dampened = distance < DISTANCE_LIMIT;
        const factor = dampened ? 1 - (1 - distance / DISTANCE_LIMIT) : 0;
        height.set(baseHeight - 2 + factor * 2);
    });

    const colorClass = isSection ? "bg-(--accent)" : "bg-neutral-300";

    return (
        <motion.div
            ref={ref}
            className={colorClass}
            style={{
                width: LINE_WIDTH,
                height,
                scaleY,
                transformOrigin: "bottom",
            }}
        />
    );
}

///////////////////////////////////////////////////////////////////////////////

export function transformScale(distance: number, initialValue: number, baseValue: number, intensity: number) {
    if (Math.abs(distance) > DISTANCE_LIMIT) {
        return initialValue;
    }
    const normalizedDistance = initialValue - Math.abs(distance) / DISTANCE_LIMIT;
    const scaleFactor = normalizedDistance * normalizedDistance;
    return baseValue + intensity * scaleFactor;
}

export interface ProximityOptions {
    ref: React.RefObject<HTMLElement | null>;
    baseValue: number;
    mouseX: MotionValue<number>;
    scrollX: MotionValue<number>;
    centerX: number;
    intensity?: number;
    reset?: boolean;
    transformer?: (distance: number, initialValue: number, baseValue: number, intensity: number) => number;
}

export function useProximity(
    value: MotionValue<number>,
    {
        ref,
        baseValue,
        mouseX,
        scrollX,
        centerX,
        intensity = DEFAULT_INTENSITY,
        reset = true,
        transformer = transformScale,
    }: ProximityOptions,
) {
    const initialValueRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        if (initialValueRef.current === null) {
            initialValueRef.current = value.get();
        }
    }, [value]);

    useMotionValueEvent(mouseX, "change", (latest) => {
        const rect = ref.current!.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;
        const distance = latest - elementCenterX;
        value.set(transformer(distance, initialValueRef.current!, baseValue, intensity));
    });

    useMotionValueEvent(scrollX, "change", (latest) => {
        const initialValue = initialValueRef.current!;
        const distance = latest - centerX;
        const targetScale = transformer(distance, initialValue, baseValue, intensity);

        if (reset) {
            const currentVelocity = Math.abs(scrollX.getVelocity());
            const velocityThreshold = 300;
            const velocityFactor = Math.min(1, currentVelocity / velocityThreshold);
            const lerped = lerp(initialValue, targetScale, velocityFactor);
            value.set(lerped);
        } else {
            value.set(targetScale);
        }
    });
}

///////////////////////////////////////////////////////////////////////////////

export function useScrollXFromWheel(max: number) {
    const rawX = useMotionValue(0);
    const x = useSpring(rawX, { stiffness: 500, damping: 40, mass: 0.8 });

    // Whichever axis the user scrolls first locks in for good — no re-detection,
    // no reset, so horizontal/vertical can never alternate mid-use.
    const directionRef = React.useRef<"x" | "y" | null>(null);

    React.useEffect(() => {
        function handleWheel(e: WheelEvent) {
            if (e.defaultPrevented || e.ctrlKey) return;

            const { deltaX, deltaY } = e;

            if (!directionRef.current) {
                if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                    directionRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
                }
            }

            if (directionRef.current) {
                e.preventDefault();
                const delta = directionRef.current === "x" ? deltaX : deltaY;
                rawX.set(clamp(rawX.get() + delta * 0.3, [0, max]));
            }
        }

        let lastTouchX = 0;
        let lastTouchY = 0;

        function handleTouchStart(e: TouchEvent) {
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
        }

        function handleTouchMove(e: TouchEvent) {
            const touch = e.touches[0];
            const deltaX = lastTouchX - touch.clientX;
            const deltaY = lastTouchY - touch.clientY;
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;

            if (!directionRef.current) {
                if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                    directionRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
                }
            }

            if (directionRef.current) {
                e.preventDefault();
                const delta = directionRef.current === "x" ? deltaX : deltaY;
                rawX.set(clamp(rawX.get() + delta, [0, max]));
            }
        }

        window.addEventListener("wheel", handleWheel, { passive: false });
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
        };
    }, [max, rawX]);

    return { scrollX: x, rawX, seekTo: (v: number) => rawX.set(clamp(v, [0, max])) };
}

export function useMouseX() {
    const mouseX = useMotionValue<number>(0);

    function onPointerMove(e: React.PointerEvent) {
        mouseX.set(e.clientX);
    }

    function onPointerLeave() {
        mouseX.set(0);
    }

    return { mouseX, onMouseMove: onPointerMove, onMouseLeave: onPointerLeave };
}

///////////////////////////////////////////////////////////////////////////////

export function isActive(index: number, count: number): boolean {
    if (index === 0 || index === count - 1) return true;
    const step = count / (Math.floor(count / LINE_GAP) + 1);
    return Math.abs(index % step) < 0.5 || Math.abs((index % step) - step) < 0.5;
}

const BALL_RADIUS = 9;
const DEG_PER_PX = 180 / (Math.PI * BALL_RADIUS);

const ROLLIN_TEXT_LEFT = MAX + 10;
const ROLLIN_LETTERS = "keep it rollin".split("");

// Large enough to never clip the text on the right
const ROLLIN_CONTAINER_W = 200;

// How far past the last tick the ball travels while the strip section plays
// out (mirrors the `MAX + stripProgress * 100` formula in page.tsx — exported
// so both places share one number instead of drifting apart).
export const BALL_OVERSHOOT = 100;
const BALL_MAX_X = MAX + BALL_OVERSHOOT;

// Rightmost point (in this component's local, unscaled coordinate space) that
// can ever need to be visible: either the ball at its max travel, or the
// "keep it rollin" text's visible edge at that same point (it isn't fully
// revealed by BALL_MAX_X, so its right edge is whatever's actually clipped in).
const ROLLIN_VISIBLE_RIGHT_EDGE =
    ROLLIN_TEXT_LEFT + Math.min(ROLLIN_CONTAINER_W, Math.max(0, BALL_MAX_X - BALL_RADIUS - ROLLIN_TEXT_LEFT));
const RIGHTMOST_LOCAL_X = Math.max(BALL_MAX_X + BALL_RADIUS, ROLLIN_VISIBLE_RIGHT_EDGE);

// The nav bar's own box (the line row) is centered via `left-1/2` +
// `translateX(-50%)`, so everything scales around its horizontal center.
const NAV_BOX_WIDTH = LINE_STEP * (LINE_COUNT - 1) + LINE_WIDTH;
const RIGHTMOST_FROM_CENTER = RIGHTMOST_LOCAL_X - NAV_BOX_WIDTH / 2;

function RollinText({ x }: { x: MotionValue<number> }) {
    // clipPath inset from the right: shrinks as ball moves right, revealing text left-to-right
    const clipPath = useTransform(x, (v) => {
        const revealed = Math.max(0, v - BALL_RADIUS - ROLLIN_TEXT_LEFT);
        const rightInset = Math.max(0, ROLLIN_CONTAINER_W - revealed);
        return `inset(0 ${rightInset}px 0 0)`;
    });

    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{
                left: ROLLIN_TEXT_LEFT,
                top: LINE_HEIGHT_ACTIVE + 4,
                height: BALL_RADIUS * 2 + 8,
                width: ROLLIN_CONTAINER_W,
                clipPath,
            }}
        >
            <span
                className="whitespace-nowrap text-[14px] leading-none h-full flex items-center text-sky-300"
                style={{ fontFamily: "var(--font-fredoka)" }}
            >
                {ROLLIN_LETTERS.map((char, i) => (
                    <motion.span
                        key={i}
                        className="inline-block"
                        animate={{ y: [0, -3, 0, 3, 0] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.1,
                        }}
                    >
                        {char === " " ? " " : char}
                    </motion.span>
                ))}
            </span>
        </motion.div>
    );
}

export function Indicator({ x }: { x: MotionValue<number> }) {
    const rotate = useTransform(x, (v) => v * DEG_PER_PX);

    return (
        <motion.div
            className="absolute"
            style={{
                x,
                top: LINE_HEIGHT_ACTIVE + 4,
                left: -BALL_RADIUS,
            }}
        >
            <motion.div
                className="rounded-full bg-(--accent) relative"
                style={{
                    width: BALL_RADIUS * 2,
                    height: BALL_RADIUS * 2,
                    rotate,
                }}
            >
                {/* Spoke so the rotation is visible */}
                <div
                    className="absolute rounded-full bg-white"
                    style={{
                        width: 1.5,
                        height: BALL_RADIUS - 1,
                        left: "50%",
                        top: 1.5,
                        transform: "translateX(-50%)",
                    }}
                />
            </motion.div>
        </motion.div>
    );
}
