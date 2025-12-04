import { calculateSpiralDesign, SpiralDesignInputs, SpiralDesignResult } from "./spiralDesign";

export interface ElementDesignRequest extends SpiralDesignInputs {
  // later we can add more fields (core length, passes, etc.)
}

export interface ElementDesignResponse extends SpiralDesignResult {
  // later we can add validation messages, warnings, etc.
}

/**
 * High-level engine entry point for element design.
 * This is what the rest of the app should call.
 */
export function runElementDesign(
  request: ElementDesignRequest
): ElementDesignResponse {
  // for now it just delegates to the spiral calculation
  const spiral = calculateSpiralDesign(request);

  // later we can merge in geometry, checks, flags, etc.
  return {
    ...spiral
  };
}
