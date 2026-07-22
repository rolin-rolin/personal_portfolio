"use client";

import { animate, motion, useMotionTemplate, useMotionValue } from "motion/react";
import { useEffect } from "react";

export default function AccentLine() {
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
            className="h-[3px] w-32 mt-8 max-[480px]:mt-3 origin-left"
            style={{ background: accentGradient }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
    );
}
