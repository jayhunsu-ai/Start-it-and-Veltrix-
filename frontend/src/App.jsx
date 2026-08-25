import { useState } from "react";
import StartItLanding from "./start-it-landing.jsx";
import StartItDemo from "./start-it-demo.jsx";

export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "app"
  const [initialSegment, setInitialSegment] = useState(null);

  if (view === "app") {
    return <StartItDemo initialSegment={initialSegment} onExit={() => setView("landing")} />;
  }

  return (
    <StartItLanding
      onStart={(segmentId) => {
        setInitialSegment(segmentId || null);
        setView("app");
      }}
    />
  );
}
