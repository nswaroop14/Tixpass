import { db, pool } from "../server/db.js";
import { bookings, events, organizers, tickets, users } from "../shared/schema.js";
import { and, eq, inArray, isNull, not, sql } from "drizzle-orm";
import { storage } from "../server/storage.js";

async function main() {
  const email = process.argv[2]?.trim() || "";
  if (!email) {
    throw new Error("Usage: tsx script/repair-consistency.ts <organizer-email>");
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) throw new Error(`User not found for email: ${email}`);

  const [org] = await db.select().from(organizers).where(eq(organizers.userId, user.id));
  if (!org) throw new Error(`Organizer not found for user: ${user.id}`);

  const orgEvents = await db.select().from(events).where(eq(events.organizerId, org.id));
  const eventIds = orgEvents.map((e) => e.id);

  const summaryRows: Array<{
    eventId: string;
    title: string;
    deleted: boolean;
    totalCapacity: number;
    remainingCapacity: number;
    activeBookings: number;
    reservedQty: number;
    activeTickets: number;
    orphanTickets: number;
  }> = [];

  for (const ev of orgEvents) {
    const activeBookingRows = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.eventId, ev.id), isNull(bookings.deletedAt)));
    const activeBookingsCount = activeBookingRows.length;
    const reservedQty = activeBookingRows.reduce((sum, b) => sum + (b.ticketQuantity ?? 0), 0);

    const activeTicketRows = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.eventId, ev.id), isNull(tickets.deletedAt)));
    const activeTicketsCount = activeTicketRows.length;

    const bookingIds = new Set(activeBookingRows.map((b) => b.id));
    const orphanTickets = activeTicketRows.filter((t) => !bookingIds.has(t.bookingId));

    summaryRows.push({
      eventId: ev.id,
      title: ev.title,
      deleted: !!ev.deletedAt,
      totalCapacity: ev.totalCapacity ?? 0,
      remainingCapacity: ev.remainingCapacity ?? 0,
      activeBookings: activeBookingsCount,
      reservedQty,
      activeTickets: activeTicketsCount,
      orphanTickets: orphanTickets.length,
    });
  }

  console.log(
    JSON.stringify(
      {
        organizerEmail: email,
        organizerId: org.id,
        events: summaryRows,
      },
      null,
      2
    )
  );

  const nonDeletedEventIds = orgEvents.filter((e) => !e.deletedAt).map((e) => e.id);
  const deletedEventIds = orgEvents.filter((e) => !!e.deletedAt).map((e) => e.id);

  let orphanRemoved = 0;
  if (eventIds.length > 0) {
    const activeBookingIds = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(inArray(bookings.eventId, eventIds), isNull(bookings.deletedAt)));
    const activeBookingIdSet = new Set(activeBookingIds.map((r) => r.id));
    const activeTicketIds = await db
      .select({ id: tickets.id, bookingId: tickets.bookingId })
      .from(tickets)
      .where(and(inArray(tickets.eventId, eventIds), isNull(tickets.deletedAt)));
    const orphanTicketIds = activeTicketIds.filter((t) => !activeBookingIdSet.has(t.bookingId)).map((t) => t.id);
    if (orphanTicketIds.length > 0) {
      await db
        .update(tickets)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(inArray(tickets.id, orphanTicketIds));
      orphanRemoved = orphanTicketIds.length;
    }
  }

  let deletedEventTicketsRemoved = 0;
  let deletedEventBookingsRemoved = 0;
  if (deletedEventIds.length > 0) {
    const now = new Date();
    const res1 = await db
      .update(tickets)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(inArray(tickets.eventId, deletedEventIds), isNull(tickets.deletedAt)));
    deletedEventTicketsRemoved = Number((res1 as any)?.rowCount ?? 0);
    const res2 = await db
      .update(bookings)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(inArray(bookings.eventId, deletedEventIds), isNull(bookings.deletedAt)));
    deletedEventBookingsRemoved = Number((res2 as any)?.rowCount ?? 0);
  }

  let syncedEvents = 0;
  for (const eventId of nonDeletedEventIds) {
    await storage.syncEventAttendees(eventId);
    await storage.reconcileEventCapacity(eventId);
    syncedEvents += 1;
  }

  console.log(
    JSON.stringify(
      {
        orphanTicketsRemoved: orphanRemoved,
        deletedEventTicketsRemoved,
        deletedEventBookingsRemoved,
        syncedEvents,
      },
      null,
      2
    )
  );

  const post = await Promise.all(
    orgEvents.map(async (ev) => {
      const [evRow] = await db.select().from(events).where(eq(events.id, ev.id));
      const activeBookings = await db
        .select()
        .from(bookings)
        .where(and(eq(bookings.eventId, ev.id), isNull(bookings.deletedAt)));
      const activeTickets = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.eventId, ev.id), isNull(tickets.deletedAt)));
      return {
        eventId: ev.id,
        deleted: !!evRow?.deletedAt,
        remainingCapacity: evRow?.remainingCapacity ?? 0,
        activeBookings: activeBookings.length,
        activeTickets: activeTickets.length,
      };
    })
  );

  console.log(
    JSON.stringify(
      {
        postFix: post,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
