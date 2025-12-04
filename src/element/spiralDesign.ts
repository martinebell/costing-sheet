import { wireTable, WireTableRow } from "./wireTable";
import { lookupWire } from "../utils/lookup";

export type SpiralDesignInputs = {
  heaterRatingKw: number;
  elementsPerHeater: number;
  spiralsPerElement: number;
  supplyVolts: number;
  connection: "STAR" | "DELTA";
  wireDiameterMm: number;
};

export type SpiralDesignResult = {
  wattsPerElement: number;
  wattsPerSpiral: number;
  voltsPerSpiral: number;
  resistanceHot: number;
  resistanceCold: number;
  wireLengthFeet: number;
  coilLengthInches: number;
  currentAmps: number;
  mandrelSize: number;
  npTurnsPerInch: number;
};

export function calculateSpiralDesign(
  inputs: SpiralDesignInputs
): SpiralDesignResult {
  // 1) Look up the wire row
  const wire: WireTableRow = lookupWire(inputs.wireDiameterMm, wireTable);

  // 2) Basic power
  const totalWatts = inputs.heaterRatingKw * 1000;
  const wattsPerElement = totalWatts / inputs.elementsPerHeater;
  const wattsPerSpiral = wattsPerElement / inputs.spiralsPerElement;

  // 3) Voltage per spiral (STAR vs DELTA)
  const voltsPerSpiral =
    inputs.connection === "STAR"
      ? inputs.supplyVolts / Math.sqrt(3)
      : inputs.supplyVolts;

  // 4) Resistance hot: R = V^2 / P
  const resistanceHot = (voltsPerSpiral * voltsPerSpiral) / wattsPerSpiral;

  // 5) Temperature correction (placeholder 600°C for now)
  const spiralTemp = 600;

  const tempCorrection =
    spiralTemp <= 600
      ? 1 + spiralTemp * 117e-6
      : spiralTemp <= 700
      ? 1 + spiralTemp * 150e-6
      : 1 + spiralTemp * 79e-6;

  const resistanceCold = resistanceHot / tempCorrection;

  // 6) Wire / coil lengths
  const wireLengthFeet = resistanceCold / wire.ohmsPerFoot;
  const coilLengthInches = wireLengthFeet / wire.npTurnsPerInch;

  // 7) Current
  const currentAmps = wattsPerSpiral / voltsPerSpiral;

  return {
    wattsPerElement,
    wattsPerSpiral,
    voltsPerSpiral,
    resistanceHot,
    resistanceCold,
    wireLengthFeet,
    coilLengthInches,
    currentAmps,
    mandrelSize: wire.mandrelSize,
    npTurnsPerInch: wire.npTurnsPerInch
  };
}
