// src/components/MaterialsAdminPanel.jsx

export default function MaterialsAdminPanel({ materialsConfig, onChange }) {
  const handleNumberChange = (field) => (e) => {
    const value = e.target.value;
    onChange({
      ...materialsConfig,
      [field]: value === "" ? "" : Number(value),
    });
  };

  const handleElementUnitCostChange = handleNumberChange("elementUnitCost");
  const handleMiscFixedCostChange = handleNumberChange("miscFixedCost");

  // Simple handlers for first vessel band & first TB only (good enough for now)
  const handleVesselBandChange = (index, field) => (e) => {
    const value = e.target.value;
    const bands = materialsConfig.vesselBands.map((b, i) =>
      i === index
        ? {
            ...b,
            [field]:
              field === "maxKW" || field === "cost"
                ? value === "" ? "" : Number(value)
                : value,
          }
        : b
    );
    onChange({ ...materialsConfig, vesselBands: bands });
  };

  const handleTerminalBoxChange = (index, field) => (e) => {
    const value = e.target.value;
    const boxes = materialsConfig.terminalBoxes.map((tb, i) =>
      i === index
        ? {
            ...tb,
            [field]:
              field === "cost" ||
              field === "maxElements" ||
              field === "maxCurrentA"
                ? value === "" ? "" : Number(value)
                : value,
          }
        : tb
    );
    onChange({ ...materialsConfig, terminalBoxes: boxes });
  };

  const firstBand = materialsConfig.vesselBands[0];
  const firstTB = materialsConfig.terminalBoxes[0];

  return (
    <div style={{ maxWidth: 800 }}>
      <h2>Materials Config (Admin)</h2>
      <p style={{ fontSize: "0.9rem", color: "#555" }}>
        These are placeholder numbers. Later we’ll paste in the real EXHEAT
        element, vessel and terminal box pricing.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem 1.5rem",
        }}
      >
        <label>
          Element unit cost (£/element)
          <input
            type="number"
            value={materialsConfig.elementUnitCost}
            onChange={handleElementUnitCostChange}
          />
        </label>

        <label>
          Misc materials cost (£)
          <input
            type="number"
            value={materialsConfig.miscFixedCost}
            onChange={handleMiscFixedCostChange}
          />
        </label>

        {firstBand && (
          <>
            <label>
              1st vessel band max kW
              <input
                type="number"
                value={firstBand.maxKW}
                onChange={handleVesselBandChange(0, "maxKW")}
              />
            </label>
            <label>
              1st vessel band cost (£)
              <input
                type="number"
                value={firstBand.cost}
                onChange={handleVesselBandChange(0, "cost")}
              />
            </label>
          </>
        )}

        {firstTB && (
          <>
            <label>
              1st terminal box name
              <input
                type="text"
                value={firstTB.name}
                onChange={handleTerminalBoxChange(0, "name")}
              />
            </label>
            <label>
              1st terminal box cost (£)
              <input
                type="number"
                value={firstTB.cost}
                onChange={handleTerminalBoxChange(0, "cost")}
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
