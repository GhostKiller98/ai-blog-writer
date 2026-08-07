import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { generateArticle } from "./src/generator.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: "64kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.get("/api/health", function (_req, res) { res.json({ ok: true, mode: process.env.OPENAI_API_KEY ? "openai" : "demo" }); });
app.post("/api/generate", async function (req, res) {
  const body = req.body || {};
  const topic = body.topic;
  if (!topic || typeof topic !== "string" || !topic.trim()) return res.status(400).json({ error: "Please provide a topic." });
  if (topic.trim().length > 500) return res.status(400).json({ error: "Topic is too long (max 500 characters)." });
  try {
    const result = await generateArticle({ topic: topic.trim(), tone: body.tone, toneLabel: body.toneLabel, audience: body.audience, audienceLabel: body.audienceLabel, length: body.length, lengthLabel: body.lengthLabel });
    res.json(result);
  } catch (err) { console.error("generate error:", err); res.status(502).json({ error: "The article could not be generated. Please try again." }); }
});
app.listen(PORT, function () { console.log("AI Blog Writer running at http://localhost:" + PORT); });