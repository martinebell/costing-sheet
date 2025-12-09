import HeaterDesignCalculator from "./components/HeaterDesignCalculator";
import WireCalculator from "./components/WireCalculator";
import CostingSummary from "./components/CostingSummary";

function App() {
  return (
    <div style={{ padding: "1rem", fontFamily: "system-ui" }}>
      <h1>EXHEAT Costing Sheet</h1>

      <HeaterDesignCalculator />

      <hr style={{ margin: "2rem 0" }} />

      <WireCalculator />

      <hr style={{ margin: "2rem 0" }} />

      <CostingSummary />
    </div>
  );
}

export default App;
