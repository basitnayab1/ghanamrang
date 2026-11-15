"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { bagCount, useBag } from "@/store/bag";

type Match = (path: string, q: URLSearchParams) => boolean;

const NAV: { href: string; label: string; match: Match }[] = [
  { href: "/try-the-style", label: "Try the Style", match: (p) => p === "/try-the-style" },
  { href: "/shop", label: "Shop all", match: (p, q) => (p === "/shop" && !q.get("category")) || p.startsWith("/product") },
  { href: "/shop?category=abaya-sets", label: "Abaya Sets", match: (p, q) => p === "/shop" && q.get("category") === "abaya-sets" },
  { href: "/shop?category=khimar-sets", label: "Khimar Sets", match: (p, q) => p === "/shop" && q.get("category") === "khimar-sets" },
];

export function Wordmark({ className = "" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/wordmark.svg" alt="غنم رنگ — Ghanam Rang" className={`h-12 w-[160px] object-contain ${className}`} />;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const params = useSearchParams();
  const count = useBag((s) => bagCount(s.lines));
  const setOpen = useBag((s) => s.setOpen);
  const [menu, setMenu] = useState(false);

  // close the mobile menu on navigation
  useEffect(() => setMenu(false), [pathname, params]);

  // The menu sits outside <header>: the header's backdrop-blur would otherwise
  // become the containing block for the fixed-position menu and clip it.
  return (
    <>
      <header className="sticky top-0 z-[100] border-b border-line bg-ink/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 text-[13px] md:px-10">
          <button className="-ml-2 p-2 md:hidden" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}>
            <span className="block h-px w-5 bg-paper" />
            <span className="mt-1.5 block h-px w-5 bg-paper" />
          </button>

          <Link href="/" className="md:w-48" aria-label="Ghanam Rang home">
            <Wordmark />
          </Link>

          <nav className="hidden gap-8 md:flex">
            {NAV.map((n) => {
              const active = n.match(pathname, params);
              return (
                <Link key={n.label} href={n.href} className={`relative py-1 transition ${active ? "text-paper" : "text-muted hover:text-paper"}`}>
                  {n.label}
                  {active && <motion.span layoutId="nav-underline" className="absolute inset-x-0 -bottom-0.5 h-px bg-accent" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex justify-end md:w-48">
            <button onClick={() => setOpen(true)} className="tabular-nums hover:text-accent">
              Bag ({count})
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <>
            <motion.div className="fixed inset-0 z-[150] bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />
            <motion.nav
              aria-label="Main menu"
              className="fixed left-0 top-0 z-[151] flex h-svh w-[82%] max-w-xs flex-col border-r border-line bg-card p-6"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              <div className="mb-10 flex items-center justify-between">
                <Wordmark />
                <button onClick={() => setMenu(false)} className="text-sm text-muted">Close</button>
              </div>
              {NAV.map((n, i) => (
                <motion.div key={n.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                  <Link href={n.href} className="block py-3 font-serif text-3xl font-light">
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
