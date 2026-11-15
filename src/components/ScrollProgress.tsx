"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** A hairline across the top of the screen that fills as you read down the page. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[2px] origin-left bg-gradient-to-r from-accent/40 via-accent to-[#f1e3c8]"
    />
  );
}
