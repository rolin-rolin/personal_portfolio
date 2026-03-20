"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { MAX } from "@/components/sections/LineMinimap";

const PROJECTS = [
  {
    name: "Project Alpha",
    description:
      "A high-performance data pipeline built for real-time analytics.",
    tags: ["TypeScript", "Kafka", "PostgreSQL"],
    href: "#",
  },
  {
    name: "Project Beta",
    description:
      "Interactive 3D visualization tool for complex network graphs.",
    tags: ["React", "Three.js", "WebGL"],
    href: "#",
  },
  {
    name: "Project Gamma",
    description:
      "Mobile-first design system with 60+ accessible components.",
    tags: ["React Native", "Tailwind", "Storybook"],
    href: "#",
  },
];

// Staggered input ranges for each card's entry animation
const CARD_RANGES: [number, number][] = [
  [MAX * 0.5, MAX * 0.78],
  [MAX * 0.6, MAX * 0.88],
  [MAX * 0.68, MAX * 0.96],
];

function ProjectCard({
  project,
  scrollX,
  inputRange,
}: {
  project: (typeof PROJECTS)[number];
  scrollX: MotionValue<number>;
  inputRange: [number, number];
}) {
  const x = useTransform(scrollX, inputRange, [80, 0]);
  const opacity = useTransform(scrollX, inputRange, [0, 1]);

  return (
    <motion.a
      href={project.href}
      className="group flex flex-col justify-between p-8 border border-neutral-200 rounded-lg w-72 h-60 hover:border-(--accent) transition-colors"
      style={{ x, opacity }}
      whileHover={{ scale: 1.02 }}
    >
      <div>
        <h3 className="text-2xl font-semibold mb-3">{project.name}</h3>
        <p className="text-sm text-(--muted) leading-relaxed">
          {project.description}
        </p>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex gap-2 flex-wrap">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono text-(--muted) bg-neutral-100 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-(--accent) text-xl group-hover:translate-x-1 transition-transform">
          →
        </span>
      </div>
    </motion.a>
  );
}

export default function Projects({
  scrollX,
}: {
  scrollX: MotionValue<number>;
}) {
  const headerOpacity = useTransform(scrollX, [MAX * 0.4, MAX * 0.65], [0, 1]);
  const headerY = useTransform(scrollX, [MAX * 0.4, MAX * 0.65], [24, 0]);

  return (
    <section className="h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24">
      <motion.p
        className="text-sm font-mono tracking-widest uppercase text-(--muted) mb-6"
        style={{ opacity: headerOpacity, y: headerY }}
      >
        Selected Work
      </motion.p>
      <motion.h2
        className="text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.9] tracking-tight mb-16"
        style={{ opacity: headerOpacity, y: headerY }}
      >
        Projects<span className="text-(--accent)">.</span>
      </motion.h2>
      <div className="flex gap-6">
        {PROJECTS.map((project, i) => (
          <ProjectCard
            key={project.name}
            project={project}
            scrollX={scrollX}
            inputRange={CARD_RANGES[i]}
          />
        ))}
      </div>
    </section>
  );
}
