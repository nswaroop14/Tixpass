import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../shared/schema.js";
import ws from "ws";

// On Vercel, we need to provide a WebSocket constructor to use the Pool
if (process.env.VERCEL) {
  neonConfig.webSocketConstructor = ws;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is missing. Please set it in your environment variables.");
}

// Pool is the standard and most robust way to use Neon with Drizzle.
// On Vercel, it will use WebSockets for communication.
export const pool = new Pool({ connectionString: connectionString || "" });

export const db = drizzle(pool, { schema });
