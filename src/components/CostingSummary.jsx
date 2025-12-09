// src/components/CostingSummary.jsx
import { useMemo } from "react";
import { runCosting } from "../engine/costing";
import { runHeaterDesign } from "../engine/heaterDesign";
import { runLabourEngine } from "../engine/labour";


export default function CostingSummary() {
  // For now, mock the design inputs to something sensible.
  // Later we’ll pass in the real state from HeaterDesignCalculator.
  const designInputs = {
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
  };

  const design = runHeaterDesign(designInputs);
const labourInputs = {
  p118: 1,
  p5: "Hairpin",
  p60: "WELDED WITH STANDPIPE",
  p208: 150,
  p209: 0,
  p173: 0.2,
  p174: 0.01,
  p225: 1000,
  p176: 4,
  p177: 0.5,
  k21: 10,
  k24: 3,
  e12: 10,
  e14: 150,
  p162: "ISES",
  p178: 2,
  p179: 0.05,
  k50: 1,
  k51: 1,
  k62: 1,
  k39: 1,

  // paint...
  p143: "Painted",
  p149: "Painted",
  p146: "Painted",
  u9: 1,
  paintPrepOverrideHours: null,
  paintTouchupOverrideHours: null,
  paintTopcoatOverrideHours: null,
  paintTopcoatFlagOverride: null,

  // --- wiring demo values ---
  p180: 2,     // base wiring hours
  p181: 0.05,  // per element (first 50) for hairpin
  p182: 0.03,  // per element (over 50) for hairpin
  p183: 0.04,  // per element for non-hairpin

    // testing & other (for now, straight through)
  testingOverrideHours: 18,
  otherOverrideHours: 5,

};

const labourEngineResult = runLabourEngine(labourInputs);


const costing = useMemo(
  () =>
    runCosting({
      design,
      elementsPerHeater: 150,
      elementUnitCost: 250,      // £ per element (placeholder)
      vesselCost: 12000,         // placeholder
      terminalBoxCost: 3000,     // placeholder
      miscMaterialCost: 2000,    // placeholder
      labour: {
        // These map to Labour Calc K14, K15, K16, K20, K25, K30, K31, K35
        machiningHours: labourEngineResult.machiningHours,
        elementHours: labourEngineResult.elementHours,
        weldingHours: labourEngineResult.weldingHours,
        finalAssemblyHours: labourEngineResult.finalAssemblyHours,
        paintHours: labourEngineResult.paintHours,
        wiringHours: labourEngineResult.wiringHours,
        testingHours: labourEngineResult.testingHours,
        otherHours: labourEngineResult.otherHours,
      },

      labourRatePerHour: 45, // could eventually come from N!N105
      overheadFactor: 1.25,
      marginPercent: 20,
    }),
  [
    design,
    labourEngineResult.weldingHours,
    labourEngineResult.machiningHours,
    labourEngineResult.elementHours,
    labourEngineResult.finalAssemblyHours,
    labourEngineResult.paintHours,
    labourEngineResult.wiringHours,
    labourEngineResult.testingHours,
    labourEngineResult.otherHours,
]
);


  return (
    <div style={{ marginTop: "2rem", maxWidth: 700 }}>
      <h2>Costing Summary (Prototype)</h2>

      <p>
        <strong>Heater rating:</strong>{" "}
        {design.dutyKW !== null
          ? `${design.dutyKW.toFixed(1)} kW duty vs ${design.loadPerElementKW !== null ? (design.loadPerElementKW * 150).toFixed(1) : "?"} kW installed`
          : "—"}
      </p>

      <h3>Materials</h3>
      <ul>
        <li>Elements: £{costing.elementCost.toFixed(0)}</li>
        <li>Vessel + mech: £{(costing.materialCost - costing.elementCost).toFixed(0)}</li>
        <li>
          <strong>Total materials:</strong> £
          {costing.materialCost.toFixed(0)}
        </li>
      </ul>

      <h3>Labour</h3>
      <ul>
        <li>Total labour hours: {costing.totalLabourHours.toFixed(1)} h</li>
        <li>Labour cost (at rate): £{costing.labourCost.toFixed(0)}</li>
        <li>
          Labour + overhead: £
          {costing.labourCostWithOverhead.toFixed(0)}
        </li>
      </ul>

      <h3>Labour breakdown (hours)</h3>
<ul>
  <li>Machining: {costing.categoryHours.machiningHours}</li>
  <li>Element: {costing.categoryHours.elementHours}</li>
  <li>Welding: {costing.categoryHours.weldingHours}</li>
  <li>Final assembly: {costing.categoryHours.finalAssemblyHours}</li>
  <li>Paint: {costing.categoryHours.paintHours}</li>
  <li>Wiring: {costing.categoryHours.wiringHours}</li>
  <li>Testing: {costing.categoryHours.testingHours}</li>
  <li>Other: {costing.categoryHours.otherHours}</li>
  <li>
    <strong>Total:</strong> {costing.totalLabourHours.toFixed(1)} h
  </li>
</ul>

      <h3>Totals</h3>
      <ul>
        <li>
          <strong>Manufacturing cost:</strong> £
          {costing.manufacturingCost.toFixed(0)}
        </li>
        <li>
          <strong>Selling price (with margin):</strong> £
          {costing.sellPrice.toFixed(0)}
        </li>
      </ul>

      {design.warnings.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <strong>Design warnings affecting costing:</strong>
          <ul>
            {design.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
