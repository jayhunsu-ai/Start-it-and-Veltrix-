import React, { useEffect, useRef, useState } from "react";
import {
  Box, Pencil, X, ChevronRight, RotateCcw, Layers3, Sparkles,
  DraftingCompass
} from "lucide-react";
import ResponsiveBusinessEngine from "./ResponsiveBusinessEngine.jsx";
import "./phase3-ui.css";

const MATERIALS = [
  { id: "denim", label: "Denim", note: "Workshop" },
  { id: "blueprint", label: "Blueprint", note: "Systems" },
  { id: "paper", label: "Paper", note: "Founder" },
  { id: "pencil", label: "Pencil", note: "Rough" },
];

// Order matters here — it matches PARTS in MaterialEngine3D.jsx exactly,
// since it also drives the guided tour's sequence below. "Operations" was
// previously missing from this list entirely: selecting it in the 3D
// engine set selected="operations", which found no match here and
// silently fell back to showing the IDEA description instead.
const NODES = [
  { id: "idea", label: "IDEA", detail: "The raw material. What are you actually building?" },
  { id: "brand", label: "BRAND", detail: "The promise people remember and repeat." },
  { id: "audience", label: "AUDIENCE", detail: "The people with the problem you can solve." },
  { id: "offer", label: "OFFER", detail: "What someone can actually buy from you." },
  { id: "distribution", label: "DISTRIBUTION", detail: "How the offer finds the right people." },
  { id: "operations", label: "OPERATIONS", detail: "The machinery that has to work, quietly, every day." },
  { id: "revenue", label: "REVENUE", detail: "How value turns into sustainable money." },
];

const TOUR_ORDER = NODES.map((node) => node.id);
const TOUR_SEEN_KEY = "startit_lab_tour_seen";

