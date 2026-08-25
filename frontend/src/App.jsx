import { useState } from "react";
import StartItLanding from "./start-it-landing.jsx";
import StartItDemo from "./start-it-demo.jsx";

export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "app"
  const [initialSegment, setInitialSegment] = useState(null);
  const [initialMode, setInitialMode] = useState("signup"); // "signup" | "login"

  if (view === "app") {
    return <StartItDemo initialSegment={initialSegment} initialMode={initialMode} onExit={() => setView("landing")} />;
  }

  return (
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
}
