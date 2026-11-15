"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/**
 * Tilts its content in 3D toward the pointer, with a soft moving glare,
 * like holding a card up to the light. Touch and reduced-motion users get a
 * plain, still element.
 */
export default function Tilt3D({
  children,
  className = "",
  max = 10,
}: {
  children: React.ReactNode;
  className?: string;
  /** largest tilt in degrees */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const hover = useMotionValue(0);

  const spring = { stiffness: 180, damping: 18, mass: 0.6 };
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const lift = useSpring(useTransform(hover, [0, 1], [0, 30]), spring);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glareOpacity = useSpring(hover, spring);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,245,225,0.28), transparent 55%)`;

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <div className={className} style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = ref.current!.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
          hover.set(1);
        }}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
          hover.set(0);
        }}
        style={{ rotateX, rotateY, z: lift, transformStyle: "preserve-3d" }}
        className="relative h-full w-full will-change-transform"
      >
        {children}
        <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light" style={{ background: glare, opacity: glareOpacity }} />
      </motion.div>
    </div>
  );
}
