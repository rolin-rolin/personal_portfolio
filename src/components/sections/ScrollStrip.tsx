"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
    AnimatePresence,
    animate,
    motion,
    TargetAndTransition,
    useMotionValue,
    useMotionValueEvent,
    useSpring,
    useTransform,
    type MotionValue,
} from "motion/react";
import { clamp } from "@/lib/clamp";
import { useMobileDetect } from "@/lib/useMobileDetect";
import { useIsMobileViewport } from "@/lib/useIsMobileViewport";

// All strip geometry is derived from a single scale factor so that on
// narrow viewports every position, gap, and animation target shrinks
// together and stays internally consistent — scaling any of this via CSS
// instead (independent of the JS math below) is what desynced the drag
// bounds / clip-path / spring targets from the rendered size last time.
const MOBILE_SCALE = 0.55;

function getDims(scale: number) {
    const FRAME_WIDTH = 72 * scale;
    const FRAME_WIDTH_EXPANDED = 480 * scale;
    const FRAME_HEIGHT = FRAME_WIDTH * 4;
    const FRAME_HEIGHT_EXPANDED = 680 * scale;
    const FRAME_WIDTH_DIFF = FRAME_WIDTH_EXPANDED - FRAME_WIDTH;
    const FRAME_HEIGHT_DIFF = FRAME_HEIGHT_EXPANDED - FRAME_HEIGHT;
    const FRAME_GAP = 16 * scale;
    const FRAME_DIFF_CENTER = FRAME_WIDTH_DIFF / 2;
    const FRAME_STEP = FRAME_GAP + FRAME_WIDTH;

    // Layout constants for the arrow and strip positioning.
    // ARROW_OFFSET: how far left of frame 0 the arrow sits (px).
    // STRIP_EXTRA:  extra pixels to shift the entire strip toward the left edge.
    // ARROW_GAP:    equal breathing-room gap on each side of the arrow.
    // ─────────────────────────────────────────────────────────────────────
    //   [grid right edge] ──(ARROW_GAP)── [arrow] ──(ARROW_GAP)── [frame 0]
    // ─────────────────────────────────────────────────────────────────────
    const ARROW_OFFSET = 80 * scale;
    const STRIP_EXTRA = 50 * scale;
    const STRIP_INDENT = FRAME_DIFF_CENTER + FRAME_STEP / 2 + STRIP_EXTRA;
    const ARROW_GAP = ARROW_OFFSET + FRAME_GAP / 2;
    // Grid's right edge, expressed as CSS `right` from the viewport right edge.
    const GRID_OVERLAY_RIGHT = `calc(50vw + ${STRIP_INDENT + ARROW_OFFSET + ARROW_GAP}px)`;

    return {
        FRAME_WIDTH,
        FRAME_WIDTH_EXPANDED,
        FRAME_HEIGHT,
        FRAME_HEIGHT_EXPANDED,
        FRAME_WIDTH_DIFF,
        FRAME_HEIGHT_DIFF,
        FRAME_GAP,
        FRAME_DIFF_CENTER,
        FRAME_STEP,
        ARROW_OFFSET,
        STRIP_EXTRA,
        STRIP_INDENT,
        ARROW_GAP,
        GRID_OVERLAY_RIGHT,
    };
}

type Dims = ReturnType<typeof getDims>;

interface FrameSource {
    type: "image" | "video";
    src: string;
    poster?: string;
}

function image(src: string): FrameSource {
    return { type: "image", src };
}

function video(src: string, poster: string): FrameSource {
    return { type: "video", src, poster };
}

// Videos always render their poster frame; the actual <video> only mounts
// once the frame is active or scrolled near (see LAZY_LOAD_WINDOW below),
// so we're not streaming all 7 clips just because they're in the strip.
const FRAMES: FrameSource[] = [
    image("/scroll-strip/IMG_0196.jpg"),
    image("/scroll-strip/IMG_0434.JPEG"),
    video("/scroll-strip/IMG_1913.mp4", "/scroll-strip/IMG_1913_poster.jpg"),
    image("/scroll-strip/IMG_0743.jpg"),
    image("/scroll-strip/IMG_2220.jpg"),
    video("/scroll-strip/IMG_2789.mp4", "/scroll-strip/IMG_2789_poster.jpg"),
    image("/scroll-strip/IMG_2360.jpg"),
    image("/scroll-strip/IMG_3033.jpg"),
    video("/scroll-strip/IMG_2867.mp4", "/scroll-strip/IMG_2867_poster.jpg"),
    image("/scroll-strip/IMG_3425.jpg"),
    image("/scroll-strip/IMG_3719.jpg"),
    video("/scroll-strip/IMG_2951.mp4", "/scroll-strip/IMG_2951_poster.jpg"),
    image("/scroll-strip/IMG_8530_jpg.JPEG"),
    image("/scroll-strip/IMG_9471.jpg"),
    video("/scroll-strip/IMG_2999.mp4", "/scroll-strip/IMG_2999_poster.jpg"),
    image("/scroll-strip/IMG_9482.jpg"),
    image("/scroll-strip/IMG_9587.jpg"),
    video("/scroll-strip/IMG_9638.mp4", "/scroll-strip/IMG_9638_poster.jpg"),
    image("/scroll-strip/IMG_9625.jpg"),
    image("/scroll-strip/IMG_9628.jpg"),
    video("/scroll-strip/IMG_9708.mp4", "/scroll-strip/IMG_9708_poster.jpg"),
    image("/scroll-strip/IMG_9656.jpg"),
    image("/scroll-strip/IMG_9723.jpg"),
    image("/scroll-strip/IMG_3896.jpg"),
    image("/scroll-strip/IMG_3959.jpg"),
];

