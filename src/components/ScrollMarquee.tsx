"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

/**
 * Two bands of large type that drift sideways on their own, speed up with
 * the scroll, flip direction when you scroll back up, and lean into the
 * movement like a banner in the wind.
 */
export default function ScrollMarquee({ items }: { items: string[] }) {
  return (
    <section aria-hidden className="relative overflow-hidden border-y border-line py-10 md:py-14">
      <Band items={items} baseSpeed={-2.2} />
      <Band items={[...items].reverse()} baseSpeed={2.2} outlined />
    </section>
  );
}

function Band({ items, baseSpeed, outlined = false }: { items: string[]; baseSpeed: number; outlined?: boolean }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-2000, 0, 2000], [-6, 0, 6], { clamp: false });
  const skew = useTransform(velocity, [-2000, 2000], [10, -10]);
  const dir = useRef(1);

  // x is a percentage of one copy of the row; wrap at -50% so the loop is seamless
  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const b = boost.get();
    if (b < -0.05) dir.current = -1;
    else if (b > 0.05) dir.current = 1;
    let next = x.get() + (baseSpeed * dir.current + b * Math.sign(baseSpeed)) * (delta / 1000);
    if (next <= -50) next += 50;
    if (next > 0) next -= 50;
    x.set(next);
  });
  const translate = useTransform(x, (v) => `${v}%`);

  const row = (
    <span className="flex shrink-0 items-center">
      {items.map((t) => (
        <span key={t} className="flex items-center">
          <span
            className={`whitespace-nowrap px-6 font-serif text-[64px] font-light uppercase leading-none md:text-[120px] ${outlined ? "text-transparent" : "text-paper/90"}`}
            style={outlined ? { WebkitTextStroke: "1px rgba(201,176,138,0.55)" } : undefined}
          >
            {t}
          </span>
          <span className="text-[28px] text-accent md:text-[40px]">✦</span>
        </span>
      ))}
    </span>
  );

  return (
    <motion.div style={{ x: translate, skewX: reduce ? 0 : skew }} className="flex w-max py-2">
      {row}
      {row}
    </motion.div>
  );
}
