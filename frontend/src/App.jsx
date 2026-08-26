import { useState } from "react";
import StartItLanding from "./start-it-landing.jsx";
import StartItDemo from "./start-it-demo.jsx";
import WorkshopChrome from "./WorkshopChrome.jsx";
import WorkshopLab from "./WorkshopLab.jsx";
import "./phase2.css";

export default function App() {
  const [view, setView] = useState("landing");
  const [initialSegment, setInitialSegment] = useState(null);
  const [initialMode, setInitialMode] = useState("signup");
  const [material, setMaterial] = useState("denim");

  const content =
    view === "app" ? (
      <StartItDemo initialSegment={initialSegment} initialMode={initialMode} onExit={() => setView("landing")} />
    ) : (
      <StartItLanding
        onStart={(segmentId) => {
          setInitialSegment(segmentId || null);
          setInitialMode("signup");
          setView("app");
        }}
        onLogIn={() => {
          setInitialMode("login");
          setView("app");
        }}
      />
    );

  return (
    <div className="startit-workshop-app" data-material={material}>
      <WorkshopChrome />
      <WorkshopLab mode={material} onModeChange={setMaterial} />
      <div className="startit-workshop-content">{content}</div>
    </div>
  );
}
