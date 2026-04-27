import { useState } from "react";

export default function Filters({ onFilter }) {
  const [filters, setFilters] = useState({
    region: "",
    year: "",
    month: "",
    subscription: "",
  });

  const updateFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilter = () => {
    if (onFilter) {
      onFilter(filters);
    }
  };

  const clearFilters = () => {
    const emptyFilters = {
      region: "",
      year: "",
      month: "",
      subscription: "",
    };

    setFilters(emptyFilters);

    if (onFilter) {
      onFilter(emptyFilters);
    }
  };

  return (
    <div className="card filters">
      <h3>Filters</h3>

      <div className="filter-grid">
        <select
          value={filters.region}
          onChange={(e) => updateFilter("region", e.target.value)}
        >
          <option value="">Seller Region</option>
          <option value="1">North America</option>
          <option value="2">Europe</option>
          <option value="3">Latin America</option>
        </select>

        <select
          value={filters.year}
          onChange={(e) => updateFilter("year", e.target.value)}
        >
          <option value="">Year</option>
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>

        <select
          value={filters.month}
          onChange={(e) => updateFilter("month", e.target.value)}
        >
          <option value="">Month</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
        </select>

        <select
          value={filters.subscription}
          onChange={(e) => updateFilter("subscription", e.target.value)}
        >
          <option value="">Subscription Type</option>
          <option value="1">Basic</option>
          <option value="2">Pro</option>
          <option value="3">Enterprise</option>
        </select>
      </div>

      <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
        <button onClick={applyFilter}>Apply Filters</button>
        <button onClick={clearFilters}>Clear</button>
      </div>
    </div>
  );
}
