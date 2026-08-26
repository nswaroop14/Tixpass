import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_tVrc3LN1slUP@ep-soft-salad-ad9v8i5p-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
});

async function main() {
  // Check tables
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name
  `);
  console.log("=== TABLES ===");
  console.log(tables.rows.map(r => r.table_name).join(", "));

  // Check events columns
  const eventCols = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events' ORDER BY ordinal_position
  `);
  console.log("\n=== EVENTS COLUMNS ===");
  console.log(eventCols.rows.map(r => `  ${r.column_name} (${r.data_type})`).join("\n"));

  // Check all events
  const events = await pool.query(`SELECT id, title, venue, event_date, status, deleted_at, created_at FROM events ORDER BY created_at`);
  console.log("\n=== ALL EVENTS ===");
  if (events.rows.length === 0) {
    console.log("  (none)");
  } else {
    events.rows.forEach(r => console.log(`  ${r.title} | ${r.venue} | date: ${r.event_date} | status: ${r.status} | deleted: ${r.deleted_at} | created: ${r.created_at}`));
  }

  // Check bookings
  const bookings = await pool.query(`SELECT id, event_id, customer_name, customer_email, status, created_at FROM bookings ORDER BY created_at`);
  console.log("\n=== ALL BOOKINGS ===");
  if (bookings.rows.length === 0) {
    console.log("  (none)");
  } else {
    bookings.rows.forEach(r => console.log(`  ${r.customer_name} (${r.customer_email}) | event: ${r.event_id} | status: ${r.status} | created: ${r.created_at}`));
  }

  // Check organizers
  const orgs = await pool.query(`SELECT id, name, status, user_id FROM organizers ORDER BY created_at`);
  console.log("\n=== ORGANIZERS ===");
  if (orgs.rows.length === 0) {
    console.log("  (none)");
  } else {
    orgs.rows.forEach(r => console.log(`  ${r.name} | status: ${r.status} | user: ${r.user_id}`));
  }

  // Check users
  const users = await pool.query(`SELECT id, email, role FROM users ORDER BY created_at`);
  console.log("\n=== USERS ===");
  users.rows.forEach(r => console.log(`  ${r.email} (${r.role})`));

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
