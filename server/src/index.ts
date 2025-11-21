import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client } from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClickUpService } from "./clickup.service";

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

const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const clickupService = new ClickUpService();

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
    res.status(500).json({ error: "AI generation failed", details: error instanceof Error ? error.message : String(error) });
  }
});


// 4. GET BACKLOG (ClickUp)
app.get("/api/backlog", async (req: Request, res: Response) => {
  try {
    const listId = process.env.CLICKUP_LIST_ID;
    if (!listId) {
      return res.status(400).json({ error: "CLICKUP_LIST_ID not configured" });
    }
    const tasks = await clickupService.getTasks(listId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch backlog" });
  }
});

// 5. GROOM TASK (AI)
app.post("/api/groom", async (req: Request, res: Response) => {
  try {
    const { task } = req.body;
    if (!task) return res.status(400).json({ error: "Task data required" });

    const prompt = `
      You are an expert Agile Coach. Review this backlog task and suggest improvements.
      
      Task Name: ${task.name}
      Description: ${task.description || "No description provided."}
      
      Provide:
      1. Better Title (if needed)
      2. Improved Description (clearer, user story format)
      3. Acceptance Criteria (list)
      4. Estimated Story Points (Fibonacci: 1, 2, 3, 5, 8...)
      
      Output JSON format: { "title": "...", "description": "...", "acceptance_criteria": ["..."], "points": 3 }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Cleanup JSON if needed (Gemini sometimes adds markdown blocks)
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();

    res.json(JSON.parse(jsonStr));
  } catch (error) {
    console.error("Grooming Error:", error);
    res.status(500).json({ error: "Grooming failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
