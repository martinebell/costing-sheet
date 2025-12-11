// src/engine/heaterDesign.ts

// --- Types --------------------------------------------------------

export type HeaterDesignInputs = {
  duty_kW?: number;
  installed_kW?: number;

  heaterType?: string;                     // "Immersion" | "Circulation" | etc.
  supplyConfig?: "Delta" | "Star" | string;
  frequencyHz?: number;                    // 50 or 60 typically

  numHeaters?: number;
  elementsPerHeater?: number;
  numStages?: number;

  operatingVoltage?: number;               // e.g. 400V

  // Thermal / T-class related
  bulkOperatingTemp_C?: number;            // process / bulk fluid operating temp
  tClassLimit_C?: number;                  // max allowed surface temp from T-class
  sheathTempOverride_C?: number;           // optional direct sheath temp if already known
};

export type HeaterDesignWarningLevel = "info" | "warning" | "error";

export type HeaterDesignWarning = {
  code?: string;
  level?: HeaterDesignWarningLevel;
  message: string;
};

export type HeaterDesign = {
  // Echoed inputs (normalised)
  duty_kW: number;
  installed_kW: number;
  heaterType: string;
  supplyConfig: string;
  frequencyHz: number;
  numHeaters: number;
  elementsPerHeater: number;
  numStages: number;
  operatingVoltage: number;

  // Derived values
  totalElements: number;
  elementsPerStage: number;
  loadPerStage_kW: number;
  loadPerElement_kW: number;

  // Thermal / T-class
  bulkOperatingTemp_C: number;
  tClassLimit_C: number | null;
  sheathTemp_C: number | null;

  // Future hooks for Sheet B logic:
  // inactiveLength_mm?: number;
  // pressureDrop_bar?: number;
};

export type HeaterDesignResult = {
  design: HeaterDesign;
  warnings: HeaterDesignWarning[];
};

// --- Engine -------------------------------------------------------

