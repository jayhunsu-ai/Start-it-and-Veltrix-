import React, { useState } from "react";
import BusinessEngine3D from "./BusinessEngine3D.jsx";
import "./phase3.css";

export default function Phase3Showcase({ onPartSelect }) {
  const [activePart, setActivePart] = useState(null);

  return (
    <div className="phase3-showcase">
      <BusinessEngine3D
        onPartSelect={(part) => {
          setActivePart(part);
          onPartSelect?.(part);
        }}
      />

      {activePart && (
        <div className="phase3-selection" role="status">
          <span>{activePart.label}</span>
          <small>{activePart.note}</small>
        </div>
      )}
    </div>
  );
}
