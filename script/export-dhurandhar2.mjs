import { config } from "dotenv";
import { resolve, join } from "path";
import { fileURLToPath } from "url";

// Load .env from project root
const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "..", ".env") });

import { Pool } from "pg";
import * as XLSX from "xlsx";
import { mkdirSync, existsSync } from "fs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set. Please set it in your environment.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function main() {
  console.log("Connecting to database...");

  const client = await pool.connect();
  try {
    // Find events matching "Dhurandhar 2"
    const eventsResult = await client.query(
      `SELECT id, title FROM events WHERE title ILIKE '%dhurandhar 2%' AND deleted_at IS NULL`
    );

    if (eventsResult.rows.length === 0) {
      console.error("No events found matching 'Dhurandhar 2'");
      process.exit(1);
    }

    console.log("Found events:");
    eventsResult.rows.forEach((e) => console.log(`  - ${e.title} (${e.id})`));

    const eventIds = eventsResult.rows.map((e) => e.id);

    // Fetch bookings for these events
    const bookingsResult = await client.query(
      `SELECT
         b.customer_name,
         e.title AS event,
         b.ticket_quantity AS quantity,
         b.customer_phone AS contact_number,
         b.customer_email AS email_address
       FROM bookings b
       INNER JOIN events e ON b.event_id = e.id
       WHERE b.event_id = ANY($1)
         AND b.deleted_at IS NULL
       ORDER BY e.title, b.created_at`,
      [eventIds]
    );

    console.log(`Found ${bookingsResult.rows.length} bookings.`);

    if (bookingsResult.rows.length === 0) {
      console.log("No bookings to export.");
      process.exit(0);
    }

    // Build workbook
    const ws = XLSX.utils.json_to_sheet(bookingsResult.rows, {
      header: [
        "customer_name",
        "event",
        "quantity",
        "contact_number",
        "email_address",
      ],
    });

    // Rename headers
    XLSX.utils.sheet_add_aoa(
      ws,
      [["Customer Name", "Event", "Quantity", "Contact Number", "Email Address"]],
      { origin: "A1" }
    );

    // Set column widths
    ws["!cols"] = [
      { wch: 30 }, // Customer Name
      { wch: 35 }, // Event
      { wch: 10 }, // Quantity
      { wch: 18 }, // Contact Number
      { wch: 30 }, // Email Address
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dhurandhar 2 Bookings");

    // Create output directory
    const outputDir = join(process.cwd(), "exports");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = join(outputDir, "dhurandhar2_bookings.xlsx");
    XLSX.writeFile(wb, outputPath);

    console.log(`\nExcel file saved to: ${outputPath}`);
    console.log(`Total bookings exported: ${bookingsResult.rows.length}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
