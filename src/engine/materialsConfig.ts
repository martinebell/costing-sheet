// src/engine/materialsConfig.ts
import type { MaterialsConfig } from "./heater/materials";

// Central place for all materials pricing.
//Replace these placeholder numbers with EXHEAT values.

export const materialsConfig: MaterialsConfig = {
  // Element cost – £ per element (by default, regardless of type)
  elementUnitCost: 250, // TODO: set from your element price list

  // Vessel cost bands – based on heater duty (kW)
  // TODO: copy these from your vessel costing table.
  vesselBands: [
    { maxKW: 250, cost: 8000 },
    { maxKW: 750, cost: 10000 },
    { maxKW: 1500, cost: 12000 },
    { maxKW: Infinity, cost: 15000 },
  ],

  // Terminal boxes – price per TB model
  // TODO: add your real TB part numbers and prices here.
  terminalBoxes: [
    { name: "TBX-123", cost: 3000, maxElements: 150, maxCurrentA: 100 },
    { name: "TBX-200", cost: 4000, maxElements: 200, maxCurrentA: 160 },
  ],

  // Miscellaneous materials – gaskets, bolts, tags, paint, etc.
  // TODO: set this equal to the “misc materials” value from your costing sheet.
  miscFixedCost: 2000,
};
