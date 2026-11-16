"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { colorways, formatPrice, productHref, products } from "@/data/catalog";
import { CITIES, DELIVERY_FEE, FREE_DELIVERY_OVER, normalisePhone } from "@/lib/checkout";
import { FACEBOOK_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL, WHATSAPP_DISPLAY, whatsappLink } from "@/lib/social";
import { ChatIcon, FacebookIcon, InstagramIcon, WhatsAppIcon } from "./SocialIcons";

/**
 * Floating WhatsApp button + a guided chat assistant.
 *
 * The assistant answers the common questions (sizes, delivery, payment,
 * which set), shares the shop's Instagram / Facebook / WhatsApp, and takes a
 * visitor's details (name, phone, city, what they like) step by step. Details
 * are saved as a lead for the admin page, and the visitor can carry on the
 * conversation on WhatsApp with a ready-written message.
 *
 * It is rule-based on purpose: free to run, instant, and it never makes
 * anything up about prices or stock.
 */

type LinkKind = "whatsapp" | "instagram" | "facebook" | "page";
type ChatLink = { label: string; href: string; kind: LinkKind };
type Msg = { id: number; from: "bot" | "user"; text: string; links?: ChatLink[] };
type Step = "menu" | "name" | "phone" | "city" | "interest" | "message" | "done";
type Lead = { name: string; phone: string; city: string; interest: string; message: string };

const MENU = ["Help me choose a set", "Sizes & fit", "Delivery & payment", "Instagram, Facebook & WhatsApp", "Leave my details"];
const AFTER = ["Sizes & fit", "Delivery & payment", "Instagram, Facebook & WhatsApp"];
const INTERESTS = [...colorways.map(({ product, color }) => `${product.name} — ${color.name}`), "Not sure yet"];
const CITY_CHIPS = [...CITIES.slice(0, 6), "Other"];

const social: ChatLink[] = [
  { label: `Instagram ${INSTAGRAM_HANDLE}`, href: INSTAGRAM_URL, kind: "instagram" },
  { label: "Facebook page", href: FACEBOOK_URL, kind: "facebook" },
  { label: `WhatsApp ${WHATSAPP_DISPLAY}`, href: whatsappLink("Assalam o Alaikum! I have a question about Ghanam Rang."), kind: "whatsapp" },
];

function sizesText() {
  const lines = products.map((p) => {
    const lengths = p.sizeChart.rows.map((r) => r[1]).join(" / ");
    return `• ${p.name}: length ${lengths} ${p.sizeChart.unit} (S / M / L)`;
  });
  return `Every set comes in Small, Medium and Large with a relaxed fit.\n${lines.join("\n")}\nNot sure which size? Leave your details and we'll help you choose.`;
}

const deliveryText = () =>
  `We deliver across Pakistan. Delivery is ${formatPrice(DELIVERY_FEE)}, and free on orders over ${formatPrice(FREE_DELIVERY_OVER)}.\nPay cash on delivery, or by bank / JazzCash / Easypaisa transfer.`;

/** Rough intent from free text typed at the menu. */
function route(text: string): string | null {
  const t = text.toLowerCase();
  if (/size|fit|length|chest|small|medium|large|naap/.test(t)) return "Sizes & fit";
  if (/deliver|shipping|cod|cash|pay|courier|kitne din|charges/.test(t)) return "Delivery & payment";
  if (/insta|facebook|fb|whats|contact|number|call|page/.test(t)) return "Instagram, Facebook & WhatsApp";
  if (/abaya|khimar|set|colou?r|navy|olive|mocha|price|rs|buy|order|kharid/.test(t)) return "Help me choose a set";
  if (/detail|call me|contact me|rabta|name|phone/.test(t)) return "Leave my details";
  return null;
}

