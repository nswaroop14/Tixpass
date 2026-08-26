import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_tVrc3LN1slUP@ep-soft-salad-ad9v8i5p-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
});

async function main() {
  const migrations = [
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS language text`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS screen text`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS notes text`,
  ];

  for (const sql of migrations) {
    console.log(`Running: ${sql}`);
    await pool.query(sql);
    console.log("  OK");
  }

  // Verify
  const cols = await pool.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'events' ORDER BY ordinal_position
  `);
  console.log("\nEvents columns now:", cols.rows.map(r => r.column_name).join(", "));

  await pool.end();
  console.log("\nDone!");
}

main().catch(e => { console.error(e); process.exit(1); });
