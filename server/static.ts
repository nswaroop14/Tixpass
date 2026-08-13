import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In production (bundled), __dirname is /dist.
  // In development (tsx), __dirname is /server.
  // We want to point to /dist/public
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  if (!fs.existsSync(distPath)) {
    console.error(`Build directory NOT FOUND: ${distPath}`);
    return; // Don't throw, just log and continue
  }

  app.use(express.static(distPath));

  // Catch-all route for SPA
  app.get("/{*path}", (req, res, next) => {
    // If it's an API route, skip
    const p: string = (req as any).path || (req as any).url || "";
    if (typeof p === "string" && p.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
