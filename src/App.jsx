// src/App.jsx
import { useState } from "react";
import HeaterDesignCalculator from "./components/HeaterDesignCalculator";
import WireCalculator from "./components/WireCalculator";
import CostingSummary from "./components/CostingSummary";

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
  elementCoreType: "Core", // <-- important for labour engine
  certType: "Exd",
  certRegion: "ATEX",
  certHeaterKWLimit: 2000,
  hasCSAIncompatible3mmSensors: false,

  weldType: "WELDED WITH STANDPIPE", // p60
  rowsPerBank: 3,                    // k24
  isISES: true,                      // p162
  paintSystemA: "Painted",           // p143
  paintSystemB: "Painted",           // p149
  paintTopcoat: "Painted",           // p146
  testingHoursOverride: 18,          // testingOverrideHours
  otherHoursOverride: 5,             // otherOverrideHours
};

function App() {
  const [designInputs, setDesignInputs] = useState(initialDesignInputs);

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

      <CostingSummary designInputs={designInputs} />
    </div>
  );
}

export default App;