export default function WorkshopLab({ mode, onModeChange }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("engine");
  const [selected, setSelected] = useState("offer");
  const [exploded, setExploded] = useState(false);
  // One-time guided assembly tour: opens the exploded view and walks the
  // selection highlight through every part in order, then reassembles.
  // Same restraint as the landing page's intro video — it runs once per
  // browser session and any real interaction cancels it immediately.
  const [tourActive, setTourActive] = useState(false);
  const tourTimeoutsRef = useRef([]);

  const material = MATERIALS.find((item) => item.id === mode) || MATERIALS[0];
  const selectedNode = NODES.find((node) => node.id === selected) || NODES[0];

  const stopTour = () => {
    if (tourTimeoutsRef.current.length) {
      tourTimeoutsRef.current.forEach(clearTimeout);
      tourTimeoutsRef.current = [];
    }
    setTourActive(false);
    try {
      window.sessionStorage.setItem(TOUR_SEEN_KEY, "1");
    } catch {
      /* non-fatal — worst case the tour replays next open */
    }
  };

  useEffect(() => {
    if (!open || view !== "engine") return undefined;

    let alreadySeen = true;
    let reducedMotion = false;
    try {
      alreadySeen = !!window.sessionStorage.getItem(TOUR_SEEN_KEY);
      reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      alreadySeen = true;
    }
    if (alreadySeen || reducedMotion) return undefined;

    try {
      window.sessionStorage.setItem(TOUR_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }

    setTourActive(true);
    setExploded(true);
    const timeouts = [];
    TOUR_ORDER.forEach((id, i) => {
      timeouts.push(setTimeout(() => setSelected(id), 550 + i * 560));
    });
    timeouts.push(
      setTimeout(() => {
        setExploded(false);
        setSelected("offer");
        setTourActive(false);
      }, 550 + TOUR_ORDER.length * 560 + 750)
    );
    tourTimeoutsRef.current = timeouts;

    return () => {
      timeouts.forEach(clearTimeout);
      tourTimeoutsRef.current = [];
    };
    // Only re-evaluate on open — view changes mid-session shouldn't
    // restart or interrupt an in-progress tour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <div className="workshop-lab-trigger">
        <button type="button" className="workshop-lab-button" onClick={() => setOpen(true)} aria-label="Open Start-It Workshop Lab">
          <Layers3 size={15} /><span>LAB</span>
        </button>
      </div>

      {open && (
        <div className="workshop-lab-backdrop" role="dialog" aria-modal="true" aria-label="Start-It Workshop Lab">
          <div className="workshop-lab-shell">
            <header className="workshop-lab-header">
              <div>
                <p className="workshop-kicker">START-IT / MATERIAL LAB</p>
                <h2>Build the business before the noise.</h2>
              </div>
              <button className="workshop-lab-close" onClick={() => { stopTour(); setOpen(false); }} aria-label="Close lab"><X size={18} /></button>
            </header>

            <div className="workshop-lab-tabs" role="tablist">
              {[
                ["engine", "Business Engine", Box],
                ["blueprint", "Blueprint", DraftingCompass],
                ["pencil", "Rough Notes", Pencil],
              ].map(([id, label, Icon]) => (
                <button key={id} className={view === id ? "active" : ""} onClick={() => { stopTour(); setView(id); }} role="tab" aria-selected={view === id}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            <div className="workshop-material-row">
              <span className="workshop-kicker">MATERIAL</span>
              {MATERIALS.map((item) => (
                <button key={item.id} className={mode === item.id ? "active" : ""} onClick={() => { stopTour(); onModeChange(item.id); }}>
                  {item.label}<small>{item.note}</small>
                </button>
              ))}
            </div>

            {view === "engine" && (
              <section className={`business-engine ${exploded ? "is-exploded" : ""}`}>
                <div className="engine-header">
                  <div>
                    <span className="workshop-kicker">01 / SYSTEM MAP</span>
                    <h3>Your business, as a machine.</h3>
                    {tourActive && (
                      <p className="engine-tour-note"><Sparkles size={11} /> Guided preview — click any part to take over</p>
                    )}
                  </div>
                  <button className="engine-action" onClick={() => { stopTour(); setExploded((value) => !value); }}>
                    <Box size={14} /> {exploded ? "ASSEMBLE" : "EXPLODE THE SYSTEM"}
                  </button>
                </div>

                <div className="engine-stage engine-stage--3d">
                  <ResponsiveBusinessEngine
                    material={material.id}
                    exploded={exploded}
                    selectedPartId={selected}
                    onPartSelect={(part) => { stopTour(); setSelected(part.id); }}
                  />
                </div>

                <div className="engine-inspector">
                  <div>
                    <span className="engine-index">SELECTED COMPONENT</span>
                    <strong>{selectedNode.label}</strong>
                    <p>{selectedNode.detail}</p>
                  </div>
                  <button onClick={() => { stopTour(); setSelected("offer"); }}>RESET FOCUS <RotateCcw size={13} /></button>
                </div>
              </section>
            )}

            {view === "blueprint" && (
              <section className="blueprint-board">
                <div className="blueprint-stamp">START-IT / BLUEPRINT / REV. 02</div>
                <div className="blueprint-title">BUSINESS<br />FOUNDATION</div>
                <div className="blueprint-line blueprint-line-a" />
                <div className="blueprint-line blueprint-line-b" />
                <div className="blueprint-line blueprint-line-c" />
                <div className="blueprint-note note-a">01 — POSITION<br /><span>What should people remember?</span></div>
                <div className="blueprint-note note-b">02 — OFFER<br /><span>What changes for the customer?</span></div>
                <div className="blueprint-note note-c">03 — CHANNEL<br /><span>Where does the relationship begin?</span></div>
                <div className="blueprint-dimension">← 100% CLARITY →</div>
              </section>
            )}

            {view === "pencil" && (
              <section className="pencil-board">
                <div className="pencil-paper">
                  <span className="pencil-margin">START-IT / ROUGH / DO NOT POLISH YET</span>
                  <h3>What are we actually trying to make?</h3>
                  <p className="pencil-strike">~~Everyone~~</p>
                  <p className="pencil-correction">Busy young professionals who need a reliable answer after work.</p>
                  <div className="pencil-arrow">↳ much better.</div>
                  <div className="pencil-box">NEXT: PROVE THE OFFER BEFORE WE BUILD THE BRAND.</div>
                </div>
                <div className="pencil-caption"><Sparkles size={14} /> Rough is a feature. Certainty comes later.</div>
              </section>
            )}

            <footer className="workshop-lab-footer">
              <span>{material.label.toUpperCase()} / {material.note.toUpperCase()}</span>
              <span>PHASE 04 · REAL 3D MATERIALS</span>
              <button onClick={() => { stopTour(); setOpen(false); }}>RETURN TO WORKSHOP <ChevronRight size={13} /></button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
