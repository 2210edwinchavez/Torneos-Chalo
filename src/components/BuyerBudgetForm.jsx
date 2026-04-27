import { useState } from "react";

export default function BuyerBudgetForm() {
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

  // Simulate API search
  const searchBudget = () => {
    const data = [
      { group: "Retail", budget: 20000 },
      { group: "Online", budget: 35000 },
      { group: "Partners", budget: 15000 },
    ];

    setBudgets(data);
  };

  // Update individual budget
  const handleBudgetChange = (index, value) => {
    const updatedBudgets = budgets.map((item, i) =>
      i === index ? { ...item, budget: value } : item,
    );

    setBudgets(updatedBudgets);
  };

  // Save budgets
  const saveBudgets = () => {
    console.log("Filters:", filters);
    console.log("Budgets:", budgets);

    alert("Budgets saved successfully");
  };

  // Reset search
  const nextSearch = () => {
    setBudgets([]);

    setFilters({
      seller_region_id: "",
      year: "",
      month: "",
      subscription_type_id: "",
    });
  };

  return (
    <div>
      <h2>Buyer Budget Management</h2>

      {/* Filters */}
      <div className="filters">
        <select
          name="seller_region_id"
          value={filters.seller_region_id}
          onChange={handleChange}
        >
          <option value="">Region</option>
          <option value="North">North</option>
          <option value="South">South</option>
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
          <option value="Basic">Basic</option>
          <option value="Premium">Premium</option>
        </select>

        <button className="search-btn" onClick={searchBudget}>
          Search
        </button>
      </div>

      {/* Budget Table */}
      <table className="budget-table">
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
        <div className="buttons">
          <button className="save-btn" onClick={saveBudgets}>
            Save
          </button>

          <button className="next-btn" onClick={nextSearch}>
            Next Search
          </button>
        </div>
      )}
    </div>
  );
}
