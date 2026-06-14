"use client";

import { motion, type Variants } from "motion/react";
import { BlurReveal } from "@/components/ui/BlurReveal";
import AccentLine from "@/components/ui/AccentLine";
import SoccerGame from "@/components/sections/SoccerGame";

const TITLE_WORDS = ["Hi! I'm Ron", "I like to build"];
const CURRENT_ROLE = "@ University of Notre Dame";
const SOCIAL_LINKS = [
    { label: "GitHub", href: "https://github.com/rolin-rolin" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ron-lin" },
    { label: "Email", href: "mailto:rolin71110@gmail.com" },
];
const CURRENTLY = [
    { label: "reading", value: "TODO" },
    { label: "listening", value: "TODO" },
    { label: "building", value: "TODO" },
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

const subtitleContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.18, delayChildren: 0.55 } },
};

const subtitleLine: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
};

export default function Hero() {
    return (
        <section className="relative h-screen flex flex-col px-8 md:px-16 lg:px-24 pt-20 pb-6">
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
                                        className="text-[clamp(3rem,20vw,6.5rem)] font-semibold leading-[1] tracking-tight"
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 4 + i,
                                            ease: "easeInOut",
                                            delay: 1.6 + i * 0.6,
                                        }}
                                    >
                                        {word}
                                    </motion.h1>
                                </motion.div>
                            </div>
                        ))}
                    </motion.div>

                    <AccentLine />

                    {/* Intro + personal note */}
                    <motion.div
                        className="mt-6 max-w-[90%] flex flex-col gap-3"
                        variants={subtitleContainer}
                        initial="hidden"
                        animate="show"
                    >
                        <motion.p
                            className="text-sm font-mono uppercase tracking-widest text-(--muted) mb-1"
                            variants={subtitleLine}
                        >
                            A little about me
                        </motion.p>
                        <motion.p
                            className="text-base leading-relaxed text-(--muted)"
                            variants={subtitleLine}
                        >
                            I&rsquo;m a rising senior at the{" "}
                            <span className="text-(--foreground) font-medium">University of Notre Dame</span>{" "}
                            studying{" "}
                            <span className="text-(--foreground) font-medium">computer science</span>{" "}
                            and{" "}
                            <span className="text-(--foreground) font-medium">economics</span>.
                        </motion.p>
                        <motion.p
                            className="text-base leading-relaxed text-(--muted)"
                            variants={subtitleLine}
                        >
                            I love{" "}
                            <span className="text-(--foreground) font-medium">food</span>, making and
                            listening to{" "}
                            <span className="text-(--foreground) font-medium">music</span>, every{" "}
                            <span className="text-(--foreground) font-medium">sport</span> imaginable,
                            and views (like mountains and stuff) that remind you the{" "}
                            <span className="text-(--foreground) font-medium">world</span> is absurdly
                            beautiful.
                        </motion.p>
                    </motion.div>

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

                {/* Right column — Soccer game + "What I've been up to" */}
                <div className="hidden lg:flex flex-[2] flex-col gap-6 min-h-0 h-full">
                    <div className="flex-[5] min-h-0 flex flex-col justify-center">
                        <SoccerGame />
                    </div>
                    <div className="flex-[3]">
                        <motion.div
                            className="text-left"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: [0, -6, 0] }}
                            transition={{
                                opacity: { duration: 0.6, delay: 1.1 },
                                y: { delay: 1.7, duration: 5, repeat: Infinity, ease: "easeInOut" },
                            }}
                        >
                            <p className="text-sm font-mono uppercase tracking-widest text-(--muted) mb-5">
                                What I&rsquo;ve been up to
                            </p>
                            <div className="flex flex-col gap-5 items-start">
                                {CURRENTLY.map(({ label, value }) => (
                                    <div key={label} className="flex flex-col gap-1 border-l-2 border-(--accent) pl-3">
                                        <span className="text-base font-mono">{value}</span>
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-(--muted)">
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
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