export function runHeaterDesign(
  designInputs: HeaterDesignInputs
): HeaterDesignResult {
  const warnings: HeaterDesignWarning[] = [];

  // Destructure with simple defaults
  const {
    duty_kW,
    installed_kW,
    heaterType,
    supplyConfig,
    frequencyHz,
    numHeaters,
    elementsPerHeater,
    numStages,
    operatingVoltage,
    bulkOperatingTemp_C,
    tClassLimit_C,
    sheathTempOverride_C,
  } = {
    // fallbacks – so the engine doesn’t explode if a UI field is empty
    duty_kW: 0,
    installed_kW: undefined,
    heaterType: "Immersion",
    supplyConfig: "Delta",
    frequencyHz: 50,
    numHeaters: 1,
    elementsPerHeater: 0,
    numStages: 1,
    operatingVoltage: 400,
    bulkOperatingTemp_C: 0,
    tClassLimit_C: undefined,
    sheathTempOverride_C: undefined,
    ...designInputs,
  };

  // 1. Normalise basic loads
  const effectiveInstalled_kW =
    typeof installed_kW === "number" && installed_kW > 0
      ? installed_kW
      : duty_kW;

  if (effectiveInstalled_kW <= 0) {
    warnings.push({
      code: "NO_LOAD",
      level: "error",
      message: "Installed load / duty is zero or missing.",
    });
  }

  // 2. Element + stage arithmetic (top of Sheet B logic)
  const totalElements = Math.max(
    0,
    (numHeaters || 0) * (elementsPerHeater || 0)
  );

  const elementsPerStage =
    numStages && numStages > 0 ? totalElements / numStages : 0;

  const loadPerStage_kW =
    numStages && numStages > 0 ? effectiveInstalled_kW / numStages : 0;

  const loadPerElement_kW =
    totalElements && totalElements > 0
      ? effectiveInstalled_kW / totalElements
      : 0;

  // 3. Core checks that mirror Sheet B behaviour

  // 3.1 Under-sized vs duty
  if (duty_kW > 0 && effectiveInstalled_kW < duty_kW) {
    warnings.push({
      code: "UNDER_SIZED",
      level: "warning",
      message: `Installed load (${effectiveInstalled_kW.toFixed(
        2
      )} kW) is below duty (${duty_kW.toFixed(2)} kW).`,
    });
  }

  // 3.2 Suspiciously over-sized
  if (duty_kW > 0 && effectiveInstalled_kW > duty_kW * 1.3) {
    warnings.push({
      code: "OVER_SIZED",
      level: "info",
      message: `Installed load (${effectiveInstalled_kW.toFixed(
        2
      )} kW) is more than 30% above duty (${duty_kW.toFixed(
        2
      )} kW). Check if this is intentional.`,
    });
  }

  // 3.3 Element/stage divisibility (classic Sheet B “elements per stage OK?”)
  if (numStages > 0 && totalElements > 0) {
    if (totalElements % numStages !== 0) {
      warnings.push({
        code: "ELEMENT_STAGE_IMBALANCE",
        level: "warning",
        message: `Total elements (${totalElements}) are not evenly divisible by stages (${numStages}). This will give unbalanced stages.`,
      });
    }
  } else if (numStages <= 0) {
    warnings.push({
      code: "NO_STAGES",
      level: "error",
      message: "Number of stages must be at least 1.",
    });
  }

  // 3.4 Basic config sanity
  if (frequencyHz !== 50 && frequencyHz !== 60) {
    warnings.push({
      code: "FREQUENCY_ODD",
      level: "info",
      message: `Frequency ${frequencyHz} Hz is non-standard (not 50/60 Hz).`,
    });
  }

  if (elementsPerHeater <= 0) {
    warnings.push({
      code: "NO_ELEMENTS",
      level: "error",
      message: "Elements per heater is zero or not set.",
    });
  }

  if (!heaterType) {
    warnings.push({
      code: "HEATER_TYPE_MISSING",
      level: "error",
      message: "Heater type is not selected.",
    });
  }

  if (supplyConfig !== "Delta" && supplyConfig !== "Star") {
    warnings.push({
      code: "SUPPLY_CONFIG_UNKNOWN",
      level: "warning",
      message: `Supply configuration "${supplyConfig}" is not recognised (expected Delta or Star).`,
    });
  }

  if (!operatingVoltage || operatingVoltage <= 0) {
    warnings.push({
      code: "NO_VOLTAGE",
      level: "warning",
      message: "Operating voltage is missing or zero.",
    });
  }

  // 3.5 Thermal / T-class checks (simplified Sheet B behaviour)

  // Simple sheath temperature model:
  // - if user gave an explicit override, use that
  // - otherwise, assume sheath is bulk + 60°C as a placeholder
  const sheathTemp_C =
    typeof sheathTempOverride_C === "number"
      ? sheathTempOverride_C
      : bulkOperatingTemp_C > 0
      ? bulkOperatingTemp_C + 60
      : null;

  if (tClassLimit_C != null) {
    if (bulkOperatingTemp_C > tClassLimit_C) {
      warnings.push({
        code: "BULK_TEMP_EXCEEDS_TCLASS",
        level: "warning",
        message: `Bulk operating temperature (${bulkOperatingTemp_C.toFixed(
          1
        )} °C) exceeds T-class limit (${tClassLimit_C.toFixed(1)} °C).`,
      });
    }

    if (sheathTemp_C != null && sheathTemp_C > tClassLimit_C) {
      warnings.push({
        code: "SHEATH_TEMP_EXCEEDS_TCLASS",
        level: "error",
        message: `Estimated sheath temperature (${sheathTemp_C.toFixed(
          1
        )} °C) exceeds T-class limit (${tClassLimit_C.toFixed(1)} °C).`,
      });
    }
  }

  // 4. Package the design object
  const design: HeaterDesign = {
    duty_kW,
    installed_kW: effectiveInstalled_kW,
    heaterType,
    supplyConfig,
    frequencyHz,
    numHeaters,
    elementsPerHeater,
    numStages,
    operatingVoltage,
    totalElements,
    elementsPerStage,
    loadPerStage_kW,
    loadPerElement_kW,
    bulkOperatingTemp_C,
    tClassLimit_C: tClassLimit_C ?? null,
    sheathTemp_C,
  };

  return { design, warnings };
}
