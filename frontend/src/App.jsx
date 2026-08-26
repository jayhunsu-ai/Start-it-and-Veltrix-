import { useState } from "react";
import StartItLanding from "./start-it-landing.jsx";
import StartItDemo from "./start-it-demo.jsx";
import WorkshopChrome from "./WorkshopChrome.jsx";

export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "app"
  const [initialSegment, setInitialSegment] = useState(null);
  const [initialMode, setInitialMode] = useState("signup"); // "signup" | "login"

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
    <div className="startit-workshop-app">
      <WorkshopChrome />
      <div className="startit-workshop-content">{content}</div>
    </div>
  );
}
