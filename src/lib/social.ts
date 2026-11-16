/** Ghanam Rang's social accounts and WhatsApp, used by the footer, the floating button and the chat assistant. */

export const WHATSAPP_NUMBER = "923229120086"; // international format, no +
export const WHATSAPP_DISPLAY = "+92 322 9120086";
export const INSTAGRAM_URL = "https://www.instagram.com/ghanam_rang0";
export const INSTAGRAM_HANDLE = "@ghanam_rang0";
export const FACEBOOK_URL = "https://www.facebook.com/share/1CGWCv5bKq/";

/** wa.me link, optionally with a pre-written message. */
export const whatsappLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
