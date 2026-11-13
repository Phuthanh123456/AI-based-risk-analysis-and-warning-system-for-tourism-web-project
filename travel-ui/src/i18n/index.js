import { useCallback, useSyncExternalStore } from "react";
import { getLanguage, subscribeLanguage } from "./store.js";
import { translateText } from "./translate.js";

export { getLanguage, getLocale, setLanguage, syncDocumentLanguage } from "./store.js";
export { translateText, translateAddress } from "./translate.js";
export function useLanguage() { return useSyncExternalStore(subscribeLanguage, getLanguage, () => "vi"); }
export function useTranslate() {
  const language = useLanguage();
  return useCallback(value => translateText(value, language), [language]);
}
