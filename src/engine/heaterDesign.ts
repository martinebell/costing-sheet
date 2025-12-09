// src/engine/heaterDesign.ts

export type SupplyConfig = "SINGLE_PHASE" | "STAR" | "DELTA" | "OTHER";

export interface HeaterDesignInputs {
  // Process / thermal
  massFlowKgPerHr: number | null;   // E8
  cp_kJ_per_kgK: number | null;     // H8
  t1C: number | null;               // H4
  t2C: number | null;               // H5

  // Electrical / rating
  heaterRatingKW: number | null;    // E11
  elementsPerHeater: number | null; // E14
  numStages: number | null;         // E12

  // Supply / connection
  supplyVoltageV: number | null;    // P35
  supplyConfig: SupplyConfig;       // P30

  // Element arrangement (for element-count check)
  /**
   * Factor used in Excel: 3 * IF(P214="PAREL",1,2) * numStages
   * - Use 1 for "parallel" (PAREL)
   * - Use 2 for "normal" (default)
   */
  parallelFactor?: number; // defaults to 2

  // Catalogue limits
  maxPinCurrentA?: number | null;          // P7
  terminalBoxMaxElements?: number | null;  // INDEX(D!X681:X742,P152)
  terminalBoxMaxCurrentA?: number | null;  // P245
  terminalBoxName?: string | null;         // P167

  // T-class / hazard
  tClassMaxOpTempC?: number | null; // P247
  processFluidName?: string | null; // P17

  // Certification
  elementCoreType?: string | null;  // P5 ("Core", etc.)
  certType?: string | null;         // P126 ("Exe", "Exd", ...)
  certRegion?: string | null;       // P127 ("CSA", etc.)
  certHeaterKWLimit?: number | null; // P246
  hasCSAIncompatible3mmSensors?: boolean; // OR(Q72,Q77,Q82,Q87,Q92,Q97)

  // Optional overrides / misc if you want them later
  spareElementsFraction?: number | null;   // E27 (e.g. 0.1 for 10%)
  overrideSheathTempC?: number | null;     // E28
  overridePressureDropBar?: number | null; // E29
}

export interface HeaterDesignOutputs {
  // Simple labels
  n1Label: string; // e.g. "N1 Temperature (°C) - INLET"
  n2Label: string; // e.g. "N2 Temperature (°C) - OUTLET"

  // Core calculations
  dutyKW: number | null;            // E18
  loadPerElementKW: number | null;  // E17
  pinCurrentA: number | null;       // E19

  // Validation flags/messages
  pinCurrentOK: boolean | null;
  pinCurrentMessage: string;        // like F19

  elementCountOK: boolean | null;
  elementCountMessage: string;      // like B15

  terminalBoxStatus: string;        // like B57
  tClassStatus: string;             // like B60
  certStatus: string;               // like B66

  // Convenience list of all warnings
  warnings: string[];
}

/**
 * Helper: safe number check
 */
function isValidNumber(x: unknown): x is number {
  return typeof x === "number" && !isNaN(x);
}

/**
 * N1/N2 label logic (F4/F5)
 */
function buildTemperatureLabels(t1: number | null, t2: number | null) {
  if (!isValidNumber(t1) || !isValidNumber(t2)) {
    return {
      n1Label: "N1 Temperature (°C)",
      n2Label: "N2 Temperature (°C)",
    };
  }

  // Excel logic:
  // F4:
  //  "N1 Temperature (°C) - " & IF(t1=t2,"INLET",IF(t1<t2,"INLET","OUTLET"))
  const n1Suffix =
    t1 === t2 ? "INLET" : t1 < t2 ? "INLET" : "OUTLET";

  // F5:
  //  "N2 Temperature (°C) - " & IF(t1=t2,"OUTLET",IF(t1>t2,"INLET","OUTLET"))
  const n2Suffix =
    t1 === t2 ? "OUTLET" : t1 > t2 ? "INLET" : "OUTLET";

  return {
    n1Label: `N1 Temperature (°C) - ${n1Suffix}`,
    n2Label: `N2 Temperature (°C) - ${n2Suffix}`,
  };
}

/**
 * Main design engine. Mirrors the key logic from the top of Sheet B.
 */
