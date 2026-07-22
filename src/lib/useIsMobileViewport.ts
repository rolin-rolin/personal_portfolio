"use client";

import { useEffect, useState } from "react";

// Matches Tailwind's `lg` breakpoint, which is also where ScrollStrip
// switches between its desktop (arrow/narration) and mobile layout.
const MOBILE_BREAKPOINT = 1024;

export function useIsMobileViewport() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        setIsMobile(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    return isMobile;
}
