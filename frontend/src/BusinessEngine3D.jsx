import React, { useEffect, useMemo, useState } from "react";

/**
 * Phase 3: Business Engine
 *
 * Mobile-first progressive enhancement:
 * - Default renderer is DOM/CSS, so there is no WebGL dependency or GPU lock-up.
 * - WebGL/Three.js can be added later behind the same component contract.
 * - Heavy motion is disabled for reduced-motion and constrained devices.
 */
const PARTS = [
  { id: "idea", label: "IDEA", note: "The raw material", x: -150, y: -108, z: 48 },
  { id: "brand", label: "BRAND", note: "Identity & position", x: 0, y: -150, z: 82 },
  { id: "audience", label: "AUDIENCE", note: "Who it serves", x: 150, y: -108, z: 48 },
  { id: "offer", label: "OFFER", note: "What gets bought", x: -150, y: 36, z: 74 },
  { id: "distribution", label: "DISTRIBUTION", note: "How it travels", x: 0, y: 78, z: 96 },
  { id: "operations", label: "OPERATIONS", note: "How it works", x: 150, y: 36, z: 74 },
  { id: "revenue", label: "REVENUE", note: "How money moves", x: 0, y: 184, z: 116 },
];

function canUseMotion() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const narrow = window.matchMedia?.("(max-width: 720px)").matches;
  return cores >= 6 && memory >= 4 && !narrow;
}

export default function BusinessEngine3D({ onPartSelect }) {
  const [exploded, setExploded] = useState(false);
  const [selected, setSelected] = useState("brand");
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    setMotion(canUseMotion());
  }, []);

  const selectedPart = useMemo(
    () => PARTS.find((part) => part.id === selected) || PARTS[0],
    [selected]
  );

  const choose = (part) => {
    setSelected(part.id);
    onPartSelect?.(part);
  };

  return (
    <section className={`business-engine ${motion ? "business-engine--motion" : ""}`}>
      <div className="business-engine__header">
        <div>
          <span className="phase-kicker">SYSTEM / 03</span>
          <h2>THE BUSINESS ENGINE</h2>
          <p>See the pieces. Build the machine.</p>
        </div>

        <button
          type="button"
          className="engine-toggle"
          aria-pressed={exploded}
          onClick={() => setExploded((value) => !value)}
        >
          {exploded ? "ASSEMBLE" : "EXPLODE"}
        </button>
      </div>

      <div
        className={`engine-stage ${exploded ? "engine-stage--exploded" : "engine-stage--assembled"}`}
        aria-label="Interactive business system"
      >
        <div className="engine-axis engine-axis--x" />
        <div className="engine-axis engine-axis--y" />

        <div className="engine-core">
          <span>START-IT</span>
          <strong>BUSINESS</strong>
          <small>ENGINE</small>
        </div>

        {PARTS.map((part) => {
          const active = part.id === selected;
          const style = exploded
            ? {
                "--x": `${part.x}px`,
                "--y": `${part.y}px`,
                "--z": `${part.z}px`,
              }
            : {
                "--x": "0px",
                "--y": "0px",
                "--z": "0px",
              };

          return (
            <button
              key={part.id}
              type="button"
              className={`engine-part ${active ? "engine-part--active" : ""}`}
              style={style}
              aria-label={`${part.label}: ${part.note}`}
              onClick={() => choose(part)}
            >
              <span className="engine-part__number">0{PARTS.indexOf(part) + 1}</span>
              <strong>{part.label}</strong>
              <small>{part.note}</small>
            </button>
          );
        })}

        <div className="engine-orbit engine-orbit--one" />
        <div className="engine-orbit engine-orbit--two" />
      </div>

      <div className="engine-inspector" aria-live="polite">
        <div>
          <span className="phase-kicker">SELECTED COMPONENT</span>
          <h3>{selectedPart.label}</h3>
          <p>{selectedPart.note}</p>
        </div>
        <button type="button" onClick={() => onPartSelect?.(selectedPart)}>
          INSPECT →
        </button>
      </div>

      <p className="engine-mobile-note">
        Tap a component to inspect it. The engine stays in lightweight mode on phones.
      </p>
    </section>
  );
}
