import { useState, useContext } from "react";
import BuyerBudgetForm from "../components/BuyerBudgetForm";
import SellerBudgetForm from "../components/SellerBudgetForm";
import LanguageSwitcher from "../components/LanguageSwitcher";

import { LanguageContext, translations } from "../context/LanguageContext";

export default function FinanceDashboard() {
  const [activeForm, setActiveForm] = useState("buyer");

  const { language } = useContext(LanguageContext);

  const t = translations?.[language] || translations["en"];

  const stats = {
    total: 120000,
    buyer: 70000,
    seller: 50000,
  };

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <div className="topbar">
        <h1>{t.dashboard}</h1>
        <LanguageSwitcher />
      </div>

      {/* Stats Cards */}
      <div className="cards">
        <div className="card">
          <h3>{t.totalBudget}</h3>
          <p>${stats.total.toLocaleString()}</p>
        </div>

        <div className="card">
          <h3>{t.buyerBudget}</h3>
          <p>${stats.buyer.toLocaleString()}</p>
        </div>

        <div className="card">
          <h3>{t.sellerBudget}</h3>
          <p>${stats.seller.toLocaleString()}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="menu">
        <button
          className={activeForm === "buyer" ? "active" : ""}
          onClick={() => setActiveForm("buyer")}
        >
          {t.buyerBudget}
        </button>

        <button
          className={activeForm === "seller" ? "active" : ""}
          onClick={() => setActiveForm("seller")}
        >
          {t.sellerBudget}
        </button>
      </div>

      {/* Forms */}
      <div className="form-container">
        {activeForm === "buyer" && <BuyerBudgetForm />}
        {activeForm === "seller" && <SellerBudgetForm />}
      </div>
    </div>
  );
}
