import { useState } from "react";

export default function SellerBudgetForm() {
  const [filters, setFilters] = useState({
    seller_region_id: "",
    year: "",
    month: "",
    subscription_type_id: "",
  });

  const [budgets, setBudgets] = useState([]);

  // Handle filter changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Simulated API search
  const searchBudget = () => {
    const data = [
      { group: "Enterprise", budget: 50000 },
      { group: "SMB", budget: 30000 },
      { group: "Startup", budget: 15000 },
    ];

    setBudgets(data);
  };

  // Update budget value
  const handleBudgetChange = (index, value) => {
    const updatedBudgets = budgets.map((item, i) =>
      i === index ? { ...item, budget: value } : item,
    );

    setBudgets(updatedBudgets);
  };

  // Save budgets
  const saveBudgets = () => {
    console.log("Filters:", filters);
    console.log("Seller Budgets:", budgets);

    alert("Budgets saved successfully");
  };

  // Reset form
  const nextSearch = () => {
    setFilters({
      seller_region_id: "",
      year: "",
      month: "",
      subscription_type_id: "",
    });

    setBudgets([]);
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Seller Budget</h2>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <select
          name="seller_region_id"
          value={filters.seller_region_id}
          onChange={handleChange}
        >
          <option value="">Region</option>
          <option value="1">North</option>
          <option value="2">South</option>
        </select>

        <select name="year" value={filters.year} onChange={handleChange}>
          <option value="">Year</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>

        <select name="month" value={filters.month} onChange={handleChange}>
          <option value="">Month</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>

        <select
          name="subscription_type_id"
          value={filters.subscription_type_id}
          onChange={handleChange}
        >
          <option value="">Subscription</option>
          <option value="1">Basic</option>
          <option value="2">Premium</option>
        </select>

        <button onClick={searchBudget}>Search</button>
      </div>

      {/* Table */}
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Group</th>
            <th>Budget</th>
          </tr>
        </thead>

        <tbody>
          {budgets.length === 0 ? (
            <tr>
              <td colSpan="2">No budgets loaded</td>
            </tr>
          ) : (
            budgets.map((item, index) => (
              <tr key={index}>
                <td>{item.group}</td>

                <td>
                  <input
                    type="number"
                    value={item.budget}
                    onChange={(e) => handleBudgetChange(index, e.target.value)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Buttons */}
      {budgets.length > 0 && (
        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button onClick={saveBudgets}>Save Budgets</button>

          <button onClick={nextSearch}>Next Search</button>
        </div>
      )}
    </div>
  );
}