export function runHeaterDesign(
  input: HeaterDesignInputs
): HeaterDesignOutputs {
  const warnings: string[] = [];

  const {
    massFlowKgPerHr,
    cp_kJ_per_kgK,
    t1C,
    t2C,
    heaterRatingKW,
    elementsPerHeater,
    numStages,
    supplyVoltageV,
    supplyConfig,
    parallelFactor = 2,
    maxPinCurrentA,
    terminalBoxMaxElements,
    terminalBoxMaxCurrentA,
    terminalBoxName,
    tClassMaxOpTempC,
    processFluidName,
    elementCoreType,
    certType,
    certRegion,
    certHeaterKWLimit,
    hasCSAIncompatible3mmSensors = false,
  } = input;

  // --- Temperature labels (F4 / F5) -----------------------------
  const { n1Label, n2Label } = buildTemperatureLabels(t1C, t2C);

  // --- Calculated duty (E18) ------------------------------------
  let dutyKW: number | null = null;
  if (
    isValidNumber(massFlowKgPerHr) &&
    isValidNumber(cp_kJ_per_kgK) &&
    isValidNumber(t1C) &&
    isValidNumber(t2C)
  ) {
    const deltaT = t2C - t1C;
    dutyKW = (massFlowKgPerHr * cp_kJ_per_kgK * deltaT) / 3600;
  }

  // --- Load per element (E17) -----------------------------------
  let loadPerElementKW: number | null = null;
  if (isValidNumber(heaterRatingKW) && isValidNumber(elementsPerHeater) && elementsPerHeater > 0) {
    loadPerElementKW = heaterRatingKW / elementsPerHeater;
  }

  // --- Pin current (E19) ----------------------------------------
  let pinCurrentA: number | null = null;
  if (
    isValidNumber(loadPerElementKW) &&
    isValidNumber(elementsPerHeater) &&
    elementsPerHeater > 0 &&
    isValidNumber(supplyVoltageV) &&
    supplyVoltageV > 0
  ) {
    const wattsPerElement = loadPerElementKW * 1000;

    if (supplyConfig === "STAR") {
      // STAR: divide by (line voltage / √3)
      pinCurrentA =
        wattsPerElement / (supplyVoltageV / Math.sqrt(3));
    } else {
      // DELTA or other 3φ: divide by line voltage directly
      pinCurrentA = wattsPerElement / supplyVoltageV;
    }
  }

  // --- Pin current OK? (F19) ------------------------------------
  let pinCurrentOK: boolean | null = null;
  let pinCurrentMessage = "Pin current not calculated";

  if (!isValidNumber(pinCurrentA)) {
    pinCurrentMessage = "Pin current not calculated (missing data)";
  } else if (isValidNumber(maxPinCurrentA)) {
    pinCurrentOK = pinCurrentA <= maxPinCurrentA;
    if (!pinCurrentOK) {
      pinCurrentMessage = `PIN CURRENT TOO HIGH – Max allowed: ${maxPinCurrentA.toFixed(
        0
      )} A`;
      warnings.push(pinCurrentMessage);
    } else {
      pinCurrentMessage = "Pin Current OK";
    }
  } else {
    pinCurrentMessage = "Pin current calculated (no catalogue limit provided)";
  }

  // --- Element count sanity (B15) -------------------------------
  let elementCountOK: boolean | null = null;
  let elementCountMessage = "Element Count OK";

  if (
    isValidNumber(elementsPerHeater) &&
    elementsPerHeater > 0 &&
    isValidNumber(numStages) &&
    numStages > 0 &&
    supplyConfig !== "SINGLE_PHASE"
  ) {
    // Excel: MOD(E14, 3*IF(P214="PAREL",1,2)*E12)
    const requiredMultiple = 3 * parallelFactor * numStages;
    const remainder = elementsPerHeater % requiredMultiple;

    elementCountOK = remainder === 0;

    if (!elementCountOK) {
      const elementsPerStage = elementsPerHeater / numStages;
      elementCountMessage = `WARNING: ${elementsPerStage.toFixed(
        2
      )} elements per stage (must divide into ${requiredMultiple})`;
      warnings.push(elementCountMessage);
    } else {
      elementCountMessage = "Element Count OK";
    }
  } else {
    elementCountMessage = "Element Count OK"; // matches Excel's default behaviour
  }

  // --- Terminal box status (B57) -------------------------------
  let terminalBoxStatus = "Terminal Box";

  // First check: element count vs terminal box maximum
  const elementCountExceedsTBox =
    isValidNumber(elementsPerHeater) &&
    isValidNumber(terminalBoxMaxElements) &&
    elementsPerHeater > terminalBoxMaxElements;

  // Second check: terminal box current vs limit
  const tBoxCurrentExceeds =
    isValidNumber(pinCurrentA) &&
    isValidNumber(terminalBoxMaxCurrentA) &&
    pinCurrentA > terminalBoxMaxCurrentA;

  if (elementCountExceedsTBox) {
    terminalBoxStatus = "WARN: Element Count Exceeded (Terminal Box)";
    warnings.push(terminalBoxStatus);
  } else if (tBoxCurrentExceeds) {
    terminalBoxStatus = "WARN: T-Box Current Exceeded";
    warnings.push(terminalBoxStatus);
  } else {
    const name = terminalBoxName || "";
    terminalBoxStatus = name
      ? `Terminal Box (${name})`
      : "Terminal Box";
  }

  // --- Temperature class status (B60) ---------------------------
  let tClassStatus = "Temp. Class";

  if (
    isValidNumber(tClassMaxOpTempC) &&
    isValidNumber(t1C) &&
    (!processFluidName || processFluidName.toLowerCase() !== "glycol")
  ) {
    if (t1C > tClassMaxOpTempC) {
      tClassStatus = "WARN: Op. Temp. Exceeds T-Class";
      warnings.push(tClassStatus);
    }
  }

  // --- Certification status (B66) ------------------------------
  let certStatus = "Heater Certification";

  const isCore = (elementCoreType || "").toLowerCase() === "core";
  const isExe = (certType || "").toLowerCase() === "exe";
  const isCSA = (certRegion || "").toUpperCase() === "CSA";

  if (isCore && isExe) {
    certStatus = "WARN: Exe Cert Not Allowed For Core";
    warnings.push(certStatus);
  } else if (
    isValidNumber(certHeaterKWLimit) &&
    isValidNumber(heaterRatingKW) &&
    heaterRatingKW > certHeaterKWLimit
  ) {
    certStatus = "WARN: T-Box Cert Limit Exceeded";
    warnings.push(certStatus);
  } else if (isCSA && hasCSAIncompatible3mmSensors) {
    certStatus = "WARN: 3mm Sensors Not Allowed";
    warnings.push(certStatus);
  } else {
    certStatus = "Heater Certification";
  }

  return {
    n1Label,
    n2Label,
    dutyKW,
    loadPerElementKW,
    pinCurrentA,
    pinCurrentOK,
    pinCurrentMessage,
    elementCountOK,
    elementCountMessage,
    terminalBoxStatus,
    tClassStatus,
    certStatus,
    warnings,
  };
}
