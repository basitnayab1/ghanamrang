import Link from "next/link";
import { categories } from "@/data/catalog";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-14 text-[13px] sm:grid-cols-2 md:grid-cols-4 md:px-10">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark.svg" alt="غنم رنگ — Ghanam Rang" className="h-14 w-44 object-contain object-left" />
          <p className="mt-3 max-w-[240px] text-muted">Modest sets in deep, rich colour.</p>
        </div>
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted">Shop</p>
          <ul className="space-y-2">
            <li><Link href="/try-the-style" className="text-paper/80 hover:text-paper">Try the Style</Link></li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/shop?category=${c.id}`} className="text-paper/80 hover:text-paper">{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted">Help</p>
          {/* placeholder pages, filled in a later phase */}
          <ul className="space-y-2 text-paper/80">
            <li>Shipping &amp; delivery</li>
            <li>Returns &amp; exchanges</li>
            <li>Size guide</li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted">Order on WhatsApp</p>
          <a href="https://wa.me/923229120086" target="_blank" rel="noopener noreferrer" className="text-paper/80 hover:text-accent">
            +92 322 9120086
          </a>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1400px] justify-between border-t border-line px-6 py-5 text-[11px] text-muted md:px-10">
        <span>© {new Date().getFullYear()} Ghanam Rang</span>
        <span>Privacy · Terms</span>
      </div>
    </footer>
  );
}
