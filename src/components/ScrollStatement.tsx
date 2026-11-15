"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

/**
 * A large statement whose words light up one by one as it scrolls through
 * the screen. Words wrapped in *asterisks* are set in the accent colour.
 */
export default function ScrollStatement({ text, eyebrow }: { text: string; eyebrow?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  // starts when the top of the text reaches 85% down the screen, ends at 35%
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.35"] });
  const words = text.split(" ");

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40">
      {eyebrow && <p className="mb-6 text-[11px] uppercase tracking-[0.22em] text-accent">{eyebrow}</p>}
      <p ref={ref} className="max-w-5xl font-serif text-[38px] font-light leading-[1.12] md:text-[72px]">
        {words.map((w, i) => {
          const accent = w.startsWith("*") && w.replace(/[.,]$/, "").endsWith("*");
          const clean = w.replace(/\*/g, "");
          const start = i / words.length;
          const end = start + 1 / words.length;
          return reduce ? (
            <span key={i} className={accent ? "italic text-accent" : ""}>{clean} </span>
          ) : (
            <Word key={i} progress={scrollYProgress} range={[start, end]} accent={accent}>
              {clean}
            </Word>
          );
        })}
      </p>
    </section>
  );
}

function Word({ children, progress, range, accent }: { children: string; progress: MotionValue<number>; range: [number, number]; accent: boolean }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const y = useTransform(progress, range, [14, 0]);
  const blur = useTransform(progress, range, ["blur(4px)", "blur(0px)"]);
  return (
    <>
      <motion.span style={{ opacity, y, filter: blur }} className={`inline-block ${accent ? "italic text-accent" : ""}`}>
        {children}
      </motion.span>{" "}
    </>
  );
}
