"use client";

import { motion, type Variants } from "motion/react";
import AccentLine from "@/components/ui/AccentLine";
import SoccerGame from "@/components/sections/SoccerGame";
import { REVEAL_DELAY } from "@/components/sections/LineMinimap";

const TITLE_WORDS = ["Hi! I'm Ron", "I like to build"];
const CURRENT_ROLE = "currently in Notre Dame, IN";
const SOCIAL_LINKS = [
    { label: "GitHub", href: "https://github.com/rolin-rolin" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ron-lin" },
    { label: "Email", href: "mailto:rolin71110@gmail.com" },
];
const CURRENTLY = [
    { label: "producing", value: "music (more so beats)" },
    { label: "transitioning", value: "from trumpet → trombone" },
    { label: "training", value: "to run fast" },
];

// Every entrance on the hero page pops in together — scale + fade with a
// slight spring overshoot. The line minimap and the mobile "use a computer"
// notice are the only exceptions (see REVEAL_DELAY in LineMinimap.tsx).
const popIn: Variants = {
    hidden: { opacity: 0, scale: 0.85 },
    show: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 20 },
    },
};

export default function Hero() {
    return (
        <section className="relative h-full flex flex-col px-8 lg:px-24 pt-20 pb-6">
            {/* Main content row */}
            <div className="flex-1 flex items-center gap-12 min-h-0">
                {/* Left column */}
                <div className="flex-[3] flex flex-col justify-center min-w-0">
                    {/* Name + "currently at" badge */}
                    <motion.div
                        className="flex items-center gap-3 mb-6"
                        variants={popIn}
                        initial="hidden"
                        animate="show"
                    >
                        <p className="text-sm font-mono tracking-widest uppercase text-(--muted)">Ronald Lin</p>
                        <span className="text-xs font-mono px-2 py-0.5 border border-(--accent) text-(--accent) rounded-full">
                            {CURRENT_ROLE}
                        </span>
                    </motion.div>

                    {/* Big title — pops in as one block; kinetic float stays per-word */}
                    <motion.div variants={popIn} initial="hidden" animate="show">
                        {TITLE_WORDS.map((word, i) => (
                            <div key={word} className="overflow-hidden pb-3">
                                <motion.h1
                                    className="text-[clamp(2.25rem,min(7.8vw,9dvh),6.5rem)] font-semibold leading-[1] tracking-tight"
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
                            </div>
                        ))}
                    </motion.div>

                    <AccentLine />

                    {/* Intro + personal note */}
                    <motion.div
                        className="mt-6 max-w-[90%] flex flex-col gap-3"
                        variants={popIn}
                        initial="hidden"
                        animate="show"
                    >
                        <p className="text-sm font-mono uppercase tracking-widest text-(--muted) mb-1">
                            A little about me
                        </p>
                        <p className="text-[clamp(0.875rem,1.2vw,1rem)] leading-relaxed text-(--muted) font-mono">
                            I&rsquo;m a rising senior at the{" "}
                            <span className="text-(--foreground) font-medium">University of Notre Dame</span> studying{" "}
                            <span className="text-(--foreground) font-medium">computer science</span> and{" "}
                            <span className="text-(--foreground) font-medium">economics</span>.
                        </p>
                        <p className="text-[clamp(0.875rem,1.2vw,1rem)] leading-relaxed text-(--muted) font-mono">
                            I love <span className="text-(--foreground) font-medium">food</span>, making and listening
                            to <span className="text-(--foreground) font-medium">music</span>, every{" "}
                            <span className="text-(--foreground) font-medium">sport</span> imaginable, and views (like
                            mountains and stuff) that remind you the{" "}
                            <span className="text-(--foreground) font-medium">world</span> is absurdly beautiful.
                        </p>
                    </motion.div>

                    {/* Social links */}
                    <motion.div
                        className="mt-8 flex items-center gap-6"
                        variants={popIn}
                        initial="hidden"
                        animate="show"
                    >
                        {SOCIAL_LINKS.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-mono text-(--muted) hover:text-(--foreground) transition-colors underline underline-offset-4"
                            >
                                {link.label} ↗
                            </a>
                        ))}
                    </motion.div>

                    {/* Scroll hint */}
                    <motion.div
                        className="hidden lg:flex mt-10 items-center gap-3 text-sm text-(--muted)"
                        variants={popIn}
                        initial="hidden"
                        animate="show"
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
                            variants={popIn}
                            initial="hidden"
                            animate="show"
                        >
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ delay: 1.7, duration: 5, repeat: Infinity, ease: "easeInOut" }}
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
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Mobile notice — pops in with the line minimap, jump 1s later */}
            <motion.p
                className="lg:hidden text-xs font-mono text-(--muted) mb-3"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
                transition={{
                    default: { type: "spring", stiffness: 300, damping: 20, delay: REVEAL_DELAY },
                    y: {
                        duration: 0.5,
                        delay: REVEAL_DELAY + 1,
                        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                    },
                }}
            >
                for best viewing experience, use a computer pls
            </motion.p>

            {/* Status bar */}
            <motion.div
                data-ground-line
                className="flex items-center justify-between text-xs font-mono text-(--muted) border-t border-[rgba(0,0,0,0.1)] pt-4"
                variants={popIn}
                initial="hidden"
                animate="show"
            >
                <span>Available for work</span>
                <span>© 2026</span>
            </motion.div>
        </section>
    );
}
