import React, { useEffect, useState } from "react";
import MaterialEngine3D from "./MaterialEngine3D.jsx";

const PARTS = [
  ["idea", "IDEA", "Raw material"],
  ["brand", "BRAND", "Identity & position"],
  ["audience", "AUDIENCE", "Who it serves"],
  ["offer", "OFFER", "What gets bought"],
  ["distribution", "DISTRIBUTION", "How it travels"],
  ["operations", "OPERATIONS", "How it works"],
  ["revenue", "REVENUE", "How money moves"],
];

function useMobileLite() {
  const [lite, setLite] = useState(true);
  useEffect(() => {
    const update = () => {
      const narrow = window.matchMedia("(max-width: 720px)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4;
      setLite(narrow || reduced || cores < 6 || memory < 4);
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);
  return lite;
}

export default function ResponsiveBusinessEngine({
  material = "denim",
  exploded = false,
  selectedPartId = null,
  onPartSelect,
}) {
  const lite = useMobileLite();
  // Falls back to internal tracking only if the caller doesn't pass a
  // controlled selectedPartId — WorkshopLab always does, so this is
  // mainly a safety net for any other future caller of this component.
  const [internalSelected, setInternalSelected] = useState("offer");
  const selected = selectedPartId ?? internalSelected;

  const select = (id) => {
    setInternalSelected(id);
    const part = PARTS.find(([key]) => key === id);
    if (part) onPartSelect?.({ id: part[0], label: part[1], note: part[2] });
  };

  if (!lite) {
    return (
      <div className="responsive-engine responsive-engine--webgl">
        <MaterialEngine3D
          material={material}
          exploded={exploded}
          selectedPartId={selected}
          onPartSelect={(part) => {
            setInternalSelected(part.id);
            onPartSelect?.(part);
          }}
        />
      </div>
    );
  }

  return (
    <div className="responsive-engine responsive-engine--lite">
      <div className="lite-engine-core" aria-hidden="true">
        <span>START-IT</span>
        <strong>ENGINE</strong>
        <small>TOUCH SYSTEM</small>
      </div>

      <div className={`lite-engine-parts ${exploded ? "is-exploded" : ""}`}>
        {PARTS.map(([id, label, note], index) => (
          <button
            key={id}
            type="button"
            className={selected === id ? "is-selected" : ""}
            onClick={() => select(id)}
            aria-pressed={selected === id}
          >
            <span>0{index + 1}</span>
            <strong>{label}</strong>
            <small>{note}</small>
          </button>
        ))}
      </div>

      <div className="lite-engine-inspector" aria-live="polite">
        <span>SELECTED COMPONENT</span>
        <strong>{PARTS.find(([id]) => id === selected)?.[1]}</strong>
        <button type="button" onClick={() => select(selected)}>
          INSPECT →
        </button>
      </div>
    </div>
  );
}
