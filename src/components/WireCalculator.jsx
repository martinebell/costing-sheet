// src/components/WireCalculator.jsx
import { useState } from "react";
import { calculateWireSize } from "../data/wireCalc";

export default function WireCalculator() {
  const [currentA, setCurrentA] = useState("");
  const [lengthM, setLengthM] = useState("");
  const [supplyV, setSupplyV] = useState("230");
  const [maxDropPct, setMaxDropPct] = useState("5");
  const [material, setMaterial] = useState("copper");
  const [threePhase, setThreePhase] = useState(false);
  const [result, setResult] = useState(null);

  const onCalculate = () => {
    const data = calculateWireSize({
      currentA: Number(currentA),
      lengthM: Number(lengthM),
      supplyV: Number(supplyV),
      maxVoltDropPct: Number(maxDropPct),
      material,
      threePhase,
    });
    setResult(data);
  };

  const onClear = () => {
    setCurrentA("");
    setLengthM("");
    setSupplyV("230");
    setMaxDropPct("5");
    setMaterial("copper");
    setThreePhase(false);
    setResult(null);
  };

  return (
    <div style={{ marginTop: "1.5rem", maxWidth: 700 }}>
      <h2>Wire Size Calculator</h2>

      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          marginTop: "0.75rem",
        }}
      >
        <label>
          Load current (A)
          <input
            type="number"
            value={currentA}
            onChange={(e) => setCurrentA(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          One-way cable length (m)
          <input
            type="number"
            value={lengthM}
            onChange={(e) => setLengthM(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Supply voltage (V)
          <input
            type="number"
            value={supplyV}
            onChange={(e) => setSupplyV(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Max voltage drop (%)
          <input
            type="number"
            value={maxDropPct}
            onChange={(e) => setMaxDropPct(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Conductor material
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="copper">Copper</option>
            <option value="aluminium">Aluminium</option>
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={threePhase}
            onChange={(e) => setThreePhase(e.target.checked)}
          />
          3-phase circuit
        </label>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button onClick={onCalculate}>Calculate</button>
          <button type="button" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      {result && (
        <div style={{ marginTop: "1.5rem" }}>
          {!result.ok && (
            <p style={{ color: "red" }}>{result.message}</p>
          )}

          {result.ok && result.recommended && (
            <>
              <h3>Recommended cable</h3>
              <p>
                <strong>{result.recommended.sizeLabel}</strong>{" "}
                ({material === "copper" ? "Copper" : "Aluminium"}) – rating{" "}
                {result.recommended.currentRatingA} A, voltage drop{" "}
                {result.recommended.vDropPct.toFixed(2)} %.
              </p>
              <p style={{ fontSize: "0.9rem", color: "#555" }}>
                {result.message}
              </p>
            </>
          )}

          {result.ok && result.options?.length > 0 && (
            <>
              <h4 style={{ marginTop: "1rem" }}>Detail by cable size</h4>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.85rem",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                        Size
                      </th>
                      <th style={{ borderBottom: "1px solid #ccc", textAlign: "right" }}>
                        Rating (A)
                      </th>
                      <th style={{ borderBottom: "1px solid #ccc", textAlign: "right" }}>
                        V drop (V)
                      </th>
                      <th style={{ borderBottom: "1px solid #ccc", textAlign: "right" }}>
                        V drop (%)
                      </th>
                      <th style={{ borderBottom: "1px solid #ccc", textAlign: "center" }}>
                        OK?
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.options.map((opt) => (
                      <tr key={opt.sizeLabel}>
                        <td style={{ padding: "0.25rem 0" }}>{opt.sizeLabel}</td>
                        <td style={{ padding: "0.25rem 0", textAlign: "right" }}>
                          {opt.currentRatingA}
                        </td>
                        <td style={{ padding: "0.25rem 0", textAlign: "right" }}>
                          {opt.vDrop.toFixed(2)}
                        </td>
                        <td style={{ padding: "0.25rem 0", textAlign: "right" }}>
                          {opt.vDropPct.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "0.25rem 0",
                            textAlign: "center",
                            fontWeight: opt.compliant ? "bold" : "normal",
                            color: opt.compliant ? "green" : "#999",
                          }}
                        >
                          {opt.compliant ? "✔" : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
