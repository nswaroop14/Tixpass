import { Pool } from "pg";
const p = new Pool({ connectionString: "postgresql://neondb_owner:npg_tVrc3LN1slUP@ep-soft-salad-ad9v8i5p-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" });
await p.query("ALTER TABLE organizers ADD COLUMN IF NOT EXISTS brand_name text");
await p.query("ALTER TABLE organizers ADD COLUMN IF NOT EXISTS logo_url text");
console.log("Done");
const r = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'organizers' ORDER BY ordinal_position");
console.log(r.rows.map((x: any) => x.column_name).join(", "));
await p.end();