export default function ChatAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>("menu");
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [lead, setLead] = useState<Lead>({ name: "", phone: "", city: "", interest: "", message: "" });
  const idRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const push = (m: Omit<Msg, "id">) => setMsgs((ms) => [...ms, { ...m, id: ++idRef.current }]);
  const bot = (text: string, links?: ChatLink[]) =>
    new Promise<void>((resolve) => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        push({ from: "bot", text, links });
        resolve();
      }, 420 + Math.min(text.length * 6, 700));
    });

  // greet the first time the chat opens
  useEffect(() => {
    if (open && msgs.length === 0) {
      bot("Assalam o Alaikum! 👋 I'm the Ghanam Rang assistant. How can I help you today?");
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // a gentle "need help?" bubble once per visit
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("gr-chat-nudge") === "1";
    } catch {}
    if (seen) return;
    const t = setTimeout(() => {
      setNudge(true);
      try {
        sessionStorage.setItem("gr-chat-nudge", "1");
      } catch {}
    }, 18000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const topic = async (choice: string) => {
    switch (choice) {
      case "Help me choose a set":
        await bot(
          "Here are our sets. Tap one to see it, or leave your details and we'll help you pick.",
          colorways.map(({ product, color }) => ({
            label: `${product.name} — ${color.name} · ${formatPrice(product.price)}`,
            href: productHref(product, color),
            kind: "page" as const,
          })),
        );
        break;
      case "Sizes & fit":
        await bot(sizesText(), products.map((p) => ({ label: `${p.name} size chart`, href: `/product/${p.id}`, kind: "page" as const })));
        break;
      case "Delivery & payment":
        await bot(deliveryText());
        break;
      case "Instagram, Facebook & WhatsApp":
        await bot("Follow us for new drops, or message us any time on WhatsApp:", social);
        break;
      case "Leave my details":
        setStep("name");
        await bot("Lovely! Our team will get back to you on WhatsApp. First, what's your name?");
        break;
    }
  };

  const submitLead = async (final: Lead) => {
    setStep("done");
    setTyping(true);
    let ok = false;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...final, page: pathname, website: "" }),
      });
      ok = res.ok;
    } catch {}
    setTyping(false);
    const waText = [
      `Assalam o Alaikum! I'm ${final.name}${final.city ? ` from ${final.city}` : ""}.`,
      final.interest && final.interest !== "Not sure yet" ? `I'm interested in the ${final.interest}.` : "I'd like some help choosing a set.",
      final.message,
    ]
      .filter(Boolean)
      .join(" ");
    const wa: ChatLink = { label: "Continue on WhatsApp now", href: whatsappLink(waText), kind: "whatsapp" };
    if (ok) {
      await bot(`Shukriya, ${final.name.split(" ")[0]}! ✨ We've got your details and will message you on WhatsApp at ${final.phone} soon. Want to talk right away?`, [wa]);
    } else {
      await bot("Sorry, we couldn't save your details just now. Please message us on WhatsApp instead:", [wa]);
    }
  };

  const answer = async (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    push({ from: "user", text });
    setInput("");

    switch (step) {
      case "menu":
      case "done": {
        if (MENU.includes(text)) return topic(text);
        const r = route(text);
        if (r) return topic(r);
        return bot("I'm a simple assistant, so I can't answer that one — but our team can. Leave your details, or message us on WhatsApp:", [social[2]]);
      }
      case "name":
        if (text.length < 2) return bot("Could you tell me your full name?");
        setLead((l) => ({ ...l, name: text.slice(0, 80) }));
        setStep("phone");
        return bot(`Nice to meet you, ${text.split(" ")[0]}! What's your WhatsApp number? (e.g. 0300 1234567)`);
      case "phone": {
        const phone = normalisePhone(text);
        if (!phone) return bot("That doesn't look like a Pakistani mobile number. Please try again, e.g. 0300 1234567.");
        setLead((l) => ({ ...l, phone }));
        setStep("city");
        return bot("Which city are you in?");
      }
      case "city":
        setLead((l) => ({ ...l, city: text.slice(0, 60) }));
        setStep("interest");
        return bot("Which set caught your eye?");
      case "interest":
        setLead((l) => ({ ...l, interest: text.slice(0, 120) }));
        setStep("message");
        return bot("Anything else you'd like us to know? (size, colour, a question…) — or tap Skip.");
      case "message": {
        const final = { ...lead, message: text === "Skip" ? "" : text.slice(0, 500) };
        setLead(final);
        return submitLead(final);
      }
    }
  };

  const chips =
    typing ? [] : step === "menu" ? MENU : step === "city" ? CITY_CHIPS : step === "interest" ? INTERESTS : step === "message" ? ["Skip"] : step === "done" ? AFTER : [];

  const placeholder =
    step === "name" ? "Your name" : step === "phone" ? "0300 1234567" : step === "city" ? "Your city" : step === "interest" ? "Tell us what you like" : step === "message" ? "Your message" : "Type a question…";

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* floating buttons */}
      <div className="fixed bottom-4 right-4 z-[180] flex flex-col items-end gap-3 md:bottom-6 md:right-6">
        <AnimatePresence>
          {nudge && !open && (
            <motion.button
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={() => {
                setNudge(false);
                setOpen(true);
              }}
              className="max-w-[220px] rounded-2xl rounded-br-sm border border-line bg-card px-4 py-3 text-left text-[13px] shadow-2xl"
            >
              Need help choosing a set? <span className="text-accent">Chat with us →</span>
            </motion.button>
          )}
        </AnimatePresence>

        <a
          href={whatsappLink("Assalam o Alaikum! I'd like to know more about Ghanam Rang.")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat on WhatsApp ${WHATSAPP_DISPLAY}`}
          className="grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-black shadow-[0_10px_30px_rgba(37,211,102,0.35)] transition hover:scale-105"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>

        <button
          onClick={() => {
            setNudge(false);
            setOpen((o) => !o);
          }}
          aria-label={open ? "Close chat" : "Open chat assistant"}
          aria-expanded={open}
          className="grid h-14 w-14 place-items-center rounded-full bg-accent text-ink shadow-[0_10px_30px_rgba(201,176,138,0.35)] transition hover:scale-105"
        >
          {open ? <span className="text-xl leading-none">✕</span> : <ChatIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Ghanam Rang chat assistant"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-x-2 bottom-2 z-[190] flex h-[min(620px,82svh)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[380px]"
          >
            <header className="flex items-center gap-3 border-b border-line bg-ink/60 px-4 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/15 font-serif text-[15px] text-accent">GR</span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">Ghanam Rang</p>
                <p className="flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Assistant · replies instantly
                </p>
              </div>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted hover:text-paper">
                <InstagramIcon className="h-[18px] w-[18px]" />
              </a>
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted hover:text-paper">
                <FacebookIcon className="h-[18px] w-[18px]" />
              </a>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="ml-1 text-muted hover:text-paper sm:hidden">
                ✕
              </button>
            </header>

            <div ref={listRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {msgs.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.from === "user" ? "rounded-br-sm bg-accent text-ink" : "rounded-bl-sm bg-card-2 text-paper/90"
                    }`}
                  >
                    {m.text}
                    {m.links && (
                      <span className="mt-2.5 flex flex-col gap-1.5">
                        {m.links.map((l) => (
                          <ChatLinkButton key={l.href + l.label} link={l} />
                        ))}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex gap-1 px-1 py-2" aria-label="Assistant is typing">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-muted"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {chips.length > 0 && (
              <div className="flex max-h-[132px] flex-wrap gap-1.5 overflow-y-auto border-t border-line px-3 py-2.5">
                {chips.map((c) => (
                  <button
                    key={c}
                    onClick={() => answer(c)}
                    className="rounded-full border border-line px-3 py-1.5 text-[12px] text-paper/85 transition hover:border-accent hover:text-accent"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                answer(input);
              }}
              className="flex items-center gap-2 border-t border-line p-2.5"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                inputMode={step === "phone" ? "tel" : "text"}
                autoComplete={step === "name" ? "name" : step === "phone" ? "tel" : step === "city" ? "address-level2" : "off"}
                aria-label="Message"
                maxLength={500}
                className="min-w-0 flex-1 rounded-full border border-line bg-ink px-4 py-2.5 text-[13px] outline-none placeholder:text-muted/70 focus:border-paper/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                aria-label="Send"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-ink transition hover:bg-accent disabled:opacity-40"
              >
                ↑
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChatLinkButton({ link }: { link: ChatLink }) {
  const external = link.kind !== "page";
  const style =
    link.kind === "whatsapp"
      ? "bg-[#25D366] text-black"
      : link.kind === "instagram"
        ? "bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white"
        : link.kind === "facebook"
          ? "bg-[#1877F2] text-white"
          : "border border-line text-paper hover:border-accent";
  const icon =
    link.kind === "whatsapp" ? <WhatsAppIcon className="h-4 w-4" /> : link.kind === "instagram" ? <InstagramIcon className="h-4 w-4" /> : link.kind === "facebook" ? <FacebookIcon className="h-4 w-4" /> : null;
  const cls = `flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition hover:brightness-110 ${style}`;
  // pages on this site use client navigation, so the chat stays open with its history
  if (!external) {
    return (
      <Link href={link.href} className={cls}>
        <span className="truncate">{link.label}</span>
      </Link>
    );
  }
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {icon}
      <span className="truncate">{link.label}</span>
    </a>
  );
}
