// src/components/CostingSummary.jsx
import { runCosting } from "../engine/costing";
import { runHeaterDesign } from "../engine/heaterDesign";
import { runLabourEngine } from "../engine/labour";
import { runMaterialsEngine } from "../engine/materials";

export default function CostingSummary({ designInputs, materialsConfig }) {
  // 1) Design engine from shared state
  const design = runHeaterDesign(designInputs);

  // 2) Labour engine inputs – driven from designInputs
  const labourInputs = {
    // Design-related fields
    p5: designInputs.elementCoreType,
    p208: designInputs.elementsPerHeater,
    p209: 0,
    k24: designInputs.rowsPerBank,
    e12: designInputs.numStages,
    e14: designInputs.elementsPerHeater,

    // Other flags (still placeholder for now)
    p118: 1,
    p60: designInputs.weldType,

    p173: 0.2,
    p174: 0.01,
    p225: 1000,
    p176: 4,
    p177: 0.5,
    k21: 10,

    p162: designInputs.isISES ? "ISES" : "",
    p178: 2,
    p179: 0.05,
    k50: 1,
    k51: 1,
    k62: 1,
    k39: 1,

    // Paint
    p143: designInputs.paintSystemA,
    p149: designInputs.paintSystemB,
    p146: designInputs.paintTopcoat,
    u9: 1,
    paintPrepOverrideHours: null,
    paintTouchupOverrideHours: null,
    paintTopcoatOverrideHours: null,
    paintTopcoatFlagOverride: null,

    // Wiring
    p180: 2,
    p181: 0.05,
    p182: 0.03,
    p183: 0.04,

    // Testing & Other – now driven from UI
    testingOverrideHours: designInputs.testingHoursOverride,
    otherOverrideHours: designInputs.otherHoursOverride,
  };

  const labourEngineResult = runLabourEngine(labourInputs);

  // 3) Materials engine – element/vessel/TB/misc
  const materials = runMaterialsEngine({
    design,
    designInputs: {
      elementsPerHeater: designInputs.elementsPerHeater,
      terminalBoxName: designInputs.terminalBoxName,
    },
    config: materialsConfig,
  });

  // 4) Costing engine – uses design + labour + materials
  const costing = runCosting({
    design,
    elementsPerHeater: materials.elementCount,
    elementUnitCost: materials.elementUnitCost,
    vesselCost: materials.vesselCost,
    terminalBoxCost: materials.terminalBoxCost,
    miscMaterialCost: materials.miscMaterialCost,
    labour: {
      machiningHours: labourEngineResult.machiningHours,
      elementHours: labourEngineResult.elementHours,
      weldingHours: labourEngineResult.weldingHours,
      finalAssemblyHours: labourEngineResult.finalAssemblyHours,
      paintHours: labourEngineResult.paintHours,
      wiringHours: labourEngineResult.wiringHours,
      testingHours: labourEngineResult.testingHours,
      otherHours: labourEngineResult.otherHours,
    },
    labourRatePerHour: 45,
    overheadFactor: 1.25,
    marginPercent: 20,
  });

  return (
    <div style={{ marginTop: "2rem", maxWidth: 700 }}>
      <h2>Costing Summary (Prototype)</h2>

      <p>
        <strong>Heater rating:</strong>{" "}
        {design.dutyKW !== null
          ? `${design.dutyKW.toFixed(1)} kW duty vs ${
              design.loadPerElementKW !== null
                ? (
                    design.loadPerElementKW *
                    designInputs.elementsPerHeater
                  ).toFixed(1)
                : "?"
            } kW installed`
          : "—"}
      </p>

      <h3>Materials</h3>
      <ul>
        <li>Elements: £{costing.elementCost.toFixed(0)}</li>
        <li>
          Vessel + mech: £
          {(costing.materialCost - costing.elementCost).toFixed(0)}
        </li>
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
