"use client";

import React from "react";
import { type MotionValue } from "motion/react";
import ScrollStrip from "@/components/sections/ScrollStrip";

export default function Miscellaneous({ stripProgress, onStripActivate }: { stripProgress: MotionValue<number>; onStripActivate?: () => void }) {
  return (
    <div className="relative h-full w-full">
      <ScrollStrip progress={stripProgress} onActivate={onStripActivate} />
    </div>
  );
}
