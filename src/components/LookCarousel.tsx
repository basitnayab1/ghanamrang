"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { Look } from "@/data/catalog";

type Props = {
  looks: Look[];
  active: number;
  onActiveChange: (i: number) => void;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Photo cards are 3:5 and fill this share of the stage height. */
const CARD_HEIGHT = 0.9;
const CARD_RATIO = 0.6;

export default function LookCarousel({ looks, active, onActiveChange }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  const max = looks.length - 1;

  const cardW = Math.min(size.h * CARD_HEIGHT * CARD_RATIO, size.w * 0.62);
  const spacing = cardW * 0.78;

  // `target` is where we want to be; `pos` is the smoothed, springy position.
  const target = useMotionValue(active);
  const pos = useSpring(target, { stiffness: 140, damping: 24, mass: 0.9 });
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The last index we reported ourselves, so we can tell it apart from
  // changes made outside (the arrow buttons).
  const emitted = useRef(active);

  useMotionValueEvent(pos, "change", (v) => {
    const i = clamp(Math.round(v), 0, max);
    if (i !== emitted.current) {
      emitted.current = i;
      onActiveChange(i);
    }
  });

  // External changes (arrow buttons) move the carousel.
  useEffect(() => {
    if (active !== emitted.current) {
      emitted.current = active;
      target.set(active);
    }
  }, [active, target]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const snap = () => target.set(clamp(Math.round(target.get()), 0, max));
  const scheduleSnap = () => {
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(snap, 140);
  };

  // Trackpad horizontal swipe (the gesture in the reference video).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // let vertical scroll through
      e.preventDefault();
      target.set(clamp(target.get() + e.deltaX / 260, -0.35, max + 0.35));
      scheduleSnap();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, target]);

  // Mouse / touch drag.
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, start: target.get(), moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    target.set(clamp(drag.current.start - dx / spacing, -0.35, max + 0.35));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      // a click: jump to the card under the pointer
      const rect = stageRef.current!.getBoundingClientRect();
      const offset = (e.clientX - (rect.left + rect.width / 2)) / spacing;
      target.set(clamp(Math.round(target.get() + offset), 0, max));
      return;
    }
    // a little momentum in the drag direction
    const dir = Math.sign(d.start - target.get());
    const v = target.get();
    target.set(clamp(Math.abs(v - Math.round(v)) > 0.2 ? Math.round(v - dir * 0.3) : Math.round(v), 0, max));
  };

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      role="listbox"
      aria-label="Styles"
      aria-activedescendant={`look-${looks[active].id}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") target.set(clamp(Math.round(target.get()) + 1, 0, max));
        if (e.key === "ArrowLeft") target.set(clamp(Math.round(target.get()) - 1, 0, max));
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ perspective: 1400 }}
      className="absolute inset-0 cursor-grab touch-pan-y select-none overflow-hidden outline-none active:cursor-grabbing"
    >
      {looks.map((look, i) => (
        <Card key={look.id} look={look} index={i} pos={pos} spacing={spacing} width={cardW} />
      ))}
    </div>
  );
}

function Card({
  look,
  index,
  pos,
  spacing,
  width,
}: {
  look: Look;
  index: number;
  pos: MotionValue<number>;
  spacing: number;
  width: number;
}) {
  const d = useTransform(pos, (v) => index - v);
  const x = useTransform(d, (d) => d * spacing);
  const rotateY = useTransform(d, (d) => clamp(-d * 22, -40, 40));
  const scale = useTransform(d, (d) => 1 - Math.min(Math.abs(d), 3) * 0.12);
  const filter = useTransform(d, (d) => {
    const a = Math.abs(d);
    return `blur(${Math.min(Math.max(0, a - 0.15) * 3, 10)}px) brightness(${clamp(1 - a * 0.32, 0.25, 1)})`;
  });
  const zIndex = useTransform(d, (d) => 100 - Math.round(Math.abs(d) * 10));

  return (
    <motion.div
      id={`look-${look.id}`}
      role="option"
      aria-label={look.title}
      style={{ x, rotateY, scale, filter, zIndex, width, marginLeft: -width / 2, height: width / CARD_RATIO }}
      className="absolute left-1/2 top-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] will-change-transform"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={look.image} alt={look.title} draggable={false} className="h-full w-full object-cover" />
    </motion.div>
  );
}
