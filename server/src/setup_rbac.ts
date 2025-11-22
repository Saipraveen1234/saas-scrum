import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL missing");
  process.exit(1);
}

const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setupRBAC() {
  try {
    await dbClient.connect();
    console.log("Connected to DB");

    // 1. Create user_roles table
    console.log("Creating user_roles table...");
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id UUID PRIMARY KEY,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'employee')),
        email VARCHAR(255) NOT NULL
      );
    `);
    console.log("user_roles table created.");

    // 2. Add user_id to standups table
    console.log("Altering standups table...");
    // Check if column exists first to avoid error
    const checkColumn = await dbClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='standups' AND column_name='user_id';
    `);

    if (checkColumn.rows.length === 0) {
        await dbClient.query(`
            ALTER TABLE standups
            ADD COLUMN user_id UUID;
        `);
        console.log("Added user_id column to standups.");
    } else {
        console.log("user_id column already exists in standups.");
    }

    console.log("RBAC Setup Complete.");
  } catch (error) {
    console.error("Setup Failed:", error);
  } finally {
    await dbClient.end();
  }
}

setupRBAC();
