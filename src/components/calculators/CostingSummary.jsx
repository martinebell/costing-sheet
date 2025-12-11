// src/components/CostingSummary.jsx
import { runCosting } from "../../engine/costing";
import { runHeaterDesign } from "../../engine/heater/heaterDesign";
import { runLabourEngine } from "../../engine/heater/labour";
import { runMaterialsEngine } from "../../engine/heater/materials";
import { runElementSelection } from "../../engine/heater/elementSelection";

export default function CostingSummary({ designInputs, materialsConfig }) {
  const quantity = designInputs.quantity ?? 1;

  // 1) Map UI designInputs -> engine HeaterDesignInputs shape
  const heaterDesignInputsForEngine = {
    // Power/loads
    duty_kW: designInputs.heaterRatingKW ?? 0,
    installed_kW: designInputs.heaterRatingKW ?? 0, // for now same as duty

    // Basic heater config
    heaterType: "Immersion", // placeholder until you add a field
    supplyConfig:
      designInputs.supplyConfig === "STAR"
        ? "Star"
        : designInputs.supplyConfig === "DELTA"
        ? "Delta"
        : designInputs.supplyConfig,
    frequencyHz: 50, // assume 50 Hz for now

    numHeaters: 1,
    elementsPerHeater: designInputs.elementsPerHeater ?? 0,
    numStages: designInputs.numStages ?? 1,

    operatingVoltage: designInputs.supplyVoltageV ?? 400,

    // Thermal / T-class mapping
    bulkOperatingTemp_C:
      designInputs.bulkOperatingTemp_C ??
      designInputs.t2C ??
      0,
    tClassLimit_C:
      designInputs.tClassLimit_C ??
      designInputs.tClassMaxOpTempC ??
      undefined,
    sheathTempOverride_C: designInputs.sheathTempOverride_C,
  };

  // Run the design engine
  const designResult = runHeaterDesign(heaterDesignInputsForEngine);
  const rawDesign = designResult && designResult.design ? designResult.design : null;
  const designWarnings = (designResult && designResult.warnings) || [];

  // Normalise naming so old code expecting dutyKW / loadPerElementKW still works
  const design = rawDesign
    ? {
        ...rawDesign,
        dutyKW:
          rawDesign.dutyKW !== undefined
            ? rawDesign.dutyKW
            : rawDesign.duty_kW,
        loadPerElementKW:
          rawDesign.loadPerElementKW !== undefined
            ? rawDesign.loadPerElementKW
            : rawDesign.loadPerElement_kW,
      }
    : null;

  const dutyKW =
    design && typeof design.dutyKW === "number" ? design.dutyKW : null;

  const installedKW =
    design && typeof design.installed_kW === "number"
      ? design.installed_kW
      : dutyKW !== null &&
        designInputs.elementsPerHeater &&
        design &&
        typeof design.loadPerElementKW === "number"
      ? design.loadPerElementKW * designInputs.elementsPerHeater
      : null;

  const bulkTemp =
    design && typeof design.bulkOperatingTemp_C === "number"
      ? design.bulkOperatingTemp_C
      : null;

  const sheathTemp =
    design && typeof design.sheathTemp_C === "number"
      ? design.sheathTemp_C
      : null;

  const tClassLimit =
    design && typeof design.tClassLimit_C === "number"
      ? design.tClassLimit_C
      : null;

 // 1b) Element selection engine
  const elementSelection = design
    ? runElementSelection({
        design,
        // Map UI fields into element selection inputs
        requiredInactiveLength_mm: designInputs.requiredInactiveLengthMM,
        processFluidName: designInputs.processFluidName,
      })
    : { element: null, targetElement_kW: 0, options: [], warnings: [] };


  const element = elementSelection.element;
  const elementWarnings = elementSelection.warnings || [];

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
        {dutyKW !== null && installedKW !== null
          ? `${dutyKW.toFixed(1)} kW duty vs ${installedKW.toFixed(
              1
            )} kW installed`
          : "—"}
      </p>

      {bulkTemp !== null && tClassLimit !== null && (
        <p>
          <strong>Process / T-class:</strong>{" "}
          {bulkTemp.toFixed(1)} °C bulk vs{" "}
          {tClassLimit.toFixed(1)} °C limit
        </p>
      )}

      {sheathTemp !== null && (
        <p>
          <strong>Estimated sheath temp:</strong>{" "}
          {sheathTemp.toFixed(1)} °C
        </p>
      )}

            {element && (
        <p>
          <strong>Selected element:</strong>{" "}
          {element.description} (rated {element.rated_kW.toFixed(1)} kW at{" "}
          {element.nominalVoltage_V} V) – target{" "}
          {elementSelection.targetElement_kW.toFixed(2)} kW/element, approx{" "}
          {element.wattDensityAtTargetLoad_kW_per_m2.toFixed(1)} kW/m²
          { element.inactiveLength_mm.toFixed(0)} mm
        </p>
      )}


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
          <strong>Selling price (per heater):</strong> £
          {costing.sellPrice.toFixed(0)}
        </li>
      </ul>

      <h3>Project totals</h3>
      <ul>
        <li>
          <strong>Quantity:</strong> {quantity} heater
          {quantity === 1 ? "" : "s"}
        </li>
        <li>
          Project manufacturing cost: £
          {(costing.manufacturingCost * quantity).toFixed(0)}
        </li>
        <li>
          Project selling price (with margin): £
          {(costing.sellPrice * quantity).toFixed(0)}
        </li>
      </ul>

      {(designWarnings.length > 0 || elementWarnings.length > 0) && (
        <div style={{ marginTop: "1rem" }}>
          <strong>Design warnings affecting costing:</strong>
          <ul>
            {designWarnings.map((w, i) => (
              <li key={`d-${i}`}>
                {w.code ? `[${w.code}] ` : ""}
                {w.message ?? String(w)}
              </li>
            ))}
            {elementWarnings.map((w, i) => (
              <li key={`e-${i}`}>
                {w.code ? `[${w.code}] ` : ""}
                {w.message ?? String(w)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
