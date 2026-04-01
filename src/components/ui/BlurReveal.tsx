import styles from "./BlurReveal.module.css";

const DEFAULT_BLUR = 10;
const DEFAULT_DURATION = 3500;

export function BlurReveal({
  children,
  duration = DEFAULT_DURATION,
  blur = DEFAULT_BLUR,
  delay = 0,
}: {
  children: React.ReactNode;
  blur?: number;
  duration?: number;
  delay?: number;
}) {
  return (
    <div
      className={styles.root}
      style={
        {
          "--duration-clip": duration + "ms",
          "--duration": duration + duration / 2 + "ms",
          "--blur": blur + "px",
          "--delay": delay + "ms",
        } as React.CSSProperties
      }
    >
      <div className={styles.banner}>{children}</div>
      <Effects />
    </div>
  );
}

function Effects() {
  return (
    <div className="absolute inset-0 -ml-8">
      <div aria-hidden className={styles.blur} />
      <svg className={styles.noise}>
        <filter id="noise">
          <feTurbulence
            baseFrequency="1"
            numOctaves="4"
            stitchTiles="stitch"
            type="fractalNoise"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect filter="url(#noise)" height="100%" width="100%" />
      </svg>
    </div>
  );
}
