// src/components/HeaterDesignCalculator.jsx
import { runHeaterDesign } from "../engine/heaterDesign";

export default function HeaterDesignCalculator({
  designInputs,
  onDesignChange,
}) {
  const handleNumberChange = (field) => (e) => {
    const value = e.target.value;
    onDesignChange({
      ...designInputs,
      [field]: value === "" ? "" : Number(value),
    });
  };

  const handleTextChange = (field) => (e) => {
    onDesignChange({
      ...designInputs,
      [field]: e.target.value,
    });
  };

  const handleSelectChange = (field) => (e) => {
    onDesignChange({
      ...designInputs,
      [field]: e.target.value,
    });
  };

  const handleCheckboxChange = (field) => (e) => {
  onDesignChange({
    ...designInputs,
    [field]: e.target.checked,
  });
};

  const design = runHeaterDesign(designInputs);

  return (
    <div style={{ maxWidth: 800 }}>
      <h2>Heater Design Inputs</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem 1.5rem",
        }}
      >
        {/* Process side */}
        <label>
          Mass flow (kg/h)
          <input
            type="number"
            value={designInputs.massFlowKgPerHr}
            onChange={handleNumberChange("massFlowKgPerHr")}
          />
        </label>

        <label>
          Cp (kJ/kg·K)
          <input
            type="number"
            step="0.0001"
            value={designInputs.cp_kJ_per_kgK}
            onChange={handleNumberChange("cp_kJ_per_kgK")}
          />
        </label>

        <label>
          Inlet temp (°C)
          <input
            type="number"
            value={designInputs.t1C}
            onChange={handleNumberChange("t1C")}
          />
        </label>

        <label>
          Outlet temp (°C)
          <input
            type="number"
            value={designInputs.t2C}
            onChange={handleNumberChange("t2C")}
          />
        </label>

        {/* Electrical / element data */}
        <label>
          Heater rating (kW)
          <input
            type="number"
            value={designInputs.heaterRatingKW}
            onChange={handleNumberChange("heaterRatingKW")}
          />
        </label>

        <label>
          Quantity (identical heaters)
          <input
          type="number"
          min="1"
          value={designInputs.quantity}
          onChange={handleNumberChange("quantity")}
          />
          </label>

        <label>
          Elements per heater
          <input
            type="number"
            value={designInputs.elementsPerHeater}
            onChange={handleNumberChange("elementsPerHeater")}
          />
        </label>

        <label>
          Number of stages
          <input
            type="number"
            value={designInputs.numStages}
            onChange={handleNumberChange("numStages")}
          />
        </label>

        <label>
          Supply voltage (V)
          <input
            type="number"
            value={designInputs.supplyVoltageV}
            onChange={handleNumberChange("supplyVoltageV")}
          />
        </label>

        <label>
          Supply config
          <select
            value={designInputs.supplyConfig}
            onChange={handleSelectChange("supplyConfig")}
          >
            <option value="STAR">STAR</option>
            <option value="DELTA">DELTA</option>
          </select>
        </label>

        {/* Core type drives labour */}
        <label>
          Element core type
          <select
            value={designInputs.elementCoreType}
            onChange={handleSelectChange("elementCoreType")}
          >
            <option value="Core">Core</option>
            <option value="Hairpin">Hairpin</option>
            <option value="Cartridge">Cartridge</option>
          </select>
        </label>

        {/* Simple free text if you want later mapping */}
        <label>
          Process fluid
          <input
            type="text"
            value={designInputs.processFluidName}
            onChange={handleTextChange("processFluidName")}
          />
        </label>

                {/* Labour-related config */}
        <label>
          Weld type
          <select
            value={designInputs.weldType}
            onChange={handleSelectChange("weldType")}
          >
            <option value="WELDED WITH STANDPIPE">
              WELDED WITH STANDPIPE
            </option>
            <option value="WELDED WITH FILLER RINGS">
              WELDED WITH FILLER RINGS
            </option>
            <option value="FLANGED">FLANGED (no nozzle weld)</option>
          </select>
        </label>

        <label>
          Rows / banks (k24)
          <input
            type="number"
            value={designInputs.rowsPerBank}
            onChange={handleNumberChange("rowsPerBank")}
          />
        </label>

        <label>
          ISES control system?
          <input
            type="checkbox"
            checked={designInputs.isISES}
            onChange={handleCheckboxChange("isISES")}
            style={{ marginLeft: "0.5rem" }}
          />
        </label>

        <label>
          Paint system A
          <select
            value={designInputs.paintSystemA}
            onChange={handleSelectChange("paintSystemA")}
          >
            <option value="Painted">Painted</option>
            <option value="No Painting Required">No Painting Required</option>
          </select>
        </label>

        <label>
          Paint system B
          <select
            value={designInputs.paintSystemB}
            onChange={handleSelectChange("paintSystemB")}
          >
            <option value="Painted">Painted</option>
            <option value="No Painting Required">No Painting Required</option>
          </select>
        </label>

        <label>
          Topcoat / extra paint
          <select
            value={designInputs.paintTopcoat}
            onChange={handleSelectChange("paintTopcoat")}
          >
            <option value="Painted">Painted</option>
            <option value="No Painting Required">No Painting Required</option>
          </select>
        </label>

        <label>
          Testing hours override
          <input
            type="number"
            value={designInputs.testingHoursOverride}
            onChange={handleNumberChange("testingHoursOverride")}
          />
        </label>

        <label>
          Other hours override
          <input
            type="number"
            value={designInputs.otherHoursOverride}
            onChange={handleNumberChange("otherHoursOverride")}
          />
        </label>

      </div>

      <h3 style={{ marginTop: "1.5rem" }}>Design summary</h3>
      <ul>
        <li>
          Duty:{" "}
          {design.dutyKW !== null
            ? `${design.dutyKW.toFixed(1)} kW`
            : "—"}
        </li>
        <li>
          Installed load per element:{" "}
          {design.loadPerElementKW !== null
            ? `${design.loadPerElementKW.toFixed(3)} kW/element`
            : "—"}
        </li>
        {design.warnings.length > 0 && (
          <li>
            <strong>Warnings:</strong>
            <ul>
              {design.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </li>
        )}
      </ul>
    </div>
  );
}
