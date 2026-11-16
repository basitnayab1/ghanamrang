import Link from "next/link";
import { categories } from "@/data/catalog";
import { FACEBOOK_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL, WHATSAPP_DISPLAY, whatsappLink } from "@/lib/social";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "./SocialIcons";

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
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted">Follow &amp; order</p>
          <div className="flex flex-col gap-2">
            <a
              href={whatsappLink("Assalam o Alaikum! I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-medium text-black transition hover:brightness-110"
            >
              <WhatsAppIcon className="h-4 w-4" /> {WHATSAPP_DISPLAY}
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-4 py-2 font-medium text-white transition hover:brightness-110"
            >
              <InstagramIcon className="h-4 w-4" /> {INSTAGRAM_HANDLE}
            </a>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 rounded-full bg-[#1877F2] px-4 py-2 font-medium text-white transition hover:brightness-110"
            >
              <FacebookIcon className="h-4 w-4" /> Facebook
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1400px] justify-between border-t border-line px-6 py-5 text-[11px] text-muted md:px-10">
        <span>© {new Date().getFullYear()} Ghanam Rang</span>
        <span>Privacy · Terms</span>
      </div>
    </footer>
  );
}
