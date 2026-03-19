"use client";

import { motion, type Variants } from "framer-motion";

const TITLE_WORDS = ["Software", "Engineer"];
const SUBTITLE = "Building things that move.";

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const wordVariant: Variants = {
  hidden: { y: "110%", opacity: 0 },
  show: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.55 },
  },
};

const lineDraw: Variants = {
  hidden: { scaleX: 0 },
  show: {
    scaleX: 1,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.2 },
  },
};

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-24 pb-16">
      {/* Name */}
      <motion.p
        className="text-sm font-mono tracking-widest uppercase text-(--muted) mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Ronald Lin
      </motion.p>

      {/* Big title */}
      <motion.div
        className="overflow-hidden"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {TITLE_WORDS.map((word) => (
          <div key={word} className="overflow-hidden">
            <motion.h1
              className="text-[clamp(4rem,12vw,10rem)] font-semibold leading-[0.9] tracking-tight"
              variants={wordVariant}
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
          </div>
        ))}
      </motion.div>

      {/* Accent line */}
      <motion.div
        className="h-[3px] w-32 bg-(--accent) mt-8 origin-left"
        variants={lineDraw}
        initial="hidden"
        animate="show"
      />

      {/* Subtitle */}
      <motion.p
        className="mt-6 text-xl md:text-2xl text-(--muted) max-w-md"
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        {SUBTITLE}
      </motion.p>

      {/* Scroll hint */}
      <motion.div
        className="mt-16 flex items-center gap-3 text-sm text-(--muted)"
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
    </section>
  );
}
