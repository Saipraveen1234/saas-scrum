import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client } from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL missing");
  process.exit(1);
}
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
dbClient.connect().catch((err) => console.error("DB Error:", err));

// AI Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- ROUTES ---

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK" });
});

// 1. GET STANDUPS
app.get("/api/standups", async (req: Request, res: Response) => {
  try {
    const result = await dbClient.query(
      "SELECT * FROM standups ORDER BY created_at DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// 2. POST STANDUP
app.post("/api/standups", async (req: Request, res: Response) => {
  try {
    const { user_name, yesterday, today, blockers } = req.body;
    const result = await dbClient.query(
      `
      INSERT INTO standups (user_name, yesterday, today, blockers)
      VALUES ($1, $2, $3, $4) RETURNING *
    `,
      [user_name, yesterday, today, blockers]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Save failed" });
  }
});

// 3. GENERATE AI SUMMARY (The New Feature)
app.post("/api/summary", async (req: Request, res: Response) => {
  try {
    // A. Get today's data
    const result = await dbClient.query(
      "SELECT * FROM standups ORDER BY created_at DESC LIMIT 20"
    );
    const updates = result.rows;

    if (updates.length === 0)
      return res.json({ summary: "No updates available to summarize." });

    // B. Construct the Prompt
    const updatesText = updates
      .map(
        (u: any) =>
          `- ${u.user_name}: Done: "${u.yesterday}", Doing: "${u.today}", Blockers: "${u.blockers}"`
      )
      .join("\n");

    const prompt = `
      You are an expert Scrum Master. Summarize these daily updates for the Team Lead.
      Identify: 1) Critical Blockers, 2) Key Progress, 3) Risk Level (Low/High).
      Keep it concise.
      
      Updates:
      ${updatesText}
    `;

    // C. Call Gemini
    const aiResult = await model.generateContent(prompt);
    const summary = aiResult.response.text();

    // D. Save to DB (Optional, but good for history)
    // await dbClient.query('INSERT INTO ai_summaries (summary_text, date_str) VALUES ($1, $2)', [summary, new Date().toDateString()]);

    res.json({ summary });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
