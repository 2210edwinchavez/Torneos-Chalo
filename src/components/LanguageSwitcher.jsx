import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useContext(LanguageContext);

  return (
    <div className="language-switcher">
      <button
        className={language === "en" ? "active" : ""}
        onClick={() => setLanguage("en")}
      >
        🇺🇸
      </button>

      <button
        className={language === "es" ? "active" : ""}
        onClick={() => setLanguage("es")}
      >
        🇪🇸
      </button>
    </div>
  );
}
