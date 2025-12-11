// src/App.jsx
import { useState } from "react";
import HeaterDesignCalculator from "./components/HeaterDesignCalculator";
import WireCalculator from "./components/WireCalculator";
import CostingSummary from "./components/calculators/CostingSummary";
import MaterialsAdminPanel from "./components/MaterialsAdminPanel";
import QuoteSummary from "./components/QuoteSummary";

const initialDesignInputs = {
  massFlowKgPerHr: 15065.6,
  cp_kJ_per_kgK: 1.7188,
  t1C: 40,
  t2C: 370,
  heaterRatingKW: 1470,

  elementsPerHeater: 150,
  numStages: 10,

  supplyVoltageV: 400,
  supplyConfig: "STAR",
  parallelFactor: 2,
  maxPinCurrentA: 80,
  terminalBoxMaxElements: 150,
  terminalBoxMaxCurrentA: 100,
  terminalBoxName: "TBX-123",

  tClassMaxOpTempC: 200,
  processFluidName: "Gas",
  elementCoreType: "Core",
  certType: "Exd",
  certRegion: "ATEX",
  certHeaterKWLimit: 2000,
  hasCSAIncompatible3mmSensors: false,

  weldType: "WELDED WITH STANDPIPE",
  rowsPerBank: 3,
  isISES: true,
  paintSystemA: "Painted",
  paintSystemB: "Painted",
  paintTopcoat: "Painted",
  testingHoursOverride: 18,
  otherHoursOverride: 5,

  quantity: 1,

   //T-class fields used by runHeaterDesign
  bulkOperatingTemp_C: 370,      // use outlet temp as starting point
  tClassLimit_C: 200,            // mirror tClassMaxOpTempC for now
  sheathTempOverride_C: undefined, // or null – let engine estimate for now

  // NEW: basic placeholder for required inactive length (mm)
  // Later this will come from vessel / standpipe / TB geometry.
  requiredInactiveLengthMM: 520,

};

const initialMaterialsConfig = {
  elementUnitCost: 250,

  vesselBands: [
    { maxKW: 250, cost: 8000 },
    { maxKW: 750, cost: 10000 },
    { maxKW: 1500, cost: 12000 },
    { maxKW: Infinity, cost: 15000 },
  ],

  terminalBoxes: [
    { name: "TBX-123", cost: 3000, maxElements: 150, maxCurrentA: 100 },
    { name: "TBX-200", cost: 4000, maxElements: 200, maxCurrentA: 160 },
  ],

  miscFixedCost: 2000,
};

function App() {
  const [designInputs, setDesignInputs] = useState(initialDesignInputs);
  const [materialsConfig, setMaterialsConfig] = useState(initialMaterialsConfig);

  // NEW TABS: inputs | wire | materials | costing | summary
  const [view, setView] = useState("inputs");

  const handleDesignChange = (updated) => {
    setDesignInputs(updated);
  };

  const tabButtonStyle = (tab) => ({
    padding: "0.5rem 1rem",
    borderRadius: "999px",
    border: "1px solid #ccc",
    backgroundColor: view === tab ? "#333" : "#f5f5f5",
    color: view === tab ? "#fff" : "#333",
    cursor: "pointer",
    fontSize: "0.9rem",
  });

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui", maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: "0.25rem" }}>EXHEAT Costing Sheet</h1>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#555" }}>
          Prototype design, labour, materials and quotation engine
        </p>
      </header>

      {/* Tabs */}
      <nav
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: "0.75rem",
        }}
      >
        <button style={tabButtonStyle("inputs")} onClick={() => setView("inputs")}>
          Inputs
        </button>

        <button style={tabButtonStyle("wire")} onClick={() => setView("wire")}>
          Wire Calc
        </button>

        <button style={tabButtonStyle("materials")} onClick={() => setView("materials")}>
          Material Config
        </button>

        <button style={tabButtonStyle("costing")} onClick={() => setView("costing")}>
          Costing
        </button>

        <button style={tabButtonStyle("summary")} onClick={() => setView("summary")}>
          Summary
        </button>
      </nav>

      {/* Views */}

      {view === "inputs" && (
        <>
          <HeaterDesignCalculator
            designInputs={designInputs}
            onDesignChange={handleDesignChange}
          />
        </>
      )}

      {view === "wire" && (
        <>
          <WireCalculator />
        </>
      )}

      {view === "materials" && (
        <>
          <MaterialsAdminPanel
            materialsConfig={materialsConfig}
            onChange={setMaterialsConfig}
          />
        </>
      )}

      {view === "costing" && (
        <>
          <CostingSummary
            designInputs={designInputs}
            materialsConfig={materialsConfig}
          />
        </>
      )}

      {view === "summary" && (
        <>
          <QuoteSummary
            designInputs={designInputs}
            materialsConfig={materialsConfig}
          />
        </>
      )}
    </div>
  );
}

export default App;
