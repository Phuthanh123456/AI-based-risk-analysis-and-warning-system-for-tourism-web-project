import { useLanguage, setLanguage } from "../i18n/index.js";
import "./LanguageSwitch.css";

export default function LanguageSwitch() {
  const language = useLanguage();
  return <div className="language-switch" role="group" aria-label={language === "en" ? "Website language" : "Ngôn ngữ trang web"}>
    <button type="button" lang="vi" aria-label="Tiếng Việt" aria-pressed={language === "vi"} onClick={() => setLanguage("vi")}>VI</button>
    <button type="button" lang="en" aria-label="English" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
  </div>;
}
