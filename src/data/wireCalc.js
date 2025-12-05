// src/data/wireCalc.js

// --- Cable data -------------------------------------------------------
// These values are *illustrative approximations* – you can later replace
// them with EXHEAT-approved tables.
//
// Resistance is Ω/km at 20°C. Current rating is a rough continuous rating
// for PVC-insulated copper in free air.

const copperTable = [
  { sizeLabel: "1.5 mm²", areaMm2: 1.5,  resistanceOhmPerKm: 12.1, currentRatingA: 16 },
  { sizeLabel: "2.5 mm²", areaMm2: 2.5,  resistanceOhmPerKm: 7.41, currentRatingA: 21 },
  { sizeLabel: "4.0 mm²", areaMm2: 4.0,  resistanceOhmPerKm: 4.61, currentRatingA: 28 },
  { sizeLabel: "6.0 mm²", areaMm2: 6.0,  resistanceOhmPerKm: 3.08, currentRatingA: 36 },
  { sizeLabel: "10 mm²", areaMm2: 10.0, resistanceOhmPerKm: 1.83, currentRatingA: 50 },
  { sizeLabel: "16 mm²", areaMm2: 16.0, resistanceOhmPerKm: 1.15, currentRatingA: 68 },
  { sizeLabel: "25 mm²", areaMm2: 25.0, resistanceOhmPerKm: 0.727, currentRatingA: 89 },
  { sizeLabel: "35 mm²", areaMm2: 35.0, resistanceOhmPerKm: 0.524, currentRatingA: 109 },
];

const aluminiumTable = [
  // Rough values – swap for your own if you actually use aluminium.
  { sizeLabel: "10 mm²", areaMm2: 10.0, resistanceOhmPerKm: 3.08, currentRatingA: 40 },
  { sizeLabel: "16 mm²", areaMm2: 16.0, resistanceOhmPerKm: 1.91, currentRatingA: 55 },
  { sizeLabel: "25 mm²", areaMm2: 25.0, resistanceOhmPerKm: 1.20, currentRatingA: 75 },
  { sizeLabel: "35 mm²", areaMm2: 35.0, resistanceOhmPerKm: 0.868, currentRatingA: 95 },
  { sizeLabel: "50 mm²", areaMm2: 50.0, resistanceOhmPerKm: 0.641, currentRatingA: 115 },
];

function getTable(material) {
  return material === "aluminium" ? aluminiumTable : copperTable;
}

/**
 * Wire sizing engine (basic current + voltage-drop check).
 *
 * Args:
 *  currentA       Load current (A)
 *  lengthM        One-way length (m)
 *  supplyV        Supply voltage (V)
 *  maxVoltDropPct Allowed drop (%)
 *  material       "copper" | "aluminium"
 *  threePhase     true for 3φ, false for 1φ
 */
export function calculateWireSize({
  currentA,
  lengthM,
  supplyV,
  maxVoltDropPct,
  material = "copper",
  threePhase = false,
}) {
  if (!currentA || !lengthM || !supplyV || !maxVoltDropPct) {
    return {
      ok: false,
      message: "Enter current, length, voltage and max voltage drop.",
      recommended: null,
      options: [],
    };
  }

  const table = getTable(material.toLowerCase());

  const results = table.map((item) => {
    const rPerM = item.resistanceOhmPerKm / 1000; // Ω/m

    // 1φ: there and back (2×L). 3φ: ≈ √3 × L (line-to-line, simplified).
    const effectiveLength = threePhase ? Math.sqrt(3) * lengthM : 2 * lengthM;
    const rTotal = rPerM * effectiveLength;

    const vDrop = currentA * rTotal;
    const vDropPct = (vDrop / supplyV) * 100;

    const withinCurrent = currentA <= item.currentRatingA;
    const withinDrop = vDropPct <= maxVoltDropPct;

    return {
      ...item,
      rPerM,
      rTotal,
      vDrop,
      vDropPct,
      withinCurrent,
      withinDrop,
      compliant: withinCurrent && withinDrop,
    };
  });

  const compliantOptions = results.filter((r) => r.compliant);
  let recommended;
  let message;

  if (compliantOptions.length > 0) {
    recommended = compliantOptions.sort((a, b) => a.areaMm2 - b.areaMm2)[0];
    message = "Smallest cable that meets current and voltage drop limits.";
  } else {
    recommended = results[results.length - 1];
    message =
      "No size in the table meets both limits. Largest size shown – review design.";
  }

  return {
    ok: true,
    message,
    recommended,
    options: results,
  };
}
