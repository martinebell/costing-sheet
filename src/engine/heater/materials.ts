// src/engine/materials.ts

// Very first pass materials engine.
// It replaces the hard-coded element/vessel/TB/misc numbers in CostingSummary
// with something structured and configurable.

export interface MaterialsConfig {
  elementUnitCost: number; // £ per element

  vesselBands: {
    maxKW: number;  // applies up to this heater duty
    cost: number;   // £
  }[];

  terminalBoxes: {
    name: string;
    cost: number;       // £
    maxElements: number;
    maxCurrentA: number;
  }[];

  miscFixedCost: number; // £ misc materials (gaskets, bolts, tags, etc.)
}

export interface MaterialsDesignInputs {
  elementsPerHeater: number;
  terminalBoxName: string;
}

export interface MaterialsEngineInputs {
  design: any; // we only care about design.dutyKW and maybe others later
  designInputs: MaterialsDesignInputs;
  config: MaterialsConfig;
}

export interface MaterialsEngineResult {
  elementCount: number;
  elementUnitCost: number;
  elementCost: number;

  vesselCost: number;
  terminalBoxCost: number;
  miscMaterialCost: number;

  totalMaterialCost: number;
}

/**
 * Simple materials engine:
 * - elements: count × unit cost
 * - vessel: banded by duty kW
 * - terminal box: lookup by name
 * - misc: fixed for now
 */
export function runMaterialsEngine(
  input: MaterialsEngineInputs
): MaterialsEngineResult {
  const { design, designInputs, config } = input;

  const dutyKW =
    typeof design?.dutyKW === "number" && !isNaN(design.dutyKW)
      ? design.dutyKW
      : 0;

  const elementCount = designInputs.elementsPerHeater ?? 0;
  const elementUnitCost = config.elementUnitCost;

  const elementCost = elementCount * elementUnitCost;

  // Vessel cost from bands
  let vesselCost =
    config.vesselBands[config.vesselBands.length - 1]?.cost ?? 0;

  for (const band of config.vesselBands) {
    if (dutyKW <= band.maxKW) {
      vesselCost = band.cost;
      break;
    }
  }

  // Terminal box cost by name (fallback to first if not matched)
  const tbName = (designInputs.terminalBoxName || "").trim();
  const tbMatch = config.terminalBoxes.find(
    (tb) => tb.name === tbName
  );
  const terminalBoxCost =
    tbMatch?.cost ?? config.terminalBoxes[0]?.cost ?? 0;

  const miscMaterialCost = config.miscFixedCost;

  const totalMaterialCost =
    elementCost + vesselCost + terminalBoxCost + miscMaterialCost;

  return {
    elementCount,
    elementUnitCost,
    elementCost,
    vesselCost,
    terminalBoxCost,
    miscMaterialCost,
    totalMaterialCost,
  };
}
