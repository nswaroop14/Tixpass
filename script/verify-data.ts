import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_tVrc3LN1slUP@ep-soft-salad-ad9v8i5p-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
});

async function main() {
  // Non-deleted events with organizer info
  const events = await pool.query(`
    SELECT e.id, e.title, e.venue, e.event_date, e.status, e.organizer_id, o.name as org_name,
           (SELECT count(*) FROM bookings b WHERE b.event_id = e.id AND b.deleted_at IS NULL) as booking_count
    FROM events e
    JOIN organizers o ON e.organizer_id = o.id
    WHERE e.deleted_at IS NULL
    ORDER BY e.event_date
  `);

  console.log("=== NON-DELETED EVENTS (visible to organizers) ===");
  events.rows.forEach(r => {
    console.log(`  "${r.title}" @ ${r.venue} | ${r.event_date} | status: ${r.status} | org: ${r.org_name} | bookings: ${r.booking_count}`);
  });

  // Non-deleted bookings
  const bookings = await pool.query(`
    SELECT count(*) as total, count(*) FILTER (WHERE status = 'paid') as paid,
           count(*) FILTER (WHERE status = 'pending_payment') as pending,
           count(*) FILTER (WHERE status = 'payment_submitted') as submitted
    FROM bookings WHERE deleted_at IS NULL
  `);
  const b = bookings.rows[0];
  console.log(`\n=== BOOKINGS SUMMARY (non-deleted) ===`);
  console.log(`  Total: ${b.total} | Paid: ${b.paid} | Pending Payment: ${b.pending} | Submitted: ${b.submitted}`);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
