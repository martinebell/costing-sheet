// src/components/HeaterDesignCalculator.jsx
import { useState } from "react";
import { runHeaterDesign } from "../engine/heaterDesign";

export default function HeaterDesignCalculator() {
  const [inputs, setInputs] = useState({
    // --- process / thermal ---
    massFlowKgPerHr: 15065.6,
    cp_kJ_per_kgK: 1.7188,
    t1C: 40,
    t2C: 370,

    // --- electrical / rating ---
    heaterRatingKW: 1470,
    elementsPerHeater: 150,
    numStages: 10,

    // --- supply / connection ---
    supplyVoltageV: 400,
    supplyConfig: "STAR", // "STAR" | "DELTA" | "SINGLE_PHASE" | "OTHER"
    parallelFactor: 2,

    // --- catalogue limits (just demo values for now) ---
    maxPinCurrentA: 80,
    terminalBoxMaxElements: 150,
    terminalBoxMaxCurrentA: 100,
    terminalBoxName: "TBX-123",

    // --- T-class / certification ---
    tClassMaxOpTempC: 200,
    processFluidName: "Gas",
    elementCoreType: "Core",
    certType: "Exd",
    certRegion: "ATEX",
    certHeaterKWLimit: 2000,
    hasCSAIncompatible3mmSensors: false,
  });

  const design = runHeaterDesign(inputs);

  const handleNumberChange = (field) => (e) => {
    const raw = e.target.value;
    setInputs((prev) => ({
      ...prev,
      [field]: raw === "" ? null : Number(raw),
    }));
  };

  const handleSelectChange = (field) => (e) => {
    setInputs((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <div style={{ marginTop: "1.5rem", maxWidth: 800 }}>
      <h2>Heater Design Calculator (Sheet B Engine)</h2>

      {/* --- Inputs --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          marginTop: "0.75rem",
        }}
      >
        <label>
          Mass flow (kg/hr)
          <input
            type="number"
            value={inputs.massFlowKgPerHr ?? ""}
            onChange={handleNumberChange("massFlowKgPerHr")}
          />
        </label>

        <label>
          Cp (kJ/kg·°C)
          <input
            type="number"
            value={inputs.cp_kJ_per_kgK ?? ""}
            onChange={handleNumberChange("cp_kJ_per_kgK")}
          />
        </label>

        <label>
          T1 (°C)
          <input
            type="number"
            value={inputs.t1C ?? ""}
            onChange={handleNumberChange("t1C")}
          />
        </label>

        <label>
          T2 (°C)
          <input
            type="number"
            value={inputs.t2C ?? ""}
            onChange={handleNumberChange("t2C")}
          />
        </label>

        <label>
          Heater rating (kW)
          <input
            type="number"
            value={inputs.heaterRatingKW ?? ""}
            onChange={handleNumberChange("heaterRatingKW")}
          />
        </label>

        <label>
          Elements / heater
          <input
            type="number"
            value={inputs.elementsPerHeater ?? ""}
            onChange={handleNumberChange("elementsPerHeater")}
          />
        </label>

        <label>
          Number of stages
          <input
            type="number"
            value={inputs.numStages ?? ""}
            onChange={handleNumberChange("numStages")}
          />
        </label>

        <label>
          Supply voltage (V)
          <input
            type="number"
            value={inputs.supplyVoltageV ?? ""}
            onChange={handleNumberChange("supplyVoltageV")}
          />
        </label>

        <label>
          Supply config
          <select
            value={inputs.supplyConfig}
            onChange={handleSelectChange("supplyConfig")}
          >
            <option value="STAR">STAR</option>
            <option value="DELTA">DELTA</option>
            <option value="SINGLE_PHASE">SINGLE_PHASE</option>
            <option value="OTHER">OTHER</option>
          </select>
        </label>
      </div>

      {/* --- Outputs --- */}
      <div style={{ marginTop: "1.5rem" }}>
        <h3>Results</h3>
        <p>{design.n1Label}</p>
        <p>{design.n2Label}</p>

        <p>
          <strong>Calculated duty:</strong>{" "}
          {design.dutyKW !== null ? design.dutyKW.toFixed(2) + " kW" : "—"}
        </p>

        <p>
          <strong>Load / element:</strong>{" "}
          {design.loadPerElementKW !== null
            ? design.loadPerElementKW.toFixed(3) + " kW"
            : "—"}
        </p>

        <p>
          <strong>Pin current:</strong>{" "}
          {design.pinCurrentA !== null
            ? design.pinCurrentA.toFixed(2) + " A"
            : "—"}{" "}
          ({design.pinCurrentMessage})
        </p>

        <p>
          <strong>Element count:</strong> {design.elementCountMessage}
        </p>

        <p>
          <strong>Terminal box:</strong> {design.terminalBoxStatus}
        </p>

        <p>
          <strong>T-Class:</strong> {design.tClassStatus}
        </p>

        <p>
          <strong>Certification:</strong> {design.certStatus}
        </p>

        {design.warnings.length > 0 && (
          <div style={{ marginTop: "0.75rem" }}>
            <strong>Warnings:</strong>
            <ul>
              {design.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
