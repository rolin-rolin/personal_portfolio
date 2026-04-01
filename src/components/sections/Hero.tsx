"use client";

import { animate, motion, useMotionTemplate, useMotionValue, type Variants } from "motion/react";
import { useEffect } from "react";
import { BlurReveal } from "@/components/ui/BlurReveal";
import SoccerGame from "@/components/sections/SoccerGame";

const TITLE_WORDS = ["Software", "Engineer"];
const SUBTITLE = "TODO: write your intro paragraph here.";
const CURRENT_ROLE = "@ Company"; // TODO: update
const SOCIAL_LINKS = [
    { label: "GitHub", href: "https://github.com/username" }, // TODO: update
    { label: "LinkedIn", href: "https://linkedin.com/in/username" }, // TODO: update
    { label: "Email", href: "mailto:you@example.com" }, // TODO: update
];


const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
};

const wordVariant: Variants = {
    hidden: { y: "110%", opacity: 0 },
    show: {
        y: "0%",
        opacity: 1,
        transition: {
            duration: 0.75,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        },
    },
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            delay: 0.55,
        },
    },
};

const lineDraw: Variants = {
    hidden: { scaleX: 0 },
    show: {
        scaleX: 1,
        transition: {
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            delay: 0.2,
        },
    },
};

// Animated gradient accent line
function AccentLine() {
    const shimmer = useMotionValue(0);
    useEffect(() => {
        animate(shimmer, 100, {
            duration: 2.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
        });
    }, [shimmer]);
    const accentGradient = useMotionTemplate`linear-gradient(90deg, #ff4d00 0%, #ffaa00 ${shimmer}%, #ff4d00 100%)`;

    return (
        <motion.div
            className="h-[3px] w-32 mt-8 origin-left"
            style={{ background: accentGradient }}
            variants={lineDraw}
            initial="hidden"
            animate="show"
        />
    );
}

export default function Hero() {
    return (
        <section className="h-screen flex flex-col px-8 md:px-16 lg:px-24 pt-20 pb-6">
            {/* Main content row */}
            <div className="flex-1 flex items-center gap-12 min-h-0">
                {/* Left column */}
                <div className="flex-[3] flex flex-col justify-center min-w-0">
                    {/* Name + "currently at" badge */}
                    <div className="flex items-center gap-3 mb-6">
                        <motion.p
                            className="text-sm font-mono tracking-widest uppercase text-(--muted)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            Ronald Lin
                        </motion.p>
                        <motion.span
                            className="text-xs font-mono px-2 py-0.5 border border-(--accent) text-(--accent) rounded-full"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            {CURRENT_ROLE}
                        </motion.span>
                    </div>

                    {/* Big title — entrance via variant on wrapper, kinetic float on h1 */}
                    <motion.div variants={container} initial="hidden" animate="show">
                        {TITLE_WORDS.map((word, i) => (
                            <div key={word} className="overflow-hidden pb-3">
                                <motion.div variants={wordVariant}>
                                    <motion.h1
                                        className="text-[clamp(3.5rem,10vw,9rem)] font-semibold leading-[0.9] tracking-tight"
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 4 + i,
                                            ease: "easeInOut",
                                            delay: 1.6 + i * 0.6,
                                        }}
                                    >
                                        {word === "Engineer" ? (
                                            <>
                                                {word}
                                                <span className="text-(--accent)">.</span>
                                            </>
                                        ) : (
                                            word
                                        )}
                                    </motion.h1>
                                </motion.div>
                            </div>
                        ))}
                    </motion.div>

                    <AccentLine />

                    {/* Subtitle — paragraph-friendly sizing */}
                    <motion.p
                        className="mt-6 text-base leading-relaxed text-(--muted) max-w-xl"
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                    >
                        {SUBTITLE}
                    </motion.p>

                    {/* Social links */}
                    <div className="mt-8 flex items-center gap-6">
                        {SOCIAL_LINKS.map((link, i) => (
                            <BlurReveal key={link.label} delay={900 + i * 150}>
                                <a
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-mono text-(--muted) hover:text-(--foreground) transition-colors underline underline-offset-4"
                                >
                                    {link.label} ↗
                                </a>
                            </BlurReveal>
                        ))}
                    </div>

                    {/* Scroll hint */}
                    <motion.div
                        className="mt-10 flex items-center gap-3 text-sm text-(--muted)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                    >
                        <motion.div
                            className="w-5 h-8 rounded-full border border-(--muted) flex items-start justify-center pt-1.5"
                            aria-hidden
                        >
                            <motion.div
                                className="w-1 h-1.5 rounded-full bg-(--muted)"
                                animate={{ y: [0, 8, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            />
                        </motion.div>
                        <span className="font-mono tracking-wider uppercase text-xs">Scroll</span>
                    </motion.div>
                </div>

                {/* Right column — Soccer game */}
                <SoccerGame />
            </div>

            {/* Status bar */}
            <motion.div
                data-ground-line
                className="flex items-center justify-between text-xs font-mono text-(--muted) border-t border-[rgba(0,0,0,0.1)] pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.5 }}
            >
                <span>Available for work</span>
                <span>San Francisco, CA</span> {/* TODO: update location */}
                <span>© 2026</span>
            </motion.div>
        </section>
    );
}
