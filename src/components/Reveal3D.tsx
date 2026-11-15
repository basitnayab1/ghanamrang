"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Brings a block into view in 3D: it starts tipped back and pushed into the
 * page, then swings upright as it scrolls in. Plain for reduced-motion users.
 */
export default function Reveal3D({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, rotateX: -32, y: 70, z: -160 }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0, z: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1200, transformOrigin: "50% 0%" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
