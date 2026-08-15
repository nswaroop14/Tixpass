import { execSync } from "child_process";

if (!process.env.DATABASE_URL) {
  console.log("No DATABASE_URL found, skipping schema push.");
  process.exit(0);
}

try {
  console.log("Pushing schema to database...");
  execSync("npx drizzle-kit push --force", { stdio: "inherit", timeout: 60000 });
  console.log("Schema push complete.");
} catch (e: any) {
  console.error("Schema push failed (non-fatal):", e.message);
  process.exit(0);
}
