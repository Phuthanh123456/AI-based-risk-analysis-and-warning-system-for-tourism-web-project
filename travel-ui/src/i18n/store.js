const KEY = "vtra_language";
let language = "vi";
try { if (globalThis.localStorage?.getItem(KEY) === "en") language = "en"; } catch { /* Storage may be disabled. */ }
const listeners = new Set();
export const getLanguage = () => language;
export const getLocale = () => language === "en" ? "en-GB" : "vi-VN";
export const subscribeLanguage = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export function syncDocumentLanguage() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  if (globalThis.navigator?.serviceWorker) navigator.serviceWorker.getRegistration("/").then(registration => {
    registration?.active?.postMessage({ type: "VTRA_LANGUAGE", language });
  }).catch(() => {});
  document.querySelector('meta[name="description"]')?.setAttribute("content", language === "en"
    ? "Explore Vietnam and prepare for your journey with weather, route and local risk information."
    : "Khám phá Việt Nam và chủ động trên mọi hành trình với thông tin thời tiết, tuyến đường và rủi ro địa phương.");
}
export function setLanguage(value) {
  if (!["vi", "en"].includes(value)) return;
  language = value;
  try { globalThis.localStorage?.setItem(KEY, value); } catch { /* Keep the choice for this session. */ }
  syncDocumentLanguage();
  listeners.forEach(listener => listener());
}
if (typeof window !== "undefined") window.addEventListener("storage", event => {
  if (event.key === KEY && ["vi", "en"].includes(event.newValue)) setLanguage(event.newValue);
});
