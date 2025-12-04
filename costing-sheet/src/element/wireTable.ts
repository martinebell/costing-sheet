export interface WireTableRow {
  diameterMm: number;
  ohmsPerFoot: number;
  npTurnsPerInch: number;
  mandrelSize: number;
}

export const wireTable: WireTableRow[] = [
  { diameterMm: 0.3, ohmsPerFoot: 5.1,    npTurnsPerInch: 3.75, mandrelSize: 8 },
  { diameterMm: 0.4, ohmsPerFoot: 2.571,  npTurnsPerInch: 2.88, mandrelSize: 8 },
  { diameterMm: 0.45, ohmsPerFoot: 2.02,  npTurnsPerInch: 2.59, mandrelSize: 8 },
  { diameterMm: 0.5, ohmsPerFoot: 1.625,  npTurnsPerInch: 2.36, mandrelSize: 8 },
  { diameterMm: 0.6, ohmsPerFoot: 1.28,   npTurnsPerInch: 2.08, mandrelSize: 8 },
  { diameterMm: 0.65, ohmsPerFoot: 1.02,  npTurnsPerInch: 1.94, mandrelSize: 8 },
  { diameterMm: 0.7, ohmsPerFoot: 0.83,   npTurnsPerInch: 1.61, mandrelSize: 10 },
  { diameterMm: 0.8, ohmsPerFoot: 0.63,   npTurnsPerInch: 1.44, mandrelSize: 10 },
  { diameterMm: 0.9, ohmsPerFoot: 0.51,   npTurnsPerInch: 1.31, mandrelSize: 10 },
  { diameterMm: 1.0, ohmsPerFoot: 0.4062, npTurnsPerInch: 1.2,  mandrelSize: 10 }
];
