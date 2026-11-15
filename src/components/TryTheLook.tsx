"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { looks } from "@/data/catalog";
import LookCarousel from "./LookCarousel";
import LookPanel from "./LookPanel";

export default function TryTheLook() {
  // ?look=mocha opens a specific style (linked from product pages)
  const lookParam = useSearchParams().get("look");
  const requested = looks.findIndex((l) => l.id === lookParam);
  const [active, setActive] = useState(requested >= 0 ? requested : 1);
  const go = (i: number) => setActive(Math.min(looks.length - 1, Math.max(0, i)));

  return (
    <section className="mx-auto flex min-h-[calc(100svh-64px)] max-w-[1400px] flex-col px-6 pb-8 md:px-10">
      <div className="pt-6">
        <h1 className="font-serif text-[40px] font-light leading-none md:text-[52px]">
          Try the <em>Style.</em>
        </h1>
        <p className="mt-2 text-[13px] text-muted">Swipe through every set. Pick your size and add the whole outfit.</p>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-8 lg:flex-row">
        <div className="relative flex min-h-[480px] flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <LookCarousel looks={looks} active={active} onActiveChange={setActive} />
          </div>

          {/* progress + controls */}
          <div className="flex items-center gap-6 pt-3">
            <div className="relative h-px max-w-[220px] flex-1 bg-line">
              <motion.div
                className="absolute inset-y-0 left-0 bg-accent"
                animate={{ width: `${((active + 1) / looks.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 30 }}
              />
            </div>
            <span className="text-[12px] text-muted">{looks[active].title}</span>
            <span className="ml-auto text-[12px] tabular-nums text-muted">
              {String(active + 1).padStart(2, "0")} / {String(looks.length).padStart(2, "0")}
            </span>
            <div className="flex gap-1">
              <button aria-label="Previous style" onClick={() => go(active - 1)} disabled={active === 0} className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/10 disabled:opacity-25">←</button>
              <button aria-label="Next style" onClick={() => go(active + 1)} disabled={active === looks.length - 1} className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/10 disabled:opacity-25">→</button>
            </div>
          </div>
        </div>

        <div className="lg:w-[360px]">
          {/* keyed so the chosen size resets when the style changes */}
          <LookPanel key={looks[active].id} look={looks[active]} />
        </div>
      </div>
    </section>
  );
}
