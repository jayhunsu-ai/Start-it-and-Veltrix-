import React from "react";

export default function WorkshopChrome() {
  return (
    <>
      <div className="workshop-ambient" aria-hidden="true">
        <div className="workshop-glow workshop-glow-a" />
        <div className="workshop-glow workshop-glow-b" />
        <div className="workshop-grid" />
        <div className="workshop-noise" />
      </div>

      <div className="workshop-rail" aria-hidden="true">
        <span className="workshop-rail-mark">START-IT</span>
        <span className="workshop-rail-line" />
        <span className="workshop-rail-meta">WORKSHOP / 01</span>
      </div>

      <div className="workshop-material" aria-hidden="true">
        <span className="workshop-dot" />
        <span>DENIM / TOPSTITCH</span>
        <span className="workshop-material-separator">•</span>
        <span>PHASE 01</span>
      </div>
    </>
  );
}
