import { db } from "./db.js";
import { generateSlug, makeUniqueSlug } from "../shared/slug.js";
import { 
  users,
  User,
  InsertUser,
  organizers,
  Organizer,
  InsertOrganizer,
  events,
  Event,
  InsertEvent,
  bookings,
  Booking,
  InsertBooking,
  tickets,
  Ticket,
  InsertTicket,
  organizerApplications,
  OrganizerApplication,
  InsertOrganizerApplication,
  organizerBankDetails,
  eventBankDetails,
  eventBankAudit,
  resendLogs,
} from "../shared/schema.js";
import { eq, and, isNull, inArray } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Auth & Admin
  getUserByEmail(email: string): Promise<User | undefined>;
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role?: string }): Promise<User>;
  
  getOrganizers(): Promise<{organizer: Organizer, user: User}[]>;
  getOrganizerByUserId(userId: string): Promise<Organizer | undefined>;
  createOrganizer(user: InsertUser, name: string): Promise<{organizer: Organizer, user: User}>;
  updateOrganizerStatus(id: string, status: "active" | "paused"): Promise<Organizer | undefined>;
  deleteOrganizer(id: string): Promise<void>;
  updateUserPassword(userId: string, newPasswordHash: string): Promise<void>;
  updateOrganizerReportEmail(id: string, reportEmail: string): Promise<void>;

  // Events
  getEventsByOrganizer(organizerId: string): Promise<Event[]>;
  listActivePublicEvents(): Promise<{ event: Event; organizerName: string }[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;

  // Bookings
  getBookingsByOrganizer(organizerId: string): Promise<{booking: Booking, event: Event}[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  submitPayment(bookingId: string, transactionReference: string): Promise<Booking | undefined>;
  confirmPayPalPayment(bookingId: string, orderID: string): Promise<Booking | undefined>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  manualTicketCreate(eventId: string, customerData: { name: string, email: string, phone: string, quantity: number }): Promise<Booking>;

  // Tickets
  getTicketsByBooking(bookingId: string): Promise<Ticket[]>;
  getTicket(id: string): Promise<{ticket: Ticket, event: Event} | undefined>;
  getTicketByCode(uniqueTicketCode: string): Promise<Ticket | undefined>;
  getTicketByCodeWithEvent(uniqueTicketCode: string): Promise<{ ticket: Ticket; event: Event } | undefined>;
  createTickets(bookingId: string, eventId: string, quantity: number): Promise<Ticket[]>;
  updateTicketStatus(id: string, status: "unused" | "scanned"): Promise<Ticket | undefined>;
  // Organizer Applications
  createOrganizerApplication(app: InsertOrganizerApplication): Promise<OrganizerApplication>;
  listOrganizerApplications(): Promise<OrganizerApplication[]>;
  approveOrganizerApplication(id: string): Promise<{ organizer: Organizer; app: OrganizerApplication } | undefined>;
  rejectOrganizerApplication(id: string, reason?: string): Promise<OrganizerApplication | undefined>;
  saveOrganizerBankDetails(organizerId: string, details: any): Promise<void>;
  getOrganizerBankDetailsByEvent(eventId: string): Promise<any | undefined>;
  getEventBankDetails(eventId: string): Promise<any | undefined>;
  saveEventBankDetails(eventId: string, organizerId: string, details: any): Promise<void>;
  getOrganizerBankDetails(organizerId: string): Promise<any | undefined>;
  updateOrganizerBankLock(id: string, enabled: boolean): Promise<void>;
  logResend(bookingId: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (err) {
      console.error("Storage Error: getUserByEmail", err);
      throw err;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (err) {
      console.error("Storage Error: getUser", err);
      throw err;
    }
  }

  async createUser(user: InsertUser & { role?: string }): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getOrganizers(): Promise<{organizer: Organizer, user: User}[]> {
    const results = await db
      .select({
        organizer: organizers,
        user: users
      })
      .from(organizers)
      .innerJoin(users, eq(organizers.userId, users.id))
      .where(and(isNull(users.deletedAt), isNull(organizers.deletedAt)));
      
    return results;
  }

  async getOrganizerByUserId(userId: string): Promise<Organizer | undefined> {
    const [org] = await db.select().from(organizers).where(eq(organizers.userId, userId));
    return org;
  }

  async getOrganizerById(id: string): Promise<Organizer | undefined> {
    const [org] = await db.select().from(organizers).where(eq(organizers.id, id));
    return org;
  }

  async createOrganizer(user: InsertUser, name: string): Promise<{organizer: Organizer, user: User}> {
    try {
      // 1. Create user
      const [newUser] = await db.insert(users).values({
        ...user,
        role: 'organizer'
      }).returning();

      // 2. Create organizer
      const [newOrganizer] = await db.insert(organizers).values({
        userId: newUser.id,
        name,
        status: 'active'
      }).returning();

      return { organizer: newOrganizer, user: newUser };
    } catch (err) {
      console.error("Storage error in createOrganizer:", err);
      throw err;
    }
  }

  async updateOrganizerStatus(id: string, status: "active" | "paused"): Promise<Organizer | undefined> {
    const [updated] = await db.update(organizers)
      .set({ status, updatedAt: new Date() })
      .where(eq(organizers.id, id))
      .returning();
    return updated;
  }

  async deleteOrganizer(id: string): Promise<void> {
    // We do a soft delete. 
    // First get the organizer to find the user
    const [org] = await db.select().from(organizers).where(eq(organizers.id, id));
    if (org) {
      const now = new Date();
      await db.update(organizers).set({ deletedAt: now }).where(eq(organizers.id, id));
      await db.update(users).set({ deletedAt: now }).where(eq(users.id, org.userId));
    }
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    await db.update(users).set({ password: newPasswordHash, updatedAt: new Date() }).where(eq(users.id, userId));
  }
  
  async updateOrganizerReportEmail(id: string, reportEmail: string): Promise<void> {
    await db.update(organizers).set({ reportEmail, updatedAt: new Date() }).where(eq(organizers.id, id));
  }

  async createOrganizerApplication(app: InsertOrganizerApplication): Promise<OrganizerApplication> {
    const passwordHash = await bcrypt.hash(app.password, 10);
    const [row] = await db.insert(organizerApplications).values({
      name: app.name,
      email: app.email,
      company: app.company,
      phone: app.phone,
      passwordHash,
      status: 'pending',
    }).returning();
    return row;
  }

  async listOrganizerApplications(): Promise<OrganizerApplication[]> {
    return await db.select().from(organizerApplications).where(eq(organizerApplications.status, 'pending'));
  }

  async approveOrganizerApplication(id: string): Promise<{ organizer: Organizer; app: OrganizerApplication } | undefined> {
    const [appRow] = await db.select().from(organizerApplications).where(eq(organizerApplications.id, id));
    if (!appRow || appRow.status !== 'pending') return undefined;

    const [newUser] = await db.insert(users).values({
      email: appRow.email,
      password: appRow.passwordHash,
      role: 'organizer',
    }).returning();

    const [newOrganizer] = await db.insert(organizers).values({
      userId: newUser.id,
      name: appRow.company,
      status: 'active',
    }).returning();

    await db.update(organizerApplications).set({ status: 'approved', updatedAt: new Date() }).where(eq(organizerApplications.id, id));
    return { organizer: newOrganizer, app: appRow };
  }

  async rejectOrganizerApplication(id: string, reason?: string): Promise<OrganizerApplication | undefined> {
    const [updated] = await db.update(organizerApplications)
      .set({ status: 'rejected', rejectionReason: reason, updatedAt: new Date() })
      .where(eq(organizerApplications.id, id))
      .returning();
    return updated;
  }

  async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
    return await db.select().from(events).where(and(eq(events.organizerId, organizerId), isNull(events.deletedAt)));
  }

  async listActivePublicEvents(): Promise<{ event: Event; organizerName: string }[]> {
    const rows = await db
      .select({ event: events, organizer: organizers })
      .from(events)
      .innerJoin(organizers, eq(events.organizerId, organizers.id))
      .where(and(eq(events.status, "active"), isNull(events.deletedAt)));
    return rows.map(({ event, organizer }) => ({
      event,
      organizerName: organizer.brandName || organizer.name || "TixPass",
    }));
  }

  async saveOrganizerBankDetails(organizerId: string, details: any): Promise<void> {
    const cipher = JSON.stringify(details);
    const existing = await db.select().from(organizerBankDetails).where(eq(organizerBankDetails.organizerId, organizerId));
    if (existing.length > 0) {
      await db.update(organizerBankDetails).set({ ciphertext: cipher, updatedAt: new Date() }).where(eq(organizerBankDetails.organizerId, organizerId));
    } else {
      await db.insert(organizerBankDetails).values({ organizerId, ciphertext: cipher });
    }
  }

  async getOrganizerBankDetails(organizerId: string): Promise<any | undefined> {
    const [row] = await db.select().from(organizerBankDetails).where(eq(organizerBankDetails.organizerId, organizerId));
    if (!row) return undefined;
    try {
      return JSON.parse(row.ciphertext);
    } catch {
      return undefined;
    }
  }

  async getOrganizerBankDetailsByEvent(eventId: string): Promise<any | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return undefined;
    const orgDetails = await this.getOrganizerBankDetails(event.organizerId);
    if (orgDetails) return orgDetails;
    const [row] = await db.select().from(organizerBankDetails).where(eq(organizerBankDetails.organizerId, event.organizerId));
    if (!row) return undefined;
    try {
      return JSON.parse(row.ciphertext);
    } catch {
      return undefined;
    }
  }
  
  async getEventBankDetails(eventId: string): Promise<any | undefined> {
    const [row] = await db.select().from(eventBankDetails).where(eq(eventBankDetails.eventId, eventId));
    if (!row) return undefined;
    try {
      return JSON.parse(row.details);
    } catch {
      return undefined;
    }
  }

  async saveEventBankDetails(eventId: string, organizerId: string, details: any): Promise<void> {
    const current = await db.select().from(eventBankDetails).where(eq(eventBankDetails.eventId, eventId));
    const json = JSON.stringify(details);
    if (current.length > 0) {
      await db.update(eventBankDetails).set({ details: json, updatedAt: new Date() }).where(eq(eventBankDetails.eventId, eventId));
      await db.insert(eventBankAudit).values({
        eventId,
        organizerId,
        oldDetails: current[0].details,
        newDetails: json,
      });
    } else {
      await db.insert(eventBankDetails).values({ eventId, details: json });
      await db.insert(eventBankAudit).values({
        eventId,
        organizerId,
        oldDetails: null as any,
        newDetails: json,
      });
    }
  }

  async updateOrganizerBankLock(id: string, enabled: boolean): Promise<void> {
    await db.update(organizers).set({ bankLocked: enabled, updatedAt: new Date() }).where(eq(organizers.id, id));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.slug, slug));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const baseSlug = generateSlug(event.title);
    const existingEvents = await db.select({ slug: events.slug }).from(events);
    const existingSlugs = existingEvents.map(e => e.slug).filter(Boolean) as string[];
    const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);
    
    const [newEvent] = await db.insert(events).values({
      ...event,
      slug: uniqueSlug,
      remainingCapacity: event.totalCapacity
    }).returning();
    return newEvent;
  }

  async updateEvent(id: string, updateData: Partial<InsertEvent>): Promise<Event | undefined> {
    // If total capacity is being updated, we need to adjust remaining capacity
    if (updateData.totalCapacity !== undefined) {
      const current = await this.getEvent(id);
      if (current) {
        const diff = updateData.totalCapacity - current.totalCapacity;
        const newRemaining = Math.max(0, current.remainingCapacity + diff);
        
        const [updated] = await db.update(events)
          .set({ 
            ...updateData, 
            remainingCapacity: newRemaining,
            updatedAt: new Date() 
          })
          .where(eq(events.id, id))
          .returning();
        return updated;
      }
    }

    const [updated] = await db.update(events)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.update(events).set({ deletedAt: new Date() }).where(eq(events.id, id));
  }

  async getBookingsByOrganizer(organizerId: string): Promise<{booking: Booking, event: Event}[]> {
    return await db
      .select({
        booking: bookings,
        event: events
      })
      .from(bookings)
      .innerJoin(events, eq(bookings.eventId, events.id))
      .where(and(eq(events.organizerId, organizerId), isNull(events.deletedAt), isNull(bookings.deletedAt)))
      .orderBy(bookings.createdAt);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async updateBookingDetails(
    id: string,
    data: { customerName?: string; customerEmail?: string; customerPhone?: string }
  ): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }

  async deleteBooking(id: string): Promise<void> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    if (!booking) return;

    await db.update(bookings).set({ deletedAt: new Date() }).where(eq(bookings.id, id));
    await db.update(tickets).set({ deletedAt: new Date() }).where(eq(tickets.bookingId, id));

    const event = await this.getEvent(booking.eventId);
    if (event) {
      const restored = booking.ticketQuantity ?? 0;
      const nextRemaining = Math.min(event.totalCapacity ?? 0, (event.remainingCapacity ?? 0) + restored);
      await db
        .update(events)
        .set({
          remainingCapacity: nextRemaining,
          updatedAt: new Date(),
        })
        .where(eq(events.id, event.id));
    }
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    // 1. Check capacity
    const event = await this.getEvent(booking.eventId);
    if (!event) throw new Error("Event not found");
    if (event.remainingCapacity < booking.ticketQuantity) {
      throw new Error("Not enough tickets remaining");
    }

    // 2. Decrement remaining capacity
    await db.update(events)
      .set({ remainingCapacity: event.remainingCapacity - booking.ticketQuantity })
      .where(eq(events.id, event.id));

    // 3. Generate unique payment reference (4-char alphanumeric)
    const generatePaymentReference = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let result = "";
      for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let paymentReference = generatePaymentReference();
    // Ensure uniqueness (retry up to 5 times)
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await db.select().from(bookings).where(eq(bookings.paymentReference, paymentReference));
      if (existing.length === 0) break;
      paymentReference = generatePaymentReference();
    }

    // 4. Create booking
    const [newBooking] = await db.insert(bookings).values({
      ...booking,
      status: 'pending_payment',
      paymentReference,
    }).returning();
    return newBooking;
  }

  async submitPayment(bookingId: string, transactionReference: string): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings)
      .set({ 
        transactionReference, 
        status: 'payment_submitted',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    return updated;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }

  async confirmPayPalPayment(bookingId: string, orderID: string): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings)
      .set({ 
        transactionReference: `PAYPAL_${orderID}`, 
        status: 'paid',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    return updated;
  }

  async manualTicketCreate(eventId: string, customerData: { name: string, email: string, phone: string, quantity: number }): Promise<Booking> {
    // 1. Check capacity
    const event = await this.getEvent(eventId);
    if (!event) throw new Error("Event not found");
    if (event.remainingCapacity < customerData.quantity) {
      throw new Error("Not enough tickets remaining");
    }

    // 2. Decrement remaining capacity
    await db.update(events)
      .set({ remainingCapacity: event.remainingCapacity - customerData.quantity })
      .where(eq(events.id, eventId));

    // 3. Create booking (marked as paid)
    const [newBooking] = await db.insert(bookings).values({
      eventId,
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      ticketQuantity: customerData.quantity,
      status: 'paid',
      transactionReference: 'MANUAL_CREATE'
    }).returning();

    // 4. Generate tickets
    await this.createTickets(newBooking.id, eventId, customerData.quantity);

    return newBooking;
  }

  async getTicketsByBooking(bookingId: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.bookingId, bookingId));
  }

  async getTicketsByEvent(eventId: string): Promise<{ ticket: Ticket; booking: Booking }[]> {
    const eventTickets = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.eventId, eventId), isNull(tickets.deletedAt)));
    if (eventTickets.length === 0) return [];

    const bookingIds = Array.from(new Set(eventTickets.map((t) => t.bookingId)));
    const bookingRows = await db
      .select()
      .from(bookings)
      .where(and(inArray(bookings.id, bookingIds), isNull(bookings.deletedAt)));

    const bookingById = new Map(bookingRows.map((b) => [b.id, b]));

    return eventTickets
      .map((t) => {
        const booking = bookingById.get(t.bookingId);
        if (!booking) return null;
        return { ticket: t, booking };
      })
      .filter((x): x is { ticket: Ticket; booking: Booking } => x !== null);
  }

  async getTicket(id: string): Promise<{ticket: Ticket, event: Event} | undefined> {
    const [result] = await db
      .select({
        ticket: tickets,
        event: events
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.id, id));
    return result;
  }

  async getTicketByCode(uniqueTicketCode: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.uniqueTicketCode, uniqueTicketCode));
    return ticket;
  }

  async getTicketByCodeWithEvent(uniqueTicketCode: string): Promise<{ ticket: Ticket; event: Event } | undefined> {
    const [result] = await db
      .select({ ticket: tickets, event: events })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.uniqueTicketCode, uniqueTicketCode));
    return result;
  }

  async createTickets(bookingId: string, eventId: string, quantity: number): Promise<Ticket[]> {
    const newTickets = [];
    for (let i = 0; i < quantity; i++) {
      const code = crypto.randomBytes(8).toString('hex').toUpperCase(); // Example unique code
      
      const [newTicket] = await db.insert(tickets).values({
        bookingId,
        eventId,
        uniqueTicketCode: code,
        qrData: `TICKET:${code}`, // Payload for QR
        scanStatus: 'unused'
      }).returning();
      
      newTickets.push(newTicket);
    }
    return newTickets;
  }

  async updateTicketStatus(id: string, status: "unused" | "scanned"): Promise<Ticket | undefined> {
    const [updated] = await db.update(tickets)
      .set({ scanStatus: status, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updated;
  }

  async syncEventAttendees(eventId: string): Promise<{ removed: number; added: number; normalized: number }> {
    const validBookings = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.eventId, eventId), isNull(bookings.deletedAt)));
    const validBookingIds = new Set(validBookings.map((b) => b.id));

    const existingTickets = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.eventId, eventId), isNull(tickets.deletedAt)));

    const orphanTicketIds = existingTickets.filter((t) => !validBookingIds.has(t.bookingId)).map((t) => t.id);
    let removed = 0;
    if (orphanTicketIds.length > 0) {
      await db
        .update(tickets)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(inArray(tickets.id, orphanTicketIds));
      removed = orphanTicketIds.length;
    }

    let added = 0;
    let normalized = 0;

    for (const booking of validBookings) {
      const currentTickets = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.eventId, eventId), eq(tickets.bookingId, booking.id), isNull(tickets.deletedAt)));
      const currentCount = currentTickets.length;
      const shouldHaveTickets = booking.status === "paid";
      const desiredCount = shouldHaveTickets ? (booking.ticketQuantity ?? 0) : 0;

      if (desiredCount === 0) {
        if (currentCount > 0) {
          await db
            .update(tickets)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(inArray(tickets.id, currentTickets.map((t) => t.id)));
          normalized += currentCount;
        }
      } else if (currentCount < desiredCount) {
        const toCreate = desiredCount - currentCount;
        const created = await this.createTickets(booking.id, eventId, toCreate);
        added += created.length;
      } else if (currentCount > desiredCount) {
        const toRemove = currentCount - desiredCount;
        const idsToDelete = currentTickets.slice(0, toRemove).map((t) => t.id);
        await db
          .update(tickets)
          .set({ deletedAt: new Date(), updatedAt: new Date() })
          .where(inArray(tickets.id, idsToDelete));
        normalized += idsToDelete.length;
      }
    }

    console.log(
      `Attendees sync for event ${eventId}: removed=${removed}, added=${added}, normalized=${normalized}`
    );
    return { removed, added, normalized };
  }

  async reconcileEventCapacity(eventId: string): Promise<{ previous: number; computed: number; total: number }> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error("Event not found");
    const activeBookings = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.eventId, eventId), isNull(bookings.deletedAt)));
    const reserved = activeBookings.reduce((sum, b) => sum + (b.ticketQuantity ?? 0), 0);
    const computedRemaining = Math.max(0, (event.totalCapacity ?? 0) - reserved);
    await db.update(events)
      .set({ remainingCapacity: computedRemaining, updatedAt: new Date() })
      .where(eq(events.id, eventId));
    console.log(`Capacity reconcile for event ${eventId}: previous=${event.remainingCapacity}, computed=${computedRemaining}, total=${event.totalCapacity}, reserved=${reserved}`);
    return { previous: event.remainingCapacity ?? 0, computed: computedRemaining, total: event.totalCapacity ?? 0 };
  }

  async logResend(bookingId: string, userId: string): Promise<void> {
    await db.insert(resendLogs).values({
      bookingId,
      userId,
    });
  }
}

export const storage = new DatabaseStorage();
