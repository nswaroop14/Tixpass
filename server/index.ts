import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";

export const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: false, limit: "20mb" }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = (req as any).path || (req as any).url || "";
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (typeof path === "string" && path.startsWith("/api")) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

let initPromise: Promise<void> | null = null;

export async function initialize() {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    // Run safe migrations: add columns if missing (idempotent)
    if (process.env.DATABASE_URL) {
      try {
        const { pool } = await import("./db.js");
        const migrations = [
          `ALTER TABLE events ADD COLUMN IF NOT EXISTS language text`,
          `ALTER TABLE events ADD COLUMN IF NOT EXISTS screen text`,
          `ALTER TABLE events ADD COLUMN IF NOT EXISTS notes text`,
          `ALTER TABLE organizers ADD COLUMN IF NOT EXISTS brand_name text`,
          `ALTER TABLE organizers ADD COLUMN IF NOT EXISTS logo_url text`,
        ];
        for (const sql of migrations) {
          await pool.query(sql);
        }
        console.log("Schema migrations complete.");
      } catch (e: any) {
        console.error("Migration step failed (non-fatal):", e.message);
      }
    }

    // We pass a dummy server on Vercel as it's not actually used for listening
    const httpServer = createServer(app);
    await registerRoutes(httpServer, app);

    // Global Error Handler
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Internal Server Error:", err);
      if (res.headersSent) {
        return next(err);
      }
      return res.status(status).json({ message });
    });

    // Setup static files or Vite (only for local dev/Render)
    if (!process.env.VERCEL) {
      if (process.env.NODE_ENV === "production") {
        serveStatic(app);
      } else {
        const { setupVite } = await import("./vite.js");
        await setupVite(httpServer, app);
      }
    }
  })();

  return initPromise;
}

if (!process.env.VERCEL) {
  initialize().then(() => {
    const port = parseInt(process.env.PORT || "5000", 10);
    app.listen(port, "0.0.0.0", () => {
      console.log(`serving on port ${port}`);
    });
  }).catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

export default app;
