// src/components/QuoteSummary.jsx
import { runHeaterDesign } from "../engine/heaterDesign";
import { runLabourEngine } from "../engine/labour";
import { runMaterialsEngine } from "../engine/materials";
import { runCosting } from "../engine/costing";

export default function QuoteSummary({ designInputs, materialsConfig }) {
  const quantity = designInputs.quantity ?? 1;

  // Design
  const design = runHeaterDesign(designInputs);

  // Labour inputs (same as CostingSummary)
  const labourInputs = {
    p5: designInputs.elementCoreType,
    p208: designInputs.elementsPerHeater,
    p209: 0,
    k24: designInputs.rowsPerBank,
    e12: designInputs.numStages,
    e14: designInputs.elementsPerHeater,

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

    // Testing & Other
    testingOverrideHours: designInputs.testingHoursOverride,
    otherOverrideHours: designInputs.otherHoursOverride,
  };

  const labourEngineResult = runLabourEngine(labourInputs);

  // Materials
  const materials = runMaterialsEngine({
    design,
    designInputs: {
      elementsPerHeater: designInputs.elementsPerHeater,
      terminalBoxName: designInputs.terminalBoxName,
    },
    config: materialsConfig,
  });

  // Costing
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

  const projectManufacturingCost = costing.manufacturingCost * quantity;
  const projectSellPrice = costing.sellPrice * quantity;

  return (
    <div
      style={{
        marginTop: "2rem",
        maxWidth: 900,
        padding: "1.5rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Quotation Summary</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr",
          gap: "1.5rem",
        }}
      >
        {/* Left: Technical summary */}
        <div>
          <h3>Technical Summary</h3>
          <ul>
            <li>
              Duty:{" "}
              {design.dutyKW !== null
                ? `${design.dutyKW.toFixed(1)} kW`
                : "—"}
            </li>
            <li>
              Process: {designInputs.processFluidName} from{" "}
              {designInputs.t1C}°C to {designInputs.t2C}°C
            </li>
            <li>
              Elements: {designInputs.elementsPerHeater} ×{" "}
              {designInputs.elementCoreType}
            </li>
            <li>
              Supply: {designInputs.supplyVoltageV} V{" "}
              {designInputs.supplyConfig}
            </li>
            <li>Stages: {designInputs.numStages}</li>
            <li>
              Terminal box: {designInputs.terminalBoxName} (
              {materials.terminalBoxCost.toFixed(0)} £ est.)
            </li>
          </ul>

          {design.warnings.length > 0 && (
            <>
              <h4>Design Notes / Warnings</h4>
              <ul>
                {design.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Right: Commercial summary */}
        <div>
          <h3>Commercial Summary</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "1rem",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                  Item
                </th>
                <th
                  style={{
                    textAlign: "right",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Unit (£)
                </th>
                <th
                  style={{
                    textAlign: "right",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Total (£)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Heater package</td>
                <td style={{ textAlign: "right" }}>
                  {costing.sellPrice.toFixed(0)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {projectSellPrice.toFixed(0)}
                </td>
              </tr>
            </tbody>
          </table>

          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            <li>
              <strong>Quantity:</strong> {quantity} heater
              {quantity === 1 ? "" : "s"}
            </li>
            <li>
              Manufacturing cost (project): £
              {projectManufacturingCost.toFixed(0)}
            </li>
            <li>
              Selling price (project): £{projectSellPrice.toFixed(0)}
            </li>
          </ul>

          <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "1rem" }}>
            Prices are indicative only and subject to final specification,
            detailed review of project documentation, and EXHEAT standard terms
            and conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
