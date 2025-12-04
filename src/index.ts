import { runElementDesign } from "./element/engine";

console.log("costing-sheet started");

const result = runElementDesign({
  heaterRatingKw: 120,
  elementsPerHeater: 24,
  spiralsPerElement: 6,
  supplyVolts: 400,
  connection: "STAR",
  wireDiameterMm: 0.3
});

console.log("Spiral Design Result:");
console.log(result);
