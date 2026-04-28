import { createContext, useContext, useState } from 'react';

export const CURRENCIES = {
  COP: { code: 'COP', symbol: '$', label: 'Peso colombiano', locale: 'es-CO', decimals: 0, flag: '🇨🇴' },
  USD: { code: 'USD', symbol: 'US$', label: 'Dólar americano', locale: 'en-US', decimals: 2, flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro', locale: 'es-ES', decimals: 2, flag: '🇪🇺' },
};

const STORAGE_KEY = 'torneosjcsport_currency';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return CURRENCIES[saved] ? saved : 'COP';
  });

  function setCurrency(code) {
    localStorage.setItem(STORAGE_KEY, code);
    setCurrencyState(code);
  }

  const current = CURRENCIES[currency];

  function formatMoney(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat(current.locale, {
      style: 'currency',
      currency: current.code,
      minimumFractionDigits: current.decimals,
      maximumFractionDigits: current.decimals,
    }).format(num);
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, current, formatMoney, CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be inside CurrencyProvider');
  return ctx;
}
