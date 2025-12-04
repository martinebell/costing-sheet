import { WireTableRow } from "../element/wireTable";

// Simple lookup: find the last row where diameterMm <= inputDiameter
export function lookupWire(
  inputDiameter: number,
  table: WireTableRow[]
): WireTableRow {
  if (table.length === 0) {
    throw new Error("Wire table is empty.");
  }

  // At this point table[0] is definitely not undefined
  let chosen: WireTableRow = table[0]!;

  for (const row of table) {
    if (row.diameterMm <= inputDiameter) {
      chosen = row;
    }
  }

  return chosen;
}
