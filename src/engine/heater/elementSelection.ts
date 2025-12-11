// src/engine/elementSelection.ts

import type { HeaterDesign } from "./heaterDesign";

// ---------------- Types ----------------

export type ElementCatalogueItem = {
  id: string;
  description: string;

  diameter_mm: number;              // sheath OD
  heatedLength_mm: number;          // active heated length
  inactiveLength_mm: number;        // cold length available

  rated_kW: number;                 // nameplate rating per element
  nominalVoltage_V: number;

  maxWattDensity_kW_per_m2: number; // design limit for this construction
  maxSheathTemp_C: number;          // construction limit
};

export type ElementSelectionWarningLevel = "info" | "warning" | "error";

export type ElementSelectionWarning = {
  code?: string;
  level?: ElementSelectionWarningLevel;
  message: string;
};

export type ElementSelectionOption = ElementCatalogueItem & {
  surfaceArea_m2: number;
  wattDensityAtTargetLoad_kW_per_m2: number;
};

export type ElementSelectionInputs = {
  design: HeaterDesign;

  /**
   * Required cold / inactive length (mm) from vessel / standpipe / TB geometry.
   * If omitted, we’ll skip the inactive-length check.
   */
  requiredInactiveLength_mm?: number;

  /**
   * Process fluid name, used to apply fluid-specific watt-density / sheath temp limits.
   * e.g. "Gas", "Light Oil", "Water".
   */
  processFluidName?: string;
};

export type ElementSelectionResult = {
  element: ElementSelectionOption | null;
  targetElement_kW: number;
  options: ElementSelectionOption[];
  warnings: ElementSelectionWarning[];
};

// Fluid limits (very simplified placeholders – replace with EXHEAT rules later)
type FluidLimits = {
  fluidKey: string;
  maxWattDensity_kW_per_m2?: number;
  maxSheathTemp_C?: number;
  note?: string;
};

// --------------- Catalogue ---------------
// NOTE: These are *illustrative* sample elements –
// replace with a JSON export of your real D-sheet table later.

const ELEMENT_CATALOGUE: ElementCatalogueItem[] = [
  {
    id: "ELM-3KW-11MM-3000",
    description: "3 kW, 11 mm, 3.0 m element",
    diameter_mm: 11,
    heatedLength_mm: 3000,
    inactiveLength_mm: 200,
    rated_kW: 3,
    nominalVoltage_V: 400,
    maxWattDensity_kW_per_m2: 6,
    maxSheathTemp_C: 400,
  },
  {
    id: "ELM-6KW-16MM-3000",
    description: "6 kW, 16 mm, 3.0 m element",
    diameter_mm: 16,
    heatedLength_mm: 3000,
    inactiveLength_mm: 250,
    rated_kW: 6,
    nominalVoltage_V: 400,
    maxWattDensity_kW_per_m2: 5,
    maxSheathTemp_C: 400,
  },
  {
    id: "ELM-9KW-16MM-3500",
    description: "9 kW, 16 mm, 3.5 m element",
    diameter_mm: 16,
    heatedLength_mm: 3500,
    inactiveLength_mm: 300,
    rated_kW: 9,
    nominalVoltage_V: 400,
    maxWattDensity_kW_per_m2: 4.5,
    maxSheathTemp_C: 400,
  },
];

// --------------- Helpers ---------------

function surfaceArea_m2(diameter_mm: number, heatedLength_mm: number): number {
  const d_m = diameter_mm / 1000;      // mm → m
  const L_m = heatedLength_mm / 1000;  // mm → m
  // Cylinder lateral area ≈ π * d * L
  return Math.PI * d_m * L_m;
}

function getFluidLimits(fluidName?: string): FluidLimits {
  const key = (fluidName || "").trim().toLowerCase();

  switch (key) {
    case "gas":
    case "natural gas":
      return {
        fluidKey: "gas",
        maxWattDensity_kW_per_m2: 2.5, // placeholder – tighten later
        maxSheathTemp_C: 400,
        note: "Generic gas limits – replace with EXHEAT gas rules.",
      };

    case "light oil":
    case "diesel":
      return {
        fluidKey: "light_oil",
        maxWattDensity_kW_per_m2: 10,
        maxSheathTemp_C: 400,
        note: "Generic light oil limits – replace with EXHEAT rules.",
      };

    case "heavy oil":
      return {
        fluidKey: "heavy_oil",
        maxWattDensity_kW_per_m2: 6,
        maxSheathTemp_C: 350,
        note: "Generic heavy oil limits – replace with EXHEAT rules.",
      };

    case "water":
      return {
        fluidKey: "water",
        maxWattDensity_kW_per_m2: 20,
        maxSheathTemp_C: 400,
        note: "Generic water limits – replace with EXHEAT rules.",
      };

    default:
      return {
        fluidKey: "generic",
        maxWattDensity_kW_per_m2: undefined,
        maxSheathTemp_C: undefined,
        note: "No specific fluid limits configured – using construction limits only.",
      };
  }
}

// --------------- Engine ---------------