// How many frames on either side of the current scroll position get their
// <video> mounted. Everything outside this window just shows its poster.
const LAZY_LOAD_WINDOW = 2;

const NARRATIONS = [
    "first morning in kyoto, before anyone else was awake",
    "my dog doing the thing where she stares at nothing",
    "the light through my apartment at 4pm in november",
    "a meal that took three hours and was gone in twenty minutes",
    "the hiking trail we almost turned back on",
    "a city i didn't expect to love",
    "golden hour that lasted exactly four minutes",
    "the kind of quiet you only get on long drives",
    "our corner table at the spot we went to every week",
    "the view from the roof we weren't supposed to be on",
    "catching the last train by thirty seconds",
    "a friend who always orders too much food",
    "the beach before the crowd showed up",
    "a weekend trip that turned into a week",
    "a coffee shop i never found again",
    "the moment right before it started raining",
    "somewhere in the mountains, no signal, didn't matter",
    "the cat near the market that trusted no one",
    "a sunset that felt like it was just for us",
    "the apartment we lived in when everything changed",
    "three in the morning and we were still talking",
    "the garden we stumbled into by accident",
    "a bookstore with no particular system",
    "the last day of something good",
    "still figuring out what this one means",
];

export default function ScrollStrip({
    progress,
    onActivate,
}: {
    progress?: MotionValue<number>;
    onActivate?: () => void;
}) {
    const detect = useMobileDetect();
    const isMobile = detect.isMobile();
    const isNarrowViewport = useIsMobileViewport();

    const dims = React.useMemo(() => getDims(isNarrowViewport ? MOBILE_SCALE : 1), [isNarrowViewport]);
    const { FRAME_HEIGHT, FRAME_DIFF_CENTER, FRAME_GAP, FRAME_STEP, ARROW_OFFSET, STRIP_EXTRA, STRIP_INDENT, GRID_OVERLAY_RIGHT } =
        dims;
    const STRIP_MAX = FRAME_STEP * (FRAMES.length - 1);

    const [activeIndex, setActiveIndex] = React.useState<null | number>(null);
    const [narrateIndex, setNarrateIndex] = React.useState(0);
    const [isInStrip, setIsInStrip] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const translateX = useMotionValue(STRIP_EXTRA);

    // Re-snap the strip whenever the geometry scale changes (e.g. crossing
    // the mobile breakpoint) so translateX/activeIndex stay in sync with
    // the new frame sizes instead of animating from stale pixel offsets.
    React.useEffect(() => {
        translateX.set(activeIndex === null ? STRIP_EXTRA : -activeIndex * FRAME_STEP + STRIP_EXTRA);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dims]);

    useMotionValueEvent(translateX, "change", (v) => {
        progress?.set((STRIP_EXTRA - v) / STRIP_MAX);
        setNarrateIndex(Math.round(clamp((STRIP_EXTRA - v) / FRAME_STEP, [0, FRAMES.length - 1])));
    });
    const containerRef = React.useRef<HTMLDivElement>(null);
    const wheelEndRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const activeIndexRef = React.useRef<number | null>(null);
    React.useEffect(() => {
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    // Keyboard navigation — only active while the strip is fully in view, and
    // only intercepts arrow keys when a frame is actually expanded, so it
    // never swallows arrow/escape keys meant for the rest of the page.
    React.useEffect(() => {
        if (!isInStrip) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                if (activeIndexRef.current !== null) setActiveIndex(null);
                return;
            }
            if (activeIndexRef.current === null) return;
            if (e.key === "ArrowRight") arrow(1)(e);
            if (e.key === "ArrowLeft") arrow(-1)(e);
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isInStrip]);

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
                    animate(translateX, STRIP_EXTRA, { type: "spring", stiffness: 500, damping: 30 });
                }
                if (nowInView && !inView.current) onActivate?.();
                inView.current = nowInView;
                setIsInStrip(nowInView);
            },
            { threshold: 0.99 },
        );
        observer.observe(el);

        function handleWheel(e: WheelEvent) {
            if (!inView.current) return; // section not fully visible — let page handle

            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            const current = translateX.get();

            if (delta > 0 && current <= -STRIP_MAX + STRIP_EXTRA) return; // end — let page handle
            if (delta < 0 && current >= STRIP_EXTRA) return; // start — let page handle

            e.preventDefault();

            translateX.stop();
            translateX.set(clamp(current - delta, [-STRIP_MAX + STRIP_EXTRA, STRIP_EXTRA]));
            setActiveIndex(null);

            clearTimeout(wheelEndRef.current);
            wheelEndRef.current = setTimeout(() => {
                const index = Math.round(clamp((STRIP_EXTRA - translateX.get()) / FRAME_STEP, [0, FRAMES.length - 1]));
                setActiveIndex((cur) => (cur === null ? index : cur));
            }, 150);
        }

        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => {
            el.removeEventListener("wheel", handleWheel);
            observer.disconnect();
        };
        // STRIP_MAX/STRIP_EXTRA/FRAME_STEP are derived from `dims`, which changes
        // when the mobile/desktop scale flips — the handler must be rebuilt with
        // fresh values then, or it clamps/derives activeIndex using stale (wrong-
        // scale) geometry while frames render at the new scale.
    }, [isMobile, translateX, STRIP_MAX, STRIP_EXTRA, FRAME_STEP]);

    // Animate translateX when activeIndex changes (click or arrow keys)
    React.useEffect(() => {
        if (activeIndex !== null) {
            animate(translateX, -activeIndex * FRAME_STEP + STRIP_EXTRA, {
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
        <>
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isInStrip && (
                            <motion.div
                                className="hidden lg:block fixed top-8 right-8 text-right z-50 pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={narrateIndex}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.35, ease: "easeInOut" }}
                                        className="font-mono text-sm leading-relaxed text-(--muted) max-w-[260px]"
                                    >
                                        {NARRATIONS[narrateIndex]}
                                    </motion.p>
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}

            <div ref={containerRef} className="relative flex h-full w-[100vw] items-center">
                {/* Static text overlay — moves with the strip */}
                <motion.div style={{ x: translateX }} className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute top-1/2 -translate-y-1/2 text-right pointer-events-none hidden lg:block"
                        style={{ right: GRID_OVERLAY_RIGHT }}
                    >
                        <p className="font-mono text-sm leading-relaxed text-(--muted) max-w-[220px]">
                            this is also a quiet archive
                            <br />
                            highlights from my camera roll
                        </p>
                    </div>
                </motion.div>

                <div
                    className="relative"
                    style={{
                        height: FRAME_HEIGHT,
                        marginLeft: `calc(50vw - ${STRIP_INDENT}px)`,
                    }}
                >
                    <motion.div style={{ x: translateX, height: FRAME_HEIGHT }} className="relative">
                        {/* Arrow sits at a fixed negative offset from frame 0 — moves with the strip
              so it can never be overlapped by frames no matter how far you scroll */}
                        <motion.span
                            className="absolute top-1/2 -translate-y-1/2 text-(--accent) text-3xl font-mono select-none pointer-events-none hidden lg:block"
                            style={{ left: -ARROW_OFFSET }}
                            animate={{ x: [0, 6, 0] }}
                            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                        >
                            →
                        </motion.span>
                        {FRAMES.map((frame, i) => {
                            const active = activeIndex === i;
                            const shouldLoadVideo = active || Math.abs(i - narrateIndex) <= LAZY_LOAD_WINDOW;
                            return (
                                <Frame
                                    key={i}
                                    active={active}
                                    dims={dims}
                                    onClick={() => setActiveIndex(i === activeIndex ? null : i)}
                                    animate={{ x: x(i) }}
                                    style={{ left: `${i * FRAME_STEP + FRAME_GAP / 2}px` }}
                                >
                                    {frame.type === "video" ? (
                                        shouldLoadVideo ? (
                                            <video
                                                src={frame.src}
                                                poster={frame.poster}
                                                className="pointer-events-none h-full w-full select-none object-cover"
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                        ) : (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={frame.poster}
                                                alt=""
                                                className="pointer-events-none h-full w-full select-none object-cover"
                                            />
                                        )
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={frame.src}
                                            alt=""
                                            className="pointer-events-none h-full w-full select-none object-cover"
                                        />
                                    )}
                                </Frame>
                            );
                        })}
                    </motion.div>
                </div>
                {/* Below-lg narration — centered below the expanded frame */}
                <AnimatePresence>
                    {activeIndex !== null && (
                        <motion.div
                            className="lg:hidden absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={activeIndex}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.35, ease: "easeInOut" }}
                                    className="font-mono text-sm leading-relaxed text-(--muted) max-w-[260px]"
                                >
                                    {NARRATIONS[activeIndex]}
                                </motion.p>
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

interface FrameProps {
    children: React.ReactNode;
    active: boolean;
    dims: Dims;
    animate?: TargetAndTransition;
    style?: React.CSSProperties;
    onClick?: () => void;
}

function Frame({ children, active, dims, animate: animateProp, style, ...props }: FrameProps) {
    const { FRAME_DIFF_CENTER, FRAME_HEIGHT_EXPANDED, FRAME_HEIGHT, FRAME_HEIGHT_DIFF, FRAME_WIDTH_EXPANDED } = dims;
    const clip = useSpring(FRAME_DIFF_CENTER, { stiffness: 500, damping: 50 });

    React.useEffect(() => {
        clip.set(active ? 0 : FRAME_DIFF_CENTER);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, FRAME_DIFF_CENTER]);

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
