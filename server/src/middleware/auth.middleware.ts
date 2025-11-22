import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// DB Client for role check (reusing the one from index.ts would be better, but for now creating a new pool or passing it is needed)
// To avoid circular deps or complex setup, let's just create a new client instance here or better, export the dbClient from index.ts?
// Exporting from index.ts might be circular if index imports this.
// Let's just create a pool here for simplicity or pass it in.
// Actually, for middleware, we usually attach the db client to the req or import a singleton db module.
// Let's create a simple db module `server/src/db.ts` to share the client.

// But first, let's just implement the token verification.

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'employee';
  };
}

export const authMiddleware = (dbClient: Client) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch role from DB
    const roleResult = await dbClient.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
    let role: 'admin' | 'employee' = 'employee'; // Default

    console.log(`[AuthMiddleware] User ID: ${user.id}`);
    
    if (roleResult.rows.length > 0) {
      role = roleResult.rows[0].role;
      console.log(`[AuthMiddleware] Role found in DB: ${role}`);
    } else {
      console.log(`[AuthMiddleware] No role found in DB, defaulting to: ${role}`);
    }

    (req as AuthRequest).user = {
      id: user.id,
      email: user.email || '',
      role: role
    };

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
