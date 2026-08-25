require("dotenv").config();
const express = require("express");
const cors = require("cors");
const toolsRouter = require("./routes/tools");
const toolsExtraRouter = require("./routes/tools_extra");
const integrationsRouter = require("./routes/integrations");
const analyticsRouter = require("./routes/analytics");

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
app.use(express.json({ limit: "5mb" })); // contracts can be long

app.use("/api/tools", toolsRouter);
app.use("/api/tools", toolsExtraRouter); // same mount point, different route names — tools 5-9
app.use("/api/integrations", integrationsRouter);
app.use("/api/analytics", analyticsRouter);

app.get("/api/health", (_req, res) => {
  const configured = [
    "GROQ_API_KEY", "GEMINI_API_KEY", "NVIDIA_NIM_API_KEY", "OPENROUTER_API_KEY",
    "POLLINATIONS_API_KEY", "CALCOM_API_KEY", "BUFFER_API_KEY", "DOCUMENSO_API_KEY",
    "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "POSTHOG_API_KEY",
  ].filter((k) => !!process.env[k]);
  res.json({ ok: true, providers_configured: configured });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Start-It backend running on :${PORT}`));
