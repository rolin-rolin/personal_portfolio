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

    return (
        <motion.div
            className="fixed top-10 left-1/2 -translate-x-1/2 z-50 cursor-pointer"
            onPointerMove={onMouseMove}
            onPointerLeave={onMouseLeave}
            onClick={(e) => {
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

    useProximity(scaleY, {
        ref,
        baseValue: 1,
        mouseX,
        scrollX,
        centerX,
        reset: false,
    });

    const colorClass = isSection ? "bg-(--accent)" : "bg-neutral-300";

    return (
        <motion.div
            ref={ref}
            className={colorClass}
            style={{
                width: LINE_WIDTH,
                height: isSection ? LINE_HEIGHT_ACTIVE : LINE_HEIGHT,
                scaleY,
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

        window.addEventListener("wheel", handleWheel, { passive: false });
        return () => window.removeEventListener("wheel", handleWheel);
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
