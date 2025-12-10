// src/App.jsx
import { useState } from "react";
import HeaterDesignCalculator from "./components/HeaterDesignCalculator";
import WireCalculator from "./components/WireCalculator";
import CostingSummary from "./components/CostingSummary";
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

  quantity: 1, // number of identical heaters in the project
};

// central materials config in state
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

  const handleDesignChange = (updated) => {
    setDesignInputs(updated);
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "system-ui" }}>
      <h1>EXHEAT Costing Sheet</h1>

      <HeaterDesignCalculator
        designInputs={designInputs}
        onDesignChange={handleDesignChange}
      />

      <hr style={{ margin: "2rem 0" }} />

      <WireCalculator />

      <hr style={{ margin: "2rem 0" }} />

      <MaterialsAdminPanel
        materialsConfig={materialsConfig}
        onChange={setMaterialsConfig}
      />

      <hr style={{ margin: "2rem 0" }} />

           <CostingSummary
        designInputs={designInputs}
        materialsConfig={materialsConfig}
      />

      <QuoteSummary
        designInputs={designInputs}
        materialsConfig={materialsConfig}
      />
    </div>
  );

}

export default App;
