"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { colorways, formatPrice, productHref, type ColorOption, type Product } from "@/data/catalog";
import { useBag } from "@/store/bag";

/** One garment on a hanger per colorway. */
type Piece = { id: string; src: string; product: Product; color: ColorOption };

const pieces: Piece[] = colorways.map(({ product, color }) => ({
  id: `${product.id}-${color.name}`,
  src: color.railImage,
  product,
  color,
}));

// The isomorphic version avoids a server-render warning.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * "The Rail": the collection hung on a clothing rack. Scrolling the page slides
 * the rack sideways, the pieces swing with the speed of the scroll, and clicking
 * one pulls it off the rail into a quick view.
 */
export default function TheRail() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [picked, setPicked] = useState<Piece | null>(null);
  const reduce = useReducedMotion();

  // How far the track must travel so its last piece reaches the right edge.
  useIsoLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (track) setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const smoothX = useSpring(x, { stiffness: 120, damping: 26, mass: 0.6 });

  // Swing: the faster the rail moves, the further the pieces lean back.
  const velocity = useVelocity(smoothX);
  const swing = useSpring(
    useTransform(velocity, (v) => (reduce ? 0 : Math.max(-9, Math.min(9, v / 140)))),
    { stiffness: 90, damping: 7, mass: 0.6 },
  );

  return (
    <section
      ref={sectionRef}
      aria-label="The Rail"
      // tall section: the extra height is the scroll distance that drives the rail
      style={{ height: `calc(100svh + ${distance}px)` }}
      className="relative border-y border-line"
    >
      <div className="sticky top-16 flex h-[calc(100svh-64px)] flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-[1400px] items-end justify-between px-6 pt-10 md:px-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">The Rail</p>
            <h2 className="mt-2 font-serif text-[36px] font-light leading-tight md:text-[48px]">Flip through the rack.</h2>
          </div>
          <p className="hidden max-w-[220px] text-right text-[12px] text-muted md:block">Scroll to slide the rail. Tap any piece to take it off the hanger.</p>
        </div>

        <div className="relative mt-6 flex-1">
          {/* the rail itself */}
          <div className="absolute inset-x-0 top-[22px] h-[3px] bg-gradient-to-b from-[#d9d4cb] via-[#8d8880] to-[#3b3936] shadow-[0_6px_14px_rgba(0,0,0,0.8)]" />

          <motion.div ref={trackRef} style={{ x: smoothX }} className="absolute left-0 top-0 flex h-full gap-6 pl-6 pr-[12vw] md:gap-10 md:pl-10">
            {pieces.map((piece, i) => (
              <Hanging key={piece.id} piece={piece} index={i} swing={swing} hidden={picked?.id === piece.id} onPick={() => setPicked(piece)} />
            ))}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>{picked && <QuickView piece={picked} onClose={() => setPicked(null)} />}</AnimatePresence>
    </section>
  );
}

function Hanging({
  piece,
  index,
  swing,
  hidden,
  onPick,
}: {
  piece: Piece;
  index: number;
  swing: MotionValue<number>;
  hidden: boolean;
  onPick: () => void;
}) {
  // alternate pieces swing slightly differently, so the rack doesn't move as one block
  const rotate = useTransform(swing, (s) => s * (index % 2 ? 0.8 : 1.1));

  return (
    <motion.button
      onClick={onPick}
      aria-label={`${piece.product.name} in ${piece.color.name}`}
      style={{ rotate, transformOrigin: "50% 22px" }}
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="group relative flex h-full w-[min(64vw,290px)] shrink-0 md:w-[clamp(200px,22vw,280px)] cursor-pointer flex-col items-center outline-none"
    >
      <motion.div
        layoutId={`rail-${piece.id}`}
        style={{ visibility: hidden ? "hidden" : "visible" }}
        className="relative w-full transition group-focus-visible:rounded-lg group-focus-visible:ring-2 group-focus-visible:ring-accent"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={piece.src} alt="" draggable={false} className="h-[min(68svh,620px)] w-full object-contain object-top drop-shadow-[0_24px_20px_rgba(0,0,0,0.45)]" />
      </motion.div>
      {/* swing tag */}
      <span className="pointer-events-none absolute left-[62%] top-[96px] origin-top -rotate-6 rounded-sm bg-paper px-2 py-1 text-[10px] font-medium tabular-nums text-ink opacity-0 shadow transition duration-300 group-hover:rotate-3 group-hover:opacity-100">
        {formatPrice(piece.product.price)}
      </span>
      <p className="mt-3 text-[12px] text-paper/80">{piece.product.name}</p>
      <p className="text-[11px] text-muted">{piece.color.name}</p>
    </motion.button>
  );
}

function QuickView({ piece, onClose }: { piece: Piece; onClose: () => void }) {
  const add = useBag((s) => s.add);
  const [size, setSize] = useState<string | null>(null);
  const [needSize, setNeedSize] = useState(false);
  const { product, color } = piece;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const addToBag = () => {
    if (!size) return setNeedSize(true);
    add([{ productId: product.id, size, colorName: color.name }]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 md:p-10">
      <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={`${product.name} quick view`} className="relative grid max-h-full w-full max-w-4xl grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-5 md:gap-10">
        {/* the photo flies here from the rail */}
        <motion.div layoutId={`rail-${piece.id}`} className="relative max-h-[80svh] overflow-hidden rounded-xl bg-card" transition={{ type: "spring", stiffness: 220, damping: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={piece.src} alt={`${product.name} in ${color.name} hanging on a hanger`} className="aspect-[3/4.4] h-full w-full object-contain" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.15 } }}
          exit={{ opacity: 0, x: 10, transition: { duration: 0.15 } }}
          className="flex min-w-0 flex-col justify-center"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-accent">{color.name}</p>
          <h3 className="mt-1 font-serif text-[30px] font-light leading-tight md:text-[42px]">{product.name}</h3>
          <p className="mt-1 text-[15px] tabular-nums">{formatPrice(product.price)}</p>
          <p className="mt-4 hidden text-[13px] leading-relaxed text-paper/70 sm:block">{product.description}</p>

          <p className={`mt-6 mb-2 text-[11px] uppercase tracking-[0.16em] ${needSize && !size ? "text-red-400" : "text-muted"}`}>
            {needSize && !size ? "Please choose a size" : "Size"}
          </p>
          <div className="flex gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSize(s);
                  setNeedSize(false);
                }}
                aria-pressed={size === s}
                className={`h-10 w-12 rounded-md border text-[13px] transition ${size === s ? "border-paper bg-paper text-ink" : "border-line hover:border-paper/50"}`}
              >
                {s}
              </button>
            ))}
          </div>

          <button onClick={addToBag} className="mt-6 w-full rounded-md bg-paper py-3.5 text-[13px] font-medium text-ink transition hover:bg-accent">
            Add to bag
          </button>
          <Link href={productHref(product, color)} className="mt-3 text-center text-[12px] text-muted underline-offset-4 hover:text-paper hover:underline">
            Full details &amp; size chart
          </Link>
          <button onClick={onClose} className="mt-4 text-[12px] text-muted hover:text-paper">
            Hang it back ✕
          </button>
        </motion.div>
      </div>
    </div>
  );
}
