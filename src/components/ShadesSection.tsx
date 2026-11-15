"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Shade } from "./Shades3D";

// three.js loads only when this section is about to scroll into view
const Shades3D = dynamic(() => import("./Shades3D"), { ssr: false, loading: () => null });

export default function ShadesSection({ shades }: { shades: Shade[] }) {
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} aria-labelledby="shades-title" className="relative overflow-hidden py-16 md:py-24">
      {/* soft warm light behind the rack */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(201,176,138,0.1),transparent_65%)]" />

      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Shades</p>
        <h2 id="shades-title" className="mt-2 font-serif text-[36px] font-light md:text-[44px]">
          Three shades, dyed <em className="text-accent">deep.</em>
        </h2>
        <p className="mt-2 text-[13px] text-muted">
          <span className="hidden md:inline">Move your mouse to turn the rack. </span>
          <span className="md:hidden">Tap a colour </span>
          <span className="hidden md:inline">Pick a colour </span>to see every set in it.
        </p>
      </div>

      <div className="relative mx-auto mt-4 h-[330px] max-w-[1400px] md:mt-6 md:h-[560px]">
        {near ? (
          <Shades3D shades={shades} />
        ) : (
          // placeholder with the same links, until the 3D loads (and for no-JS)
          <div className="flex h-full items-end justify-around pb-2">
            {shades.map((s) => (
              <Link key={s.name} href={s.href} className="text-center">
                <span className="block font-serif text-[22px] font-light md:text-[30px]">{s.name}</span>
                <span className="mt-0.5 block text-[11px] text-muted md:text-[12px]">{s.note}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
