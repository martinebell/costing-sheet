// src/engine/labour.ts

// This mirrors part of sheet N, specifically:
//
// M80  -> Machining hours            (Labour Calc K14)
// M81  -> Element hours              (Labour Calc K15)
// M82, M84, M85, M88 -> Welding      (Labour Calc K16)
// M83, M89, M94, M95, M96 -> Final   (Labour Calc K20)
// M86, M87, M92, M93, M99 -> Paint   (Labour Calc K25)

export interface LabourEngineInputs {
  // --- Machining (M80) ---
  // M80 = OVERRIDE(G122, IF(K16=1, 1.5 + (IF(B!P5="Hairpin",K24*2,K24) * B!P47), 0))
  machiningOverrideHours?: number | null; // G122
  machiningEnabledFlag?: number | null;   // K16 (1 = enabled)
  machiningPerItemHours?: number | null;  // B!P47

  // --- Shared / element-related inputs ---
  p5?: string | null;            // B!P5   ("Core", "Hairpin", "Cartridge", etc.)
  p208?: number | null;          // B!P208 (number of elements)
  p209?: number | null;          // B!P209 (extra standpipes / filler rings)
  k24?: number | null;           // N!K24  (rows / banks)
  e12?: number | null;           // B!E12  (number of stages)
  e14?: number | null;           // B!E14  (elements per heater)

  // --- Welding-specific (M82, M84, M85, M88) ---
  p118?: number | null;          // B!P118 (design type flag)
  p60?: string | null;           // B!P60  ("WELDED WITH STANDPIPE", etc.)
  p173?: number | null;          // B!P173
  p174?: number | null;          // B!P174
  p225?: number | null;          // B!P225 (length in mm)
  p176?: number | null;          // B!P176 (base welding hours)
  p177?: number | null;          // B!P177 (extra welding hours per stage)
  k21?: number | null;           // N!K21  (weld groups)

  // --- Final assembly specific (M83, M89, M94, M95, M96) ---
  p162?: string | null;          // B!P162 (e.g. "ISES")
  p178?: number | null;          // B!P178
  p179?: number | null;          // B!P179
  k50?: number | null;           // N!K50
  k51?: number | null;           // N!K51
  k62?: number | null;           // N!K62
  k39?: number | null;           // N!K39

  // --- Paint specific (M86, M87, M92, M93, M99) ---
  p143?: string | null;          // B!P143 (paint system A)
  p149?: string | null;          // B!P149 (paint system B)
  p146?: string | null;          // B!P146 (topcoat / extra paint)
  u9?: number | null;            // N!U9   (used in K63)

  paintPrepOverrideHours?: number | null;      // G123
  paintTouchupOverrideHours?: number | null;   // G132
  paintTopcoatOverrideHours?: number | null;   // G135
  paintTopcoatFlagOverride?: number | null;    // E135 (for K63)

    // --- Wiring specific (M90) ---
  p180?: number | null;          // B!P180 (base wiring hours)
  p181?: number | null;          // B!P181 (per element, first 50 – hairpin)
  p182?: number | null;          // B!P182 (per element, over 50 – hairpin)
  p183?: number | null;          // B!P183 (per element for non-hairpin)

    // --- Testing & Other (placeholders for M91, M97, M98, M100, M101) ---
  testingOverrideHours?: number | null; // maps to K31 in Labour Calc
  otherOverrideHours?: number | null;   // maps to K35 in Labour Calc


}

export interface LabourEngineOutputs {
  machiningHours: number;        // K14 (M80)
  elementHours: number;          // K15 (M81)
  weldingHours: number;          // K16 (M82+M84+M85+M88)
  finalAssemblyHours: number;    // K20 (M83+M89+M94+M95+M96)
  paintHours: number;            // K25 (M86+M87+M92+M93+M99)
  wiringHours: number;           // Labour Calc K30 (M90)
testingHours: number;          // K31 (currently override-based)
  otherHours: number;            // K35 (currently override-based)


}

/** helper: is valid number */
function isValidNumber(x: unknown): x is number {
  return typeof x === "number" && !isNaN(x);
}

/** helper: numeric default */
function n(x: number | null | undefined): number {
  return isValidNumber(x) ? x : 0;
}

/** helper: Excel-style OVERRIDE(overrideCell, calcValue) */
function overrideVal(
  overrideValue: number | null | undefined,
  calculated: number
): number {
  return isValidNumber(overrideValue) ? overrideValue : calculated;
}

