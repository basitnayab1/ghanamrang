"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import dynamic from "next/dynamic";
import { colorways, formatPrice, heroFigures, productHref, thumbOf, type HeroFigure } from "@/data/catalog";

// WebGL only runs in the browser; three.js loads in its own chunk after the page
const AtelierBackdrop = dynamic(() => import("./AtelierBackdrop"), { ssr: false });

const ease = [0.22, 1, 0.36, 1] as const;
const CYCLE_MS = 6500;

// Only the front, left and right models are visible. The others wait behind the cluster.
const frontSlot = { x: 0, scale: 1, z: 40, blur: 0, bright: 1, y: 0, depth: 1, opacity: 1 };
const sideSlot = { x: 0.22, scale: 0.8, z: 30, blur: 1.2, bright: 0.72, y: -10, depth: 0.5, opacity: 1 };
const backSlot = { x: 0, scale: 0.64, z: 10, blur: 3, bright: 0.38, y: -26, depth: 0.2, opacity: 0 };
function slotFor(index: number, front: number, count: number) {
  const offset = (index - front + count) % count;
  if (offset === 0) return frontSlot;
  if (offset === 1) return sideSlot;
  if (offset === count - 1) return { ...sideSlot, x: -sideSlot.x };
  return backSlot;
}

type Style = (typeof colorways)[number];

/** Shifts its child with the pointer, by `depth` (0 = still, 1 = nearest). */
function Parallax({ mx, my, depth, children }: { mx: MotionValue<number>; my: MotionValue<number>; depth: number; children: React.ReactNode }) {
  // depth eases too, so a figure moving to the front picks up speed smoothly
  const d = useSpring(depth, { stiffness: 60, damping: 20 });
  useEffect(() => d.set(depth), [d, depth]);
  const x = useTransform([mx, d], ([a, b]: number[]) => a * b * 38);
  const y = useTransform([my, d], ([a, b]: number[]) => a * b * 16);
  return (
    <motion.div style={{ x, y }} className="flex h-full items-end">
      {children}
    </motion.div>
  );
}

