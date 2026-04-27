import { createContext, useState, useEffect } from "react";

export const LanguageContext = createContext();

export const translations = {
  es: {
    dashboard: "Panel Financiero",
    buyerBudget: "Presupuesto Compradores",
    sellerBudget: "Presupuesto Vendedores",
    region: "Región",
    year: "Año",
    month: "Mes",
    subscription: "Suscripción",
    search: "Buscar",
    save: "Guardar",
    next: "Siguiente búsqueda",
    totalBudget: "Presupuesto Total",
  },

  en: {
    dashboard: "Finance Dashboard",
    buyerBudget: "Buyer Budget",
    sellerBudget: "Seller Budget",
    region: "Region",
    year: "Year",
    month: "Month",
    subscription: "Subscription",
    search: "Search",
    save: "Save",
    next: "Next Search",
    totalBudget: "Total Budget",
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en",
  );

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