/**
 * Labour engine – Machining + Element + Welding + Final Assembly + Paint + Wiring
 */
export function runLabourEngine(
  input: LabourEngineInputs
): LabourEngineOutputs {
  const {
    // Machining
    machiningOverrideHours,
    machiningEnabledFlag,
    machiningPerItemHours,

    // Shared
    p5,
    p208,
    p209,
    k24,
    e12,
    e14,

    // Welding
    p118,
    p60,
    p173,
    p174,
    p225,
    p176,
    p177,
    k21,

    // Final assembly
    p162,
    p178,
    p179,
    k50,
    k51,
    k62,
    k39,

    // Paint
    p143,
    p149,
    p146,
    u9,
    paintPrepOverrideHours,
    paintTouchupOverrideHours,
    paintTopcoatOverrideHours,
    paintTopcoatFlagOverride,

      // Wiring
    p180,
    p181,
    p182,
    p183,

    // Testing & Other
    testingOverrideHours,
    otherOverrideHours,

  } = input;


  const coreType = (p5 || "").trim();
  const nozzleWeldType = (p60 || "").trim().toUpperCase();
  const designTypeFlag = n(p118);
  const elements = n(p208);
  const extraItems = n(p209);
  const k24v = n(k24);
  const stages = n(e12);
  const elementsPerHeater = n(e14);
  const k21v = n(k21);

  // === MACHINING (M80) ==========================================
  // M80 = OVERRIDE(G122,
  //        IF(K16=1,
  //           1.5 + ( IF(B!P5="Hairpin", K24*2, K24) * B!P47 ),
  //           0))
  const machiningEnabled =
    !isValidNumber(machiningEnabledFlag) || machiningEnabledFlag === 1;

  const perItemHours = n(machiningPerItemHours); // B!P47

  // K24 is roughly "number of items"; hairpin doubles it.
  const machiningItemCount =
    coreType.toLowerCase() === "hairpin" ? k24v * 2 : k24v;

  const m80Formula = machiningEnabled
    ? 1.5 + machiningItemCount * perItemHours
    : 0;

  const machiningHours = overrideVal(
    machiningOverrideHours,
    m80Formula
  );

  // === ELEMENT (M81) ============================================
  // M81 = IF(B!P5="Hairpin", 1+0.0667*K24, 0)
  let elementHours = 0;
  if (coreType.toLowerCase() === "hairpin") {
    elementHours = 1 + 0.0667 * k24v;
  }

  // === WELDING (M82, M84, M85, M88) =============================

  // M82 = IF(B!P118=6, 0, (K21*0.167)+1)
  const m82 =
    designTypeFlag === 6 ? 0 : k21v * 0.167 + 1;

  // M84 =
  // =IF(
  //   OR(
  //     AND(B!P60="WELDED WITH STANDPIPE",B!P5="Hairpin"),
  //     AND(B!P60="WELDED WITH FILLER RINGS",B!P5="Hairpin")
  //   ),
  //   B!P208+B!P209,
  //   0
  // )*0.1
  const isHairpin = coreType.toLowerCase() === "hairpin";
  const isStandpipe =
    nozzleWeldType === "WELDED WITH STANDPIPE";
  const isFillerRings =
    nozzleWeldType === "WELDED WITH FILLER RINGS";

  const m84 =
    isHairpin && (isStandpipe || isFillerRings)
      ? (elements + extraItems) * 0.1
      : 0;

  // M85 =
  // =IF(B!P5="Core", 1+0.5*B!P208,
  //     IF(B!P5="Cartridge", 1+0.25*B!P208, 0))
  let m85 = 0;
  if (coreType === "Core") {
    m85 = 1 + 0.5 * elements;
  } else if (coreType === "Cartridge") {
    m85 = 1 + 0.25 * elements;
  }

  // M88 = B!P176 + IFERROR(B!P177*B!E12, 0)
  const m88 = n(p176) + n(p177) * stages;

  const weldingHours = m82 + m84 + m85 + m88;

  // === FINAL ASSEMBLY (M83, M89, M94, M95, M96) =================

  // M83 = IF(
  //         B!P5="Core",
  //         B!P208 * (B!P173 + (B!P174*(B!P225/25.4))),
  //         0.5 + MIN(50,B!P208)*0.167 + MAX(0,B!P208-50)*0.133
  //       )
  let m83: number;
  if (coreType === "Core") {
    const base = n(p173);
    const extra = n(p174) * (n(p225) / 25.4);
    m83 = elements * (base + extra);
  } else {
    const min50 = Math.min(50, elements);
    const extraOver50 = Math.max(0, elements - 50);
    m83 = 0.5 + min50 * 0.167 + extraOver50 * 0.133;
  }

  // M89 = IF(B!P162="ISES", B!P178+B!P179*B!E14, 0)
  const p162Val = (p162 || "").trim().toUpperCase();
  const m89 =
    p162Val === "ISES"
      ? n(p178) + n(p179) * elementsPerHeater
      : 0;

  // M94 = MAX(0.5, (K50+K51)*0.0833)
  const k50v = n(k50);
  const k51v = n(k51);
  const m94 = Math.max(0.5, (k50v + k51v) * 0.0833);

  // M95 = IF(K62>=1,(1+((K62-1)*0.5)),0)
  const k62v = n(k62);
  const m95 =
    k62v >= 1 ? 1 + (k62v - 1) * 0.5 : 0;

  // M96 = $K$39*2
  const k39v = n(k39);
  const m96 = k39v * 2;

  const finalAssemblyHours = m83 + m89 + m94 + m95 + m96;

  // === PAINT (M86, M87, M92, M93, M99) ==========================

  const p143Val = (p143 || "").trim();
  const p149Val = (p149 || "").trim();
  const p146Val = (p146 || "").trim();

  const noPaint143 =
    p143Val === "" || p143Val === "No Painting Required";
  const noPaint149 =
    p149Val === "" || p149Val === "No Painting Required";
  const noPaint146 =
    p146Val === "" || p146Val === "No Painting Required";

  // M86 = IF(B!P143<>"No Painting Required", 1+0.0333*B!P208, 0)
  const m86 = noPaint143 ? 0 : 1 + 0.0333 * elements;

  // K17 = IF(B!P143="No Painting Required", 0, 1)
  const k17 = noPaint143 ? 0 : 1;

  // M87 = OVERRIDE(G123, K17*(0.5+0.01667*K24))
  const m87Base = k17 * (0.5 + 0.01667 * k24v);
  const m87 = overrideVal(
    paintPrepOverrideHours,
    m87Base
  );

  // M92 = IF(B!P149<>"No Painting Required", 1+0.0333*B!P208, 0)
  const m92 = noPaint149 ? 0 : 1 + 0.0333 * elements;

  // K35 = IF(B!P149="No Painting Required", 0, 1)
  const k35 = noPaint149 ? 0 : 1;

  // M93 = OVERRIDE(G132, K35*(0.5+0.01667*K24))
  const m93Base = k35 * (0.5 + 0.01667 * k24v);
  const m93 = overrideVal(
    paintTouchupOverrideHours,
    m93Base
  );

  // K63 = OVERRIDE(E135, IF(B!P146="No Painting Required",0,MIN(1,U9)))
  const baseK63 = noPaint146 ? 0 : Math.min(1, n(u9));
  const k63 = overrideVal(
    paintTopcoatFlagOverride,
    baseK63
  );

  // M99 = OVERRIDE(G135, IF(K63=1,2,0))
  const m99Base = k63 >= 1 ? 2 : 0;
  const m99 = overrideVal(
    paintTopcoatOverrideHours,
    m99Base
  );

  const paintHours = m86 + m87 + m92 + m93 + m99;

    // === WIRING (M90) =============================================
  // M90 = B!P180 + IF(
  //         B!P5="Hairpin",
  //         B!P181*MIN(50,B!P208) + B!P182*MAX(0,B!P208-50),
  //         B!E14*B!P183
  //       )

  const baseWiring = n(p180);
  const p181v = n(p181);
  const p182v = n(p182);
  const p183v = n(p183);
  const elementsHairpin = elements; // B!P208
  

  let wiringExtra = 0;

  if (coreType.toLowerCase() === "hairpin") {
    const first50 = Math.min(50, elementsHairpin);
    const over50 = Math.max(0, elementsHairpin - 50);
    wiringExtra = p181v * first50 + p182v * over50;
  } else {
    wiringExtra = elementsPerHeater * p183v;
  }

  const wiringHours = baseWiring + wiringExtra;

    // === TESTING & OTHER (placeholder) ============================
  // For now these are direct overrides; later we can port
  // M91, M97, M98, M100, M101 logic from sheet N.
  const testingHours = n(testingOverrideHours);
  const otherHours = n(otherOverrideHours);


  

  return {
    machiningHours,
    elementHours,
    weldingHours,
    finalAssemblyHours,
    paintHours,
    wiringHours,
    testingHours,
    otherHours,
  };
}
