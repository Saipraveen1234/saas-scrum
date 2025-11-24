import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client } from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClickUpService } from "./clickup.service";
import { authMiddleware, AuthRequest } from "./middleware/auth.middleware";

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
const clickupService = new ClickUpService();

// --- ROUTES ---

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK" });
});

// 1. GET STANDUPS
app.get("/api/standups", authMiddleware(dbClient), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let query = "SELECT * FROM standups ORDER BY created_at DESC LIMIT 50";
    let params: any[] = [];

    if (user.role === 'employee') {
      query = "SELECT * FROM standups WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50";
      params = [user.id];
    }

    const result = await dbClient.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// 2. POST STANDUP
app.post("/api/standups", authMiddleware(dbClient), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Ensure employees can only post for themselves (though the UI might send user_name, we should trust the token more or validate)
    // For now, we'll trust the token for user_id, and maybe keep user_name from body or fetch it?
    // The current DB has user_name. We should probably fetch it from user_roles or just use what's sent but ensure user_id is set.

    const { user_name, yesterday, today, blockers } = req.body;

    const result = await dbClient.query(
      `
      INSERT INTO standups (user_name, yesterday, today, blockers, user_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `,
      [user_name, yesterday, today, blockers, user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Save failed" });
  }
});

// --- TEAMS ROUTES ---

// 6. GET TEAMS
app.get("/api/teams", authMiddleware(dbClient), async (req: Request, res: Response) => {
  try {
    const result = await dbClient.query("SELECT * FROM teams ORDER BY name");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Fetch teams failed" });
  }
});

// 7. CREATE TEAM
app.post("/api/teams", authMiddleware(dbClient), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    const { name } = req.body;
    const result = await dbClient.query(
      "INSERT INTO teams (name) VALUES ($1) RETURNING *",
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Create team failed" });
  }
});

// 8. GET USERS (for admin to assign teams)
app.get("/api/users", authMiddleware(dbClient), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    const result = await dbClient.query(`
      SELECT ur.user_id, ur.email, ur.name, ur.role, ur.team_id, t.name as team_name
      FROM user_roles ur
      LEFT JOIN teams t ON ur.team_id = t.id
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Fetch users failed" });
  }
});

// 8.4 GET USER COUNT
app.get("/api/users/count", authMiddleware(dbClient), async (req: Request, res: Response) => {
  try {
    const result = await dbClient.query("SELECT COUNT(*) FROM user_roles WHERE role = 'employee'");
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    res.status(500).json({ error: "Fetch user count failed" });
  }
});

// 8.5 GET CURRENT USER
app.get("/api/users/me", authMiddleware(dbClient), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Fetch me failed" });
  }
});

// 9. ASSIGN USER TO TEAM
app.put("/api/users/:id/team", authMiddleware(dbClient), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    const { team_id } = req.body;
    const targetUserId = req.params.id;

    await dbClient.query(
      "UPDATE user_roles SET team_id = $1 WHERE user_id = $2",
      [team_id, targetUserId]
    );
    res.json({ status: "Updated" });
  } catch (error) {
    res.status(500).json({ error: "Update user team failed" });
  }
});

// 3. GENERATE AI SUMMARY (Updated for Teams)
app.post("/api/summary", authMiddleware(dbClient), async (req: Request, res: Response) => {
  try {
    // A. Get today's data with team info
    const result = await dbClient.query(`
      SELECT s.*, t.name as team_name 
      FROM standups s
      LEFT JOIN user_roles ur ON s.user_id = ur.user_id
      LEFT JOIN teams t ON ur.team_id = t.id
      ORDER BY t.name, s.created_at DESC 
      LIMIT 50
    `);
    const updates = result.rows;

    if (updates.length === 0)
      return res.json({ summary: "No updates available to summarize." });

    // B. Group by Team
    const updatesByTeam: Record<string, any[]> = {};
    updates.forEach((u: any) => {
      const team = u.team_name || 'Unassigned';
      if (!updatesByTeam[team]) updatesByTeam[team] = [];
      updatesByTeam[team].push(u);
    });

    // C. Construct Prompt
    let updatesText = "";
    for (const [team, teamUpdates] of Object.entries(updatesByTeam)) {
      updatesText += `\nTeam: ${team}\n`;
      updatesText += teamUpdates.map(
        (u: any) => `- ${u.user_name}: Done: "${u.yesterday}", Doing: "${u.today}", Blockers: "${u.blockers}"`
      ).join("\n");
    }

    const prompt = `
      You are an expert Scrum Master. Summarize these daily updates for the Team Lead, grouped by Project Team.
      
      For each Team:
      1. **Team Name**
      2. **Critical Blockers**
      3. **Key Progress**
      4. **Risk Level** (Low/High)

      Updates:
      ${updatesText}
    `;

    // D. Call Gemini
    const aiResult = await model.generateContent(prompt);
    const summary = aiResult.response.text();

    res.json({ summary });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// DEBUG ROUTE
app.get("/api/debug-user", async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });

    const result = await dbClient.query("SELECT * FROM user_roles WHERE email = $1", [email]);
    res.json({
      count: result.rowCount,
      rows: result.rows,
      db_url_masked: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not Set'
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
