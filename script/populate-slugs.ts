import { db } from "../server/db.js";
import { events } from "../shared/schema.js";
import { generateSlug, makeUniqueSlug } from "../shared/slug.js";
import { eq, isNull } from "drizzle-orm";

async function populateSlugs() {
  console.log("Fetching events without slugs...");
  const allEvents = await db.select().from(events).where(isNull(events.slug));
  console.log(`Found ${allEvents.length} events without slugs`);

  // Also get existing slugs to avoid collisions
  const existingSlugs = (await db.select({ slug: events.slug }).from(events))
    .map(e => e.slug)
    .filter(Boolean) as string[];

  for (const event of allEvents) {
    const baseSlug = generateSlug(event.title);
    const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
    existingSlugs.push(uniqueSlug);
    
    await db.update(events)
      .set({ slug: uniqueSlug, updatedAt: new Date() })
      .where(eq(events.id, event.id));
    
    console.log(`Updated event "${event.title}" with slug: ${uniqueSlug}`);
  }

  console.log("Done!");
  process.exit(0);
}

populateSlugs().catch(err => {
  console.error(err);
  process.exit(1);
});