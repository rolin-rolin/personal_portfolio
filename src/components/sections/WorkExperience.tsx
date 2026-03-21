"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { MAX } from "@/components/sections/LineMinimap";

const JOBS = [
  {
    company: "Acme Corp",
    role: "Senior Software Engineer",
    period: "2022 — Present",
    bullets: [
      "Led migration from monolith to microservices, cutting p99 latency by 40%.",
      "Architected real-time data pipeline handling 50k events/sec.",
    ],
  },
  {
    company: "Startup Inc",
    role: "Software Engineer",
    period: "2020 — 2022",
    bullets: [
      "Built core product features from 0→1, contributing to Series A fundraise.",
      "Owned frontend architecture, improving LCP from 4.2s to 1.1s.",
    ],
  },
  {
    company: "Big Tech Co",
    role: "Software Engineer Intern",
    period: "Summer 2019",
    bullets: ["Shipped A/B experiment that increased user engagement by 12%."],
  },
];

const JOB_RANGES: [number, number][] = [
  [MAX * 0.05, MAX * 0.27],
  [MAX * 0.10, MAX * 0.30],
  [MAX * 0.15, MAX * 0.33],
];

function JobRow({
  job,
  scrollX,
  inputRange,
}: {
  job: (typeof JOBS)[number];
  scrollX: MotionValue<number>;
  inputRange: [number, number];
}) {
  const opacity = useTransform(scrollX, inputRange, [0, 1]);
  const y = useTransform(scrollX, inputRange, [16, 0]);

  return (
    <motion.div
      className="grid grid-cols-[180px_1fr] gap-8"
      style={{ opacity, y }}
    >
      <div>
        <p className="font-semibold">{job.company}</p>
        <p className="text-sm text-(--muted) font-mono mt-1">{job.period}</p>
      </div>
      <div>
        <p className="text-sm font-mono text-(--muted) uppercase tracking-widest mb-2">
          {job.role}
        </p>
        <ul className="space-y-1">
          {job.bullets.map((b) => (
            <li key={b} className="text-sm text-(--muted) leading-relaxed">
              <span className="text-(--accent) mr-2">—</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function WorkExperience({
  scrollX,
}: {
  scrollX: MotionValue<number>;
}) {
  const headerOpacity = useTransform(scrollX, [MAX * 0.0, MAX * 0.20], [0, 1]);
  const headerY = useTransform(scrollX, [MAX * 0.0, MAX * 0.20], [24, 0]);

  return (
    <section className="h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24">
      <motion.p
        className="text-sm font-mono tracking-widest uppercase text-(--muted) mb-6"
        style={{ opacity: headerOpacity, y: headerY }}
      >
        Work Experience
      </motion.p>
      <motion.h2
        className="text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.9] tracking-tight mb-16"
        style={{ opacity: headerOpacity, y: headerY }}
      >
        Experience<span className="text-(--accent)">.</span>
      </motion.h2>
      <div className="flex flex-col gap-10">
        {JOBS.map((job, i) => (
          <JobRow
            key={job.company}
            job={job}
            scrollX={scrollX}
            inputRange={JOB_RANGES[i]}
          />
        ))}
      </div>
    </section>
  );
}