export function runElementSelection(
  inputs: ElementSelectionInputs
): ElementSelectionResult {
  const { design, requiredInactiveLength_mm, processFluidName } = inputs;
  const warnings: ElementSelectionWarning[] = [];

  const { installed_kW, totalElements, operatingVoltage, sheathTemp_C } =
    design;

  const safeTotalElements = totalElements > 0 ? totalElements : 1;
  const targetElement_kW =
    installed_kW > 0 ? installed_kW / safeTotalElements : 0;

  if (installed_kW <= 0) {
    warnings.push({
      code: "NO_INSTALLED_LOAD",
      level: "error",
      message:
        "Installed load is zero or missing – cannot select an element from the catalogue.",
    });
  }

  if (totalElements <= 0) {
    warnings.push({
      code: "NO_ELEMENTS",
      level: "error",
      message:
        "Total elements is zero or missing – cannot distribute load across elements.",
    });
  }

  // Fluid-specific limits (watt density + sheath temp)
  const fluidLimits = getFluidLimits(processFluidName);

  // Filter catalogue by voltage compatibility (very simple for now)
  const candidates = ELEMENT_CATALOGUE.filter(
    (e) => !operatingVoltage || e.nominalVoltage_V === operatingVoltage
  );

  if (candidates.length === 0) {
    warnings.push({
      code: "NO_VOLTAGE_MATCH",
      level: "warning",
      message: `No catalogue elements found for operating voltage ${operatingVoltage} V.`,
    });
  }

  // Build option list with surface area + watt density at target load
  const options: ElementSelectionOption[] = candidates.map((item) => {
    const area_m2 = surfaceArea_m2(item.diameter_mm, item.heatedLength_mm);

    const wattDensityAtTarget =
      area_m2 > 0 ? targetElement_kW / area_m2 : Infinity;

    return {
      ...item,
      surfaceArea_m2: area_m2,
      wattDensityAtTargetLoad_kW_per_m2: wattDensityAtTarget,
    };
  });

  // Pick the element whose rated_kW is closest to targetElement_kW
  let best: ElementSelectionOption | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (const opt of options) {
    const diff = Math.abs(opt.rated_kW - targetElement_kW);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = opt;
    }
  }

  if (!best) {
    warnings.push({
      code: "NO_ELEMENT_SELECTED",
      level: "error",
      message:
        "No suitable element could be selected. Check the load, element count, and voltage.",
    });

    return {
      element: null,
      targetElement_kW,
      options,
      warnings,
    };
  }

  // --- Design checks based on selected element ---

  // 1) Watt density vs construction limit
  if (
    best.maxWattDensity_kW_per_m2 > 0 &&
    best.wattDensityAtTargetLoad_kW_per_m2 >
      best.maxWattDensity_kW_per_m2
  ) {
    warnings.push({
      code: "WATT_DENSITY_EXCEEDS_CONSTRUCTION_LIMIT",
      level: "error",
      message: `Estimated watt density (${best.wattDensityAtTargetLoad_kW_per_m2.toFixed(
        2
      )} kW/m²) exceeds element construction limit (${best.maxWattDensity_kW_per_m2.toFixed(
        2
      )} kW/m²).`,
    });
  }

  // 2) Watt density vs fluid-specific limit (if defined)
  if (
    fluidLimits.maxWattDensity_kW_per_m2 != null &&
    best.wattDensityAtTargetLoad_kW_per_m2 >
      fluidLimits.maxWattDensity_kW_per_m2
  ) {
    warnings.push({
      code: "WATT_DENSITY_HIGH_FOR_FLUID",
      level: "warning",
      message: `Estimated watt density (${best.wattDensityAtTargetLoad_kW_per_m2.toFixed(
        2
      )} kW/m²) is above the recommended limit (${fluidLimits.maxWattDensity_kW_per_m2.toFixed(
        2
      )} kW/m²) for fluid "${
        processFluidName || "unknown"
      }".`,
    });
  }

  // 3) Sheath temperature vs fluid-specific limit (if we have both values)
  if (
    fluidLimits.maxSheathTemp_C != null &&
    sheathTemp_C != null &&
    sheathTemp_C > fluidLimits.maxSheathTemp_C
  ) {
    warnings.push({
      code: "SHEATH_TEMP_HIGH_FOR_FLUID",
      level: "warning",
      message: `Estimated sheath temperature (${sheathTemp_C.toFixed(
        1
      )} °C) is above the recommended limit (${fluidLimits.maxSheathTemp_C.toFixed(
        1
      )} °C) for fluid "${processFluidName || "unknown"}".`,
    });
  }

  // 4) Inactive length too short
  if (
    typeof requiredInactiveLength_mm === "number" &&
    requiredInactiveLength_mm > 0 &&
    best.inactiveLength_mm < requiredInactiveLength_mm
  ) {
    warnings.push({
      code: "INACTIVE_LENGTH_TOO_SHORT",
      level: "warning",
      message: `Required inactive length ${requiredInactiveLength_mm.toFixed(
        0
      )} mm, selected element provides only ${best.inactiveLength_mm.toFixed(
        0
      )} mm.`,
    });
  }

  return {
    element: best,
    targetElement_kW,
    options,
    warnings,
  };
}
