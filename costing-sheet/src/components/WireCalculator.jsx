import { useState } from "react";
import { calculateWireSize } from "../data/wireCalc";

export default function WireCalculator() {
  const [current, setCurrent] = useState("");
  const [distance, setDistance] = useState("");
  const [result, setResult] = useState(null);

  const runCalc = () => {
    setResult(calculateWireSize(current, distance));
  };

  return (
    <div>
      <h2>Wire Size Calculator</h2>

      <input
        placeholder="Current (A)"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />

      <input
        placeholder="Distance (m)"
        value={distance}
        onChange={(e) => setDistance(e.target.value)}
      />

      <button onClick={runCalc}>Calculate</button>

      {result && (
        <div>
          <p>Recommended Gauge: {result.recommendedGauge}</p>
          <p>Voltage Drop: {result.voltageDrop}</p>
        </div>
      )}
    </div>
  );
}
