import { useState } from "react";

export default function BudgetTable({ initialData = [] }) {
  const [data, setData] = useState(initialData);

  const updateBudget = (index, value) => {
    const updatedData = data.map((item, i) =>
      i === index ? { ...item, budget: value } : item,
    );

    setData(updatedData);
  };

  return (
    <div className="card">
      <h3>Budget Table</h3>

      {data.length === 0 ? (
        <p>No budget data available</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th>Budget</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td>{row.group}</td>

                <td>
                  <input
                    type="number"
                    value={row.budget}
                    onChange={(e) => updateBudget(i, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
