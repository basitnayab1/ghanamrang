"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { findColor, formatPrice, getProduct, heroFigures, productHref, type HeroFigure } from "@/data/catalog";

// WebGL only runs in the browser; three.js loads in its own chunk after the page
const Silk = dynamic(() => import("./Silk"), { ssr: false });

const ease = [0.22, 1, 0.36, 1] as const;
const CYCLE_MS = 3200;

/**
 * Where a figure sits in the floating cluster, by its place in the orbit:
 * 0 = front, 1 = right, 2 = back, 3 = left. Advancing the orbit moves the
 * right-hand figure to the front and the front one to the left.
 */
const SLOTS = [
  { x: 0, scale: 1, z: 40, blur: 0, bright: 1, y: 0 },
  { x: 0.2, scale: 0.8, z: 30, blur: 1.2, bright: 0.62, y: -10 },
  { x: 0.04, scale: 0.64, z: 10, blur: 3, bright: 0.38, y: -26 },
  { x: -0.2, scale: 0.8, z: 20, blur: 1.2, bright: 0.62, y: -10 },
];

export default function HomeHero() {
  const n = heroFigures.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // 0 while the hero fills the screen → 1 once it has scrolled away
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const outScale = useTransform(scrollYProgress, [0, 1], [1, 0.78]);
  const outY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const outTilt = useTransform(scrollYProgress, [0, 1], [0, 22]);
  const outOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  // "none" at rest: even blur(0px) makes the browser filter the whole hero every frame
  const outBlur = useTransform(scrollYProgress, (v) => (v < 0.02 ? "none" : `blur(${(v * 8).toFixed(1)}px)`));
  const [stageW, setStageW] = useState(900);

  // three.js (the silk) waits until the page has painted and the browser is idle,
  // so it never competes with the photos for bandwidth or the main thread
  const [silkReady, setSilkReady] = useState(false);
  useEffect(() => {
    const start = () => setSilkReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(start, 600);
    return () => clearTimeout(t);
  }, []);
  const [front, setFront] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const wide = stageW >= 700;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the cluster slowly orbits until someone hovers it or opens a piece
  useEffect(() => {
    if (focus || paused || reduce) return;
    const t = setInterval(() => setFront((f) => (f + 1) % n), CYCLE_MS);
    return () => clearInterval(t);
  }, [focus, paused, reduce, n]);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocus(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const focused = heroFigures.find((f) => f.id === focus) ?? null;

  const lead = focused ?? heroFigures[front];
  const leadProduct = getProduct(lead.productId);
  const silkColor = leadProduct ? findColor(leadProduct, lead.colorName).swatch : "#3a2a24";

  const targetFor = (fig: HeroFigure, i: number) => {
    if (focused) {
      if (fig.id === focused.id) {
        // on phones the panel covers the lower half, so the figure lifts and shrinks
        return wide
          ? { x: -stageW * 0.2, y: 0, scale: 0.96, opacity: 1, filter: "blur(0px) brightness(1)", zIndex: 50 }
          : { x: 0, y: -150, scale: 0.68, opacity: 1, filter: "blur(0px) brightness(1)", zIndex: 50 };
      }
      return { x: (i % 2 ? 1 : -1) * stageW * 0.15, y: 40, scale: 0.7, opacity: 0, filter: "blur(10px) brightness(0.4)", zIndex: 0 };
    }
    const s = SLOTS[(i - front + n) % n];
    // phones: smaller figures, spread wider, so the cluster stays readable
    return {
      x: s.x * stageW * (wide ? 1 : 1.6),
      y: s.y,
      scale: s.scale * (wide ? 1 : 0.66),
      opacity: 1,
      filter: `blur(${s.blur}px) brightness(${s.bright})`,
      zIndex: s.z,
    };
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <h1 className="sr-only">Ghanam Rang — abaya and khimar sets in deep colour</h1>
      {/* real-3D silk behind everything; it takes the colour of the piece in front */}
      {silkReady && <Silk color={silkColor} className="pointer-events-none absolute inset-0 animate-[silkIn_1.2s_ease-out_both]" />}
      {/* warm glow behind the cluster */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,176,138,0.12),transparent_65%)]" />
      {/* darken behind the figures so they stay the focus */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_38%_55%_at_50%_58%,rgba(0,0,0,0.32),transparent_72%)]" />

      {/* scrolling away tips the whole cluster back into the distance */}
      <motion.div
        style={reduce ? undefined : { scale: outScale, y: outY, rotateX: outTilt, opacity: outOpacity, filter: outBlur, transformPerspective: 1200, transformOrigin: "50% 100%" }}
        className="relative mx-auto flex min-h-[calc(100svh-64px)] max-w-[1400px] flex-col px-6 md:px-10"
      >
        <div
          ref={stageRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative min-h-[460px] flex-1"
        >
          {/* giant outlined word behind the focused piece */}
          <AnimatePresence>
            {focused && (
              <motion.p
                key={focused.word}
                aria-hidden
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.8, ease }}
                className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-serif text-[30vw] font-light uppercase leading-none text-transparent md:text-[19vw]"
                style={{ WebkitTextStroke: "1px rgba(241,236,228,0.13)" }}
              >
                {focused.word}
              </motion.p>
            )}
          </AnimatePresence>

          {/* floor shadow */}
          <div className="pointer-events-none absolute bottom-[3%] left-1/2 h-8 w-[46%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl" />

          {heroFigures.map((fig, i) => (
            <div key={fig.id} className="pointer-events-none absolute inset-x-0 bottom-[4%] top-[2%] flex items-end justify-center">
              <motion.button
                onClick={() => (focused ? setFocus(null) : setFocus(fig.id))}
                aria-label={focused ? "Back to all pieces" : `Open ${getProduct(fig.productId)?.name} in ${fig.colorName}`}
                animate={targetFor(fig, i)}
                transition={{ type: "spring", stiffness: 70, damping: 18, mass: 1 }}
                style={{ transformOrigin: "50% 100%" }}
                className={`relative h-full outline-none ${focused && fig.id !== focused.id ? "pointer-events-none" : "pointer-events-auto cursor-pointer"}`}
              >
                <motion.span
                  className="block h-full"
                  animate={reduce ? undefined : { y: [0, -8, 0] }}
                  transition={{ duration: 5 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fig.src} alt="" fetchPriority="high" draggable={false} className="h-full w-auto select-none drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
                </motion.span>
              </motion.button>
            </div>
          ))}

          <AnimatePresence>{focused && <FocusPanel key="panel" figure={focused} wide={wide} onPick={setFocus} onClose={() => setFocus(null)} />}</AnimatePresence>
        </div>

        {!focused && (
          <p className="relative z-[60] pt-3 text-center font-serif text-[24px] font-light md:hidden">
            Deep colour, <em className="text-accent">quiet</em> grace.
          </p>
        )}

        {/* footer row: number, dots, intro */}
        <div className="relative z-[60] grid grid-cols-[auto_1fr_auto] items-end gap-6 pb-8 pt-2">
          <span className="font-serif text-[40px] font-light leading-none tabular-nums text-paper/80">
            {String((focused ? heroFigures.indexOf(focused) : front) + 1).padStart(2, "0")}
          </span>

          <div className="flex justify-center gap-2 pb-2">
            {heroFigures.map((fig, i) => {
              const on = focused ? fig.id === focused.id : i === front;
              return (
                <button
                  key={fig.id}
                  aria-label={`Show piece ${i + 1}`}
                  onClick={() => (focused ? setFocus(fig.id) : setFront(i))}
                  className="grid h-6 w-6 place-items-center"
                >
                  <motion.span animate={{ width: on ? 22 : 6, opacity: on ? 1 : 0.4 }} className="block h-1.5 rounded-full bg-paper" />
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {!focused && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5, ease }}
                className="hidden max-w-[300px] text-right md:block"
              >
                <p className="font-serif text-[26px] font-light leading-tight">
                  Deep colour, <em className="text-accent">quiet</em> grace.
                </p>
                <p className="mt-2 text-[12px] text-muted">Tap any piece to take a closer look.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}

function FocusPanel({
  figure,
  wide,
  onPick,
  onClose,
}: {
  figure: HeroFigure;
  wide: boolean;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const product = getProduct(figure.productId)!;
  const color = findColor(product, figure.colorName);

  return (
    <motion.div
      initial={{ opacity: 0, x: wide ? 30 : 0, y: wide ? 0 : 20 }}
      animate={{ opacity: 1, x: 0, y: 0, transition: { delay: 0.25, duration: 0.6, ease } }}
      exit={{ opacity: 0, x: wide ? 20 : 0, transition: { duration: 0.2 } }}
      className={
        wide
          ? "absolute right-0 top-1/2 z-[60] w-[34%] max-w-[360px] -translate-y-1/2"
          : "absolute inset-x-0 bottom-0 z-[60] rounded-t-2xl border-t border-line bg-ink/85 p-5 backdrop-blur-md"
      }
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-accent">{color.name}</p>
      <h2 className="mt-1 font-serif text-[36px] font-light leading-[1.05] md:text-[52px]">{product.name}</h2>
      <p className="mt-2 text-[15px] tabular-nums">{formatPrice(product.price)}</p>
      {wide && <p className="mt-4 text-[13px] leading-relaxed text-paper/70">{product.description}</p>}

      {/* colour swatches swap the figure for the same set in another colour */}
      <div className="mt-5 flex items-center gap-2">
        {product.colors.map((c) => {
          const fig = heroFigures.find((f) => f.productId === product.id && f.colorName === c.name);
          const on = c.name === color.name;
          return (
            <button
              key={c.name}
              disabled={!fig}
              onClick={() => fig && onPick(fig.id)}
              aria-label={c.name}
              aria-pressed={on}
              className={`h-8 w-8 rounded-full border border-line transition ${on ? "ring-1 ring-paper ring-offset-2 ring-offset-ink" : "hover:scale-110"}`}
              style={{ background: c.swatch }}
            />
          );
        })}
        <span className="ml-2 text-[12px] text-muted">{product.colors.length > 1 ? `${product.colors.length} colours` : "1 colour"}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href={productHref(product, color)} className="group flex items-center gap-2 rounded-md bg-paper px-5 py-3 text-[13px] font-medium text-ink transition hover:bg-accent">
          Shop this set <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
        <button onClick={onClose} className="rounded-md border border-line px-4 py-3 text-[13px] transition hover:border-paper">
          ← All pieces
        </button>
      </div>
    </motion.div>
  );
}
