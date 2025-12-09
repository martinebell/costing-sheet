// src/engine/costing.ts
import type { HeaterDesignOutputs } from "./heaterDesign";

export interface LabourCategoryHours {
  // Mirrors Labour Calc category totals:
  // Machining  -> 'Labour Calc'!K14 (L14)
  // Element    -> 'Labour Calc'!K15 (L15)
  // Welding    -> 'Labour Calc'!K16 (L16)
  // Final Assy -> 'Labour Calc'!K20 (L20)
  // Paint      -> 'Labour Calc'!K25 (L25)
  // Wiring     -> 'Labour Calc'!K30 (L30)
  // Testing    -> 'Labour Calc'!K31 (L31)
  // Other      -> 'Labour Calc'!K35 (L35)
  machiningHours: number;
  elementHours: number;
  weldingHours: number;
  finalAssemblyHours: number;
  paintHours: number;
  wiringHours: number;
  testingHours: number;
  otherHours: number;
}

export interface CostingInputs {
  // Technical design (from Sheet B engine)
  design: HeaterDesignOutputs;

  // Elements & materials
  elementsPerHeater: number;  // B!E14
  elementUnitCost: number;    // £ per element (from El Order Sheet / vendor)
  vesselCost: number;         // £ vessel / mech
  terminalBoxCost: number;    // £ TB + glands etc.
  miscMaterialCost: number;   // £ sundries, labels, packing, etc.

  // Labour
  labour: LabourCategoryHours;
  labourRatePerHour: number;  // N!N105 (labour rate, e.g. 16.5)

  // Commercial knobs
  overheadFactor: number;     // overhead multiplier on labour (e.g. 1.25)
  marginPercent: number;      // sales margin % on total cost (e.g. 20)
}

export interface CostingOutputs {
  // Labour breakdown
  categoryHours: LabourCategoryHours;
  totalLabourHours: number;
  labourCost: number;
  labourCostWithOverhead: number;

  // Materials
  elementCost: number;
  materialCost: number;

  // Totals
  manufacturingCost: number; // materials + labour + overhead
  sellPrice: number;         // with margin
}

/**
 * Costing engine, structured to mirror Labour Calc and costing sheets.
 * At this stage we assume the category hours are already calculated
 * (equivalent to 'Labour Calc'!K14, K15, K16, K20, K25, K30, K31, K35).
 *
 * A future "labour engine" will reproduce the N!M80–M101 formulas and
 * populate these hours automatically from design inputs.
 */
export function runCosting(inputs: CostingInputs): CostingOutputs {
  const {
    design, // currently unused but reserved for future coupling
    elementsPerHeater,
    elementUnitCost,
    vesselCost,
    terminalBoxCost,
    miscMaterialCost,
    labour,
    labourRatePerHour,
    overheadFactor,
    marginPercent,
  } = inputs;

  // --- Labour totals --------------------------------------------
  const {
    machiningHours,
    elementHours,
    weldingHours,
    finalAssemblyHours,
    paintHours,
    wiringHours,
    testingHours,
    otherHours,
  } = labour;

  const totalLabourHours =
    machiningHours +
    elementHours +
    weldingHours +
    finalAssemblyHours +
    paintHours +
    wiringHours +
    testingHours +
    otherHours;

  const labourCost = totalLabourHours * labourRatePerHour;
  const labourCostWithOverhead = labourCost * overheadFactor;

  // --- Materials -------------------------------------------------
  const elementCost = elementsPerHeater * elementUnitCost;

  const materialCost =
    elementCost + vesselCost + terminalBoxCost + miscMaterialCost;

  // --- Totals ----------------------------------------------------
  const manufacturingCost = materialCost + labourCostWithOverhead;
  const sellPrice =
    manufacturingCost * (1 + marginPercent / 100);

  return {
    categoryHours: labour,
    totalLabourHours,
    labourCost,
    labourCostWithOverhead,
    elementCost,
    materialCost,
    manufacturingCost,
    sellPrice,
  };
}