export default function HomeHero() {
  const n = heroFigures.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const designNav = useRef<HTMLElement>(null);

  // 0 while the hero fills the screen → 1 once it has scrolled away
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const outScale = useTransform(scrollYProgress, [0, 1], [1, 0.78]);
  const outY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const outTilt = useTransform(scrollYProgress, [0, 1], [0, 22]);
  const outOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  // "none" at rest: even blur(0px) makes the browser filter the whole hero every frame
  const outBlur = useTransform(scrollYProgress, (v) => (v < 0.02 ? "none" : `blur(${(v * 8).toFixed(1)}px)`));
  const [stageW, setStageW] = useState(900);

  // The 3D backdrop waits until the page has painted and the browser is idle,
  // so it never competes with the photos for bandwidth or the main thread
  const [backdropReady, setBackdropReady] = useState(false);
  useEffect(() => {
    const start = () => setBackdropReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(start, 600);
    return () => clearTimeout(t);
  }, []);
  const [front, setFront] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);
  const [selection, setSelection] = useState<Style | null>(null);
  const [closeUp, setCloseUp] = useState(false);
  const [manual, setManual] = useState(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const suppressClickUntil = useRef(0);
  const showDesign = (index: number) => {
    setManual(true);
    setFront((index + n) % n);
  };
  const finishSwipe = (e: React.TouchEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || focus || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    suppressClickUntil.current = performance.now() + 450;
    showDesign(front + (dx < 0 ? 1 : -1));
  };
  const openCategory = (index: number) => {
    setManual(true);
    setFront(index);
    setSelection(null);
    setCloseUp(false);
    setFocus(heroFigures[index].id);
  };
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const wide = stageW >= 700;
  useEffect(() => {
    const nav = designNav.current;
    const active = nav?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!nav || !active) return;
    const left = active.offsetLeft;
    if (left < nav.scrollLeft || left + active.offsetWidth > nav.scrollLeft + nav.clientWidth) {
      nav.scrollTo({ left: left - (nav.clientWidth - active.offsetWidth) / 2, behavior: reduce ? "instant" : "smooth" });
    }
  }, [front, stageW, reduce]);

  // 3D depth: -1..1 pointer position. Figures in front move further than those
  // behind (parallax) and the whole cluster turns a little toward the pointer.
  // With no mouse (phones), the cluster sways gently on its own.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.8 });
  const smy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.8 });
  const stageTurn = useTransform(smx, [-1, 1], [-7, 7]);
  const stageTip = useTransform(smy, [-1, 1], [5, -5]);
  const wordShift = useTransform(smx, (v) => v * -26);
  const pointerAt = useRef(0); // time of the last real mouse move
  useAnimationFrame((t) => {
    if (reduce || performance.now() - pointerAt.current < 2500) return;
    mx.set(Math.sin(t / 2600) * 0.45);
    my.set(Math.cos(t / 3400) * 0.25);
  });
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
    pointerAt.current = performance.now();
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the cluster slowly orbits until someone hovers it or opens a piece
  useEffect(() => {
    if (focus || manual || paused || reduce) return;
    const t = setInterval(() => setFront((f) => (f + 1) % n), CYCLE_MS);
    return () => clearInterval(t);
  }, [focus, manual, paused, reduce, n]);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocus(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const focused = heroFigures.find((f) => f.id === focus) ?? null;

  const lead = focused ?? heroFigures[front];
  const activeStyle = focused && selection ? selection : lead;
  const detailImage = focused && closeUp ? activeStyle.color.closeUpImage : undefined;
  const panel = focused && (
    <FocusPanel figure={focused} selected={activeStyle} wide={wide}
      closeUp={!!detailImage} onView={setCloseUp}
      onPick={(style) => {
        setSelection(style);
        if (!style.color.closeUpImage) setCloseUp(false);
      }}
      onClose={() => setFocus(null)} />
  );
  const backdropColor = activeStyle.color.swatch;
  const prices = lead.styles.flatMap(({ product }) => product.price === null ? [] : [product.price]);
  const priceLabel = new Set(prices).size > 1 ? `From ${formatPrice(Math.min(...prices))}` : formatPrice(lead.product.price);
  const arrowClass = "absolute top-1/2 z-[55] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-paper/25 bg-ink/55 text-xl text-paper hover:border-accent focus-visible:outline-accent";

  const targetFor = (fig: HeroFigure, i: number) => {
    if (focused) {
      if (fig.id === focused.id) {
        return wide
          ? { x: -stageW * 0.2, y: 0, scale: 0.96, opacity: 1, filter: "blur(0px) brightness(1)", zIndex: 50 }
          : { x: 0, y: 0, scale: 1, opacity: 1, filter: "blur(0px) brightness(1)", zIndex: 50 };
      }
      return { x: (i % 2 ? 1 : -1) * stageW * 0.15, y: 40, scale: 0.7, opacity: 0, filter: "blur(10px) brightness(0.4)", zIndex: 0 };
    }
    const s = slotFor(i, front, n);
    // phones: smaller figures, spread wider, so the cluster stays readable
    return {
      x: s.x * stageW * (wide ? 1 : 1.6),
      y: s.y,
      scale: s.scale * (wide ? 1 : 0.95),
      opacity: s.opacity,
      filter: `blur(${s.blur}px) brightness(${s.bright})`,
      zIndex: s.z,
    };
  };

  return (
    <section id="collection-hero" ref={sectionRef} onPointerMove={onPointerMove} onFocusCapture={() => setManual(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="relative overflow-hidden">
      <h1 className="sr-only">Ghanam Rang — abaya and khimar sets in deep colour</h1>
      {/* The recessed arches take the colour of the piece in front. */}
      {backdropReady && <AtelierBackdrop color={backdropColor} subdued={!!focused} className="pointer-events-none absolute inset-0 animate-[silkIn_1.2s_ease-out_both]" />}
      {/* warm glow behind the cluster */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,176,138,0.12),transparent_65%)]" />
      {/* darken behind the figures so they stay the focus */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_38%_55%_at_50%_58%,rgba(0,0,0,0.32),transparent_72%)]" />

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/80 to-transparent" />
      {/* scrolling away tips the whole cluster back into the distance */}
      <motion.div
        style={reduce ? undefined : { scale: outScale, y: outY, rotateX: outTilt, opacity: outOpacity, filter: outBlur, transformPerspective: 1200, transformOrigin: "50% 100%" }}
        className="relative mx-auto flex h-[calc(100svh-64px)] min-h-[520px] max-w-[1400px] flex-col px-4 md:px-10"
      >
        <motion.div
          ref={stageRef}
          onTouchStart={(e) => {
            const t = e.touches[0];
            swipe.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
          }}
          onTouchCancel={() => { swipe.current = null; }}
          onTouchEnd={finishSwipe}
          onClickCapture={(e) => {
            if (performance.now() < suppressClickUntil.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          style={reduce ? undefined : { rotateY: stageTurn, rotateX: stageTip, transformPerspective: 1600 }}
          className="relative min-h-0 flex-1 touch-pan-y"
        >
          {/* giant outlined word behind the focused piece */}
          <AnimatePresence>
            {focused && (
              <motion.p
                key={focused.label}
                aria-hidden
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.8, ease }}
                className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-serif text-[30vw] font-light uppercase leading-none text-transparent md:text-[19vw]"
                style={{ WebkitTextStroke: "1px rgba(241,236,228,0.13)", translateX: wordShift }}
              >
                {focused.label}
              </motion.p>
            )}
          </AnimatePresence>

          {/* floor shadow */}
          <div className="pointer-events-none absolute bottom-[3%] left-1/2 h-8 w-[46%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl" />

          {detailImage && (
            <div className={`absolute inset-y-3 left-0 z-50 flex items-center justify-center ${wide ? "w-[61%]" : "w-full"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={detailImage} alt={`Close-up of ${activeStyle.product.name} in ${activeStyle.color.name}`}
                className="max-h-full max-w-full rounded-lg object-contain" />
            </div>
          )}
          {!detailImage && heroFigures.map((fig, i) => (slotFor(i, front, n).opacity > 0 && (
            <div
              key={fig.id}
              // stacking lives here: the parallax layer inside is its own stacking context
              style={{ zIndex: focused ? (fig.id === focused.id ? 50 : 0) : slotFor(i, front, n).z }}
              className="pointer-events-none absolute inset-x-0 bottom-[4%] top-[2%] flex items-end justify-center"
            >
              <Parallax mx={smx} my={smy} depth={focused ? (fig.id === focused.id ? 0.7 : 0) : slotFor(i, front, n).depth}>
              <motion.button
                onClick={() => (focused ? setFocus(null) : openCategory(i))}
                disabled={focused ? fig.id !== focused.id : !slotFor(i, front, n).opacity}
                aria-label={focused ? "Back to categories" : `Explore ${fig.label}`}
                aria-expanded={fig.id === focus}
                animate={targetFor(fig, i)}
                transition={{ type: "spring", stiffness: 70, damping: 18, mass: 1 }}
                style={{ transformOrigin: "50% 100%" }}
                className={`relative h-full max-w-[78vw] focus-visible:outline-accent ${focused && fig.id !== focused.id ? "pointer-events-none" : "pointer-events-auto cursor-pointer"}`}
              >
                <motion.span
                  className="block h-full"
                  animate={reduce ? undefined : { y: [0, -8, 0] }}
                  transition={{ duration: 5 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fig.id === focus ? activeStyle.color.modelImage : fig.src} alt="" fetchPriority={i === front ? "high" : "low"} draggable={false} className="h-full w-auto select-none object-contain object-bottom drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
                </motion.span>
              </motion.button>
              </Parallax>
            </div>
          )))}
          {!focused && <>
            <button type="button" aria-label="Previous design" onClick={() => showDesign(front - 1)} className={`${arrowClass} left-0`}>←</button>
            <button type="button" aria-label="Next design" onClick={() => showDesign(front + 1)} className={`${arrowClass} right-0`}>→</button>
          </>}
          {wide && panel}
        </motion.div>

        {!wide && panel}
        {!focused && (
          <div className="relative z-[60] shrink-0 pb-1 text-center">
            <h2 className="font-serif text-3xl leading-tight md:text-4xl">{lead.label}</h2>
            <p className="mt-1 text-sm text-paper/80">{priceLabel}</p>
            {lead.styles.length > 1 ? (
              <button onClick={() => openCategory(front)} className="mt-3 rounded-full bg-paper px-6 py-2.5 text-sm font-medium text-ink hover:bg-accent">
                Explore {lead.styles.length} colours →
              </button>
            ) : (
              <Link href={productHref(lead.product, lead.color)} className="mt-3 inline-block rounded-full bg-paper px-6 py-2.5 text-sm font-medium text-ink hover:bg-accent">
                View {lead.label} →
              </Link>
            )}
          </div>
        )}
        <nav ref={designNav} aria-label="Choose a design" className="relative z-[60] my-2 mr-16 flex w-fit max-w-[calc(100%-4rem)] shrink-0 gap-4 overflow-x-auto overscroll-x-contain md:mx-auto md:max-w-full md:gap-5">
          {heroFigures.map((fig, i) => (
            <button key={fig.id} aria-label={`Show ${fig.label}`} aria-pressed={i === front}
              onClick={() => focused ? openCategory(i) : showDesign(i)}
              className={`shrink-0 border-b-2 py-2 text-xs focus-visible:outline-offset-[-2px] md:py-3 md:text-sm ${i === front ? "border-accent text-paper" : "border-transparent text-paper/70 hover:text-paper"}`}>
              {fig.label}
            </button>
          ))}
        </nav>
      </motion.div>
    </section>
  );
}

function FocusPanel({
  figure,
  selected,
  wide,
  closeUp,
  onView,
  onPick,
  onClose,
}: {
  figure: HeroFigure;
  selected: Style;
  wide: boolean;
  closeUp: boolean;
  onView: (detail: boolean) => void;
  onPick: (style: Style) => void;
  onClose: () => void;
}) {
  const { product, color } = selected;
  const styles = figure.styles;

  return (
    <motion.div
      initial={{ opacity: 0, x: wide ? 30 : 0, y: wide ? 0 : 20 }}
      animate={{ opacity: 1, x: 0, y: 0, transition: { delay: 0.25, duration: 0.6, ease } }}
      exit={{ opacity: 0, x: wide ? 20 : 0, transition: { duration: 0.2 } }}
      className={
        wide
          ? "absolute right-0 top-1/2 z-[60] w-[34%] max-w-[360px] -translate-y-1/2"
          : "relative z-[60] mx-auto w-full max-w-sm shrink-0 rounded-xl border border-line bg-ink/85 px-3 py-2.5 text-center"
      }
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-accent">{figure.label}</p>
      <h2 className="mt-1 font-serif text-[24px] font-light leading-[1.05] md:text-[52px]">{product.name}</h2>
      <p className="mt-1 text-[14px] tabular-nums">{formatPrice(product.price)}</p>
      {(product.fabric || product.season) && (
        <p className="mt-1 text-xs text-paper/85">{[product.fabric, product.season].filter(Boolean).join(" · ")}</p>
      )}
      {wide && <p className="mt-4 text-[13px] leading-relaxed text-paper/70">{product.description}</p>}

      {color.closeUpImage && (
        <div role="group" aria-label="Photo view" className="mt-2 inline-flex rounded-full border border-paper/25 bg-ink/70 p-0.5 text-xs">
          {["Full look", "Close-up"].map((label, index) => (
            <button key={label} onClick={() => onView(index === 1)} aria-pressed={closeUp === (index === 1)}
              className="rounded-full px-3 py-1.5 aria-pressed:bg-paper aria-pressed:text-ink">{label}</button>
          ))}
        </div>
      )}
      <div role="group" aria-label={`${figure.label} styles`} className="mt-2 flex justify-center gap-1.5 md:mt-4 md:justify-start">
        {styles.map((style) => {
          const active = style.product.id === product.id && style.color.name === color.name;
          return (
            <button key={productHref(style.product, style.color)} onClick={() => onPick(style)} aria-pressed={active}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-md border px-1.5 py-1 text-center text-[11px] md:text-xs ${active ? "border-accent bg-card-2" : "border-line bg-ink/70 hover:border-paper/50"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbOf(style.color.modelImage)} alt="" className="h-8 w-6 shrink-0 md:h-12 md:w-9 rounded-sm bg-[#c9c3b8] object-contain" />
              <span>{style.color.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 md:mt-6 md:justify-start">
        <Link href={productHref(product, color)} className="group flex items-center gap-2 rounded-md bg-paper px-5 py-3 text-[13px] font-medium text-ink transition hover:bg-accent">
          View product <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
        <button onClick={onClose} aria-label="Back to all designs" className="rounded-md border border-line px-3 py-3 text-[13px] transition hover:border-paper">
          ← Back
        </button>
      </div>
    </motion.div>
  );
}
