"use client";

import { type MotionValue } from "motion/react";
import ScrollStrip from "@/components/sections/ScrollStrip";

export default function Miscellaneous({
  scrollX,
  stripTranslateX,
}: {
  scrollX: MotionValue<number>;
  stripTranslateX: MotionValue<number>;
}) {
  return <ScrollStrip pageScrollX={scrollX} translateX={stripTranslateX} />;
}
