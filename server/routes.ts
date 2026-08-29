import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { api } from "../shared/routes.js";
import { sendTicketsEmail, sendActivationEmail, sendPasswordResetEmail, sendAdminAlert, sendEventBankUpdateEmail, generateTicketEmailHtml, generateTicketPdfHtml, generateTicketWhatsAppHtml } from "./email.js";
import { sendDailyBookingsReportEmail } from "./email.js";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Switched to bcryptjs for serverless compatibility
import QRCode from "qrcode";
import { db } from "./db.js";
import { organizers } from "../shared/schema.js";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "super-secret-fallback";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const syncFailuresByEvent: Map<string, number> = new Map();
  async function getOrganizerBranding(eventId: string): Promise<{ name: string }> {
    const event = await storage.getEvent(eventId);
    if (!event) return { name: "TixPass" };
    const org = await storage.getOrganizerById(event.organizerId);
    return { name: org?.brandName || org?.name || "TixPass" };
  }
  async function syncWithRetry(eventId: string, retries = 2) {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const result = await storage.syncEventAttendees(eventId);
        await storage.reconcileEventCapacity(eventId);
        return result;
      } catch (err) {
        attempt += 1;
        console.error(`Sync attempt ${attempt} failed for event ${eventId}:`, err);
        if (attempt > retries) {
          const prev = syncFailuresByEvent.get(eventId) || 0;
          const next = prev + 1;
          syncFailuresByEvent.set(eventId, next);
          if (next >= 3) {
            const msg = `Sync failures exceeded threshold for event ${eventId}: count=${next}`;
            await sendAdminAlert("Attendees Sync Failure", msg).catch(() => {});
          }
          throw err;
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  // Seed Admin User
  const seedDatabase = async () => {
    try {
      console.log('Checking for admin user...');
      // We wrap this in another try/catch to ensure individual query failures don't stop the flow
      const existingAdmin = await storage.getUserByEmail('admin@test.com').catch(e => {
        console.error('Error fetching admin user during seed:', e);
        return undefined;
      });

      if (!existingAdmin) {
        console.log('Admin user not found, seeding...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        try {
          await storage.createUser({
            email: 'admin@test.com',
            password: hashedPassword,
            role: 'admin'
          });
          console.log('Seeded admin user: admin@test.com / admin123');
        } catch (e) {
          console.error('Error creating admin user during seed:', e);
        }
      } else {
        console.log('Admin user already exists.');
      }
    } catch (err) {
      console.error('Database error during seeding (skipping):', err);
    }
  };
  
  // Non-blocking seeding
  seedDatabase().catch(err => console.error("Critical seeding error:", err));

  // Authentication Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') return res.sendStatus(403);
    next();
  };

  const requireOrganizer = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'organizer') return res.sendStatus(403);
    next();
  };

  // --- AUTH ---
  const LOGIN_PATH = api?.auth?.login?.path ?? "/api/auth/login";
  const LOGIN_METHOD = api?.auth?.login?.method ?? "POST";
  if (LOGIN_METHOD !== "POST") {
    console.warn("Unexpected login method from shared routes, defaulting to POST.");
  }
  app.post(LOGIN_PATH, async (req, res) => {
    try {
      console.log('Login attempt for:', req.body.email);
      const input = api.auth.login.input.parse(req.body);
      
      console.log('Querying user by email...');
      const user = await storage.getUserByEmail(input.email);
      
      if (!user) {
        console.log('User not found:', input.email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log('User found, comparing password...');
      const validPassword = await bcrypt.compare(input.password, user.password);
      if (!validPassword) {
        console.log('Invalid password for user:', input.email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log('Password valid, signing JWT...');
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      let organizer;
      if (user.role === 'organizer') {
        console.log('Fetching organizer details for userId:', user.id);
        organizer = await storage.getOrganizerByUserId(user.id);
      }

      console.log('Login successful for:', input.email);
      res.status(200).json({ token, user, organizer });
    } catch (err) {
      console.error('Login Error:', err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ 
          message: "Internal server error", 
          details: err instanceof Error ? err.message : String(err) 
        });
      }
    }
  });

  const ME_PATH = api?.auth?.me?.path ?? "/api/auth/me";
  const ME_METHOD = api?.auth?.me?.method ?? "GET";
  if (ME_METHOD !== "GET") {
    console.warn("Unexpected auth.me method from shared routes, defaulting to GET.");
  }
  app.get(ME_PATH, authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(401).json({ message: "User not found" });

      let organizer;
      if (user.role === 'organizer') {
        organizer = await storage.getOrganizerByUserId(user.id);
      }
      res.status(200).json({ user, organizer });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });


  // --- ADMIN ROUTES ---
  app.get(api.admin.organizers.list.path, authenticateToken, requireAdmin, async (req, res) => {
    const organizers = await storage.getOrganizers();
    // Filter out deleted ones based on user deletedAt or organizer deletedAt
    const activeOrganizers = organizers.filter(o => !o.organizer.deletedAt && !o.user.deletedAt);
    res.status(200).json(activeOrganizers);
  });

  app.get(api.admin.organizerApplications.list.path, authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const apps = await storage.listOrganizerApplications();
      res.status(200).json(apps);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.admin.organizerApplications.approve.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const result = await storage.approveOrganizerApplication(req.params.id);
      if (!result) return res.status(404).json({ message: "Application not found" });
      await sendActivationEmail(result.app.email, result.app.name || result.app.company);
      res.status(200).json(result.organizer);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.admin.organizerApplications.reject.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.organizerApplications.reject.input.parse(req.body);
      const updated = await storage.rejectOrganizerApplication(req.params.id, input.reason);
      if (!updated) return res.status(404).json({ message: "Application not found" });
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.admin.organizers.create.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.organizers.create.input.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      const result = await storage.createOrganizer({
        email: input.email,
        password: hashedPassword,
      }, input.name);

      res.status(201).json(result.organizer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.admin.organizers.resetPassword.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.organizers.resetPassword.input.parse(req.body);
      const organizer = await storage.getOrganizerByUserId(req.params.id);
      // Note: reset is by organizer id; fetch organizer, then its user
      // If organizer not found, try interpret param as organizer id and load user via organizer record
      const orgId = req.params.id;
      const orgRecord = await db.select().from(organizers).where(eq(organizers.id, orgId));
      if (!orgRecord || orgRecord.length === 0) {
        return res.status(404).json({ message: "Organizer not found" });
      }
      const userId = orgRecord[0].userId;
      const hashed = await bcrypt.hash(input.newPassword, 10);
      await storage.updateUserPassword(userId, hashed);
      const user = await storage.getUser(userId);
      if (user) {
        await sendPasswordResetEmail(user.email, orgRecord[0].name, input.newPassword);
      }
      res.status(200).json({ message: "Password reset successful" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  app.patch(api.admin.organizers.updateStatus.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.organizers.updateStatus.input.parse(req.body);
      const updated = await storage.updateOrganizerStatus(req.params.id, input.status);
      if (!updated) {
        return res.status(404).json({ message: "Organizer not found" });
      }
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.admin.organizers.delete.path, authenticateToken, requireAdmin, async (req, res) => {
    await storage.deleteOrganizer(req.params.id);
    res.status(204).send();
  });

  {
    const ADMIN_REPAIR_ORG_PATH = api?.admin?.maintenance?.repairOrganizer?.path ?? "/api/admin/maintenance/repair-organizer";
    const ADMIN_REPAIR_ORG_SCHEMA = api?.admin?.maintenance?.repairOrganizer?.input ?? z.object({
      organizerEmail: z.string().email(),
    });
    app.post(ADMIN_REPAIR_ORG_PATH, authenticateToken, requireAdmin, async (req, res) => {
      try {
        const input = ADMIN_REPAIR_ORG_SCHEMA.parse(req.body);
        const user = await storage.getUserByEmail(input.organizerEmail);
        if (!user) return res.status(404).json({ message: "User not found" });
        const org = await storage.getOrganizerByUserId(user.id);
        if (!org) return res.status(404).json({ message: "Organizer not found" });
        const orgEvents = await storage.getEventsByOrganizer(org.id);
        const results = [];
        for (const ev of orgEvents.filter(e => !e.deletedAt)) {
          const sync = await storage.syncEventAttendees(ev.id);
          const cap = await storage.reconcileEventCapacity(ev.id);
          results.push({ eventId: ev.id, title: ev.title, sync, capacity: cap });
        }
        res.status(200).json({ message: "Repair complete", organizerId: org.id, results });
      } catch (err) {
        if (err instanceof z.ZodError) {
          res.status(400).json({ message: err.errors[0].message });
        } else {
          res.status(500).json({ message: "Internal server error" });
        }
      }
    });
  }


  // --- ORGANIZER ROUTES ---
  app.get(api.organizer.events.list.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    res.setHeader("Cache-Control", "no-store");
    const org = await storage.getOrganizerByUserId(req.user.id);
    if (!org) return res.status(404).json({ message: "Organizer not found" });

    const events = await storage.getEventsByOrganizer(org.id);
    const activeEvents = events.filter(e => !e.deletedAt);
    res.status(200).json(activeEvents);
  });

  {
    const ORG_REPAIR_PATH = api?.organizer?.maintenance?.repair?.path ?? "/api/organizer/maintenance/repair";
    app.post(ORG_REPAIR_PATH, authenticateToken, requireOrganizer, async (req: any, res) => {
      try {
        const org = await storage.getOrganizerByUserId(req.user.id);
        if (!org) return res.status(404).json({ message: "Organizer not found" });
        const orgEvents = await storage.getEventsByOrganizer(org.id);
        const results = [];
        for (const ev of orgEvents.filter(e => !e.deletedAt)) {
          const sync = await storage.syncEventAttendees(ev.id);
          const cap = await storage.reconcileEventCapacity(ev.id);
          results.push({ eventId: ev.id, title: ev.title, sync, capacity: cap });
        }
        res.status(200).json({ message: "Repair complete", organizerId: org.id, results });
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    });
  }

  const ORG_EVENTS_BANK_GET_PATH = api?.organizer?.events?.bank?.get?.path ?? "/api/organizer/events/:id/bank";
  const ORG_EVENTS_BANK_UPDATE_PATH = api?.organizer?.events?.bank?.update?.path ?? "/api/organizer/events/:id/bank";
  const ORG_EVENTS_BANK_UPDATE_SCHEMA = api?.organizer?.events?.bank?.update?.input ?? z.object({
    bankName: z.string().optional(),
    accountHolder: z.string().optional(),
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    accountType: z.string().optional(),
    paymentMethod: z.enum(['bank','link','paypal','revolut']).optional(),
    paymentLink: z.string().optional(),
    paypalClientId: z.string().optional(),
    paymentNumber: z.string().optional(),
    referenceCode: z.string().optional(),
  });

  app.get(ORG_EVENTS_BANK_GET_PATH, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const org = await storage.getOrganizerByUserId(req.user.id);
      const event = await storage.getEvent(req.params.id);
      if (!org || !event || event.organizerId !== org.id) {
        return res.status(404).json({ message: "Event not found or access denied" });
      }
      const details = await storage.getEventBankDetails(event.id);
      res.status(200).json(details || {});
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(ORG_EVENTS_BANK_UPDATE_PATH, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const org = await storage.getOrganizerByUserId(req.user.id);
      const event = await storage.getEvent(req.params.id);
      if (!org || !event || event.organizerId !== org.id) {
        return res.status(404).json({ message: "Event not found or access denied" });
      }
      const input = ORG_EVENTS_BANK_UPDATE_SCHEMA.parse(req.body);
      await storage.saveEventBankDetails(event.id, org.id, input);
      await sendEventBankUpdateEmail((await storage.getUser(org.userId))!.email, org.name, event.title, input, new Date());
      res.status(200).json({ message: "Event bank details updated" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  app.post(api.organizer.events.create.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const input = api.organizer.events.create.input.parse(req.body);
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(404).json({ message: "Organizer not found" });

      const event = await storage.createEvent({
        ...input,
        organizerId: org.id
      });
      
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put(api.organizer.events.update.path, authenticateToken, requireOrganizer, async (req, res) => {
    try {
      const input = api.organizer.events.update.input.parse(req.body);
      const org = await storage.getOrganizerByUserId((req as any).user.id);
      const existing = await storage.getEvent(req.params.id);
      if (!org || !existing || existing.organizerId !== org.id) {
        return res.status(404).json({ message: "Event not found or access denied" });
      }
      const updated = await storage.updateEvent(req.params.id, input);
      if (!updated) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.organizer.events.delete.path, authenticateToken, requireOrganizer, async (req, res) => {
    await storage.deleteEvent(req.params.id);
    res.status(204).send();
  });

  app.get(api.organizer.events.tickets.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const event = await storage.getEvent(req.params.id);
      const org = await storage.getOrganizerByUserId(req.user.id);

      if (!event || event.organizerId !== org?.id) {
        return res.status(404).json({ message: "Event not found or access denied" });
      }

      try { 
        await syncWithRetry(event.id, 1);
        res.setHeader("X-Attendee-Sync", "ok");
      } catch (err) { 
        res.setHeader("X-Attendee-Sync", "fail");
        console.error("Sync failed in tickets GET", { eventId: event.id }, err); 
      }
      const tickets = await storage.getTicketsByEvent(event.id);
      return res.status(200).json(tickets);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error in organizer events tickets route:", err.message, err.stack);
        return res.status(500).json({ message: err.message });
      }
      console.error("Unknown error in organizer events tickets route:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.organizer.bookings.list.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    res.setHeader("Cache-Control", "no-store");
    const org = await storage.getOrganizerByUserId(req.user.id);
    if (!org) return res.status(404).json({ message: "Organizer not found" });

    const bookings = await storage.getBookingsByOrganizer(org.id);
    res.status(200).json(bookings);
  });

  {
    const ATT_SYNC_PATH = api?.organizer?.events?.attendeesSync?.path ?? "/api/organizer/events/:id/attendees/sync";
    app.post(ATT_SYNC_PATH, authenticateToken, requireOrganizer, async (req: any, res) => {
      try {
        const eventId = req.params.id;
        const org = await storage.getOrganizerByUserId(req.user.id);
        const event = await storage.getEvent(eventId);
        console.log("Attendees sync request", { eventId, organizerId: org?.id, eventOrganizerId: event?.organizerId });
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }
        if (event.organizerId !== org?.id) {
          return res.status(403).json({ message: "Access denied" });
        }
        const result = await storage.syncEventAttendees(event.id);
        const cap = await storage.reconcileEventCapacity(event.id);
        res.status(200).json({ message: "Attendees synchronized", ...result, capacity: cap });
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    });
  }

  {
    const CAP_RECON_PATH = api?.organizer?.events?.capacityReconcile?.path ?? "/api/organizer/events/:id/capacity/reconcile";
    app.post(CAP_RECON_PATH, authenticateToken, requireOrganizer, async (req: any, res) => {
      try {
        const eventId = req.params.id;
        const org = await storage.getOrganizerByUserId(req.user.id);
        const event = await storage.getEvent(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (event.organizerId !== org?.id) return res.status(403).json({ message: "Access denied" });
        const cap = await storage.reconcileEventCapacity(eventId);
        res.status(200).json({ message: "Capacity reconciled", capacity: cap });
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    });
  }

  app.get(api.organizer.bookings.export.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(404).json({ message: "Organizer not found" });
      const eventId = (req.query?.eventId as string) || "";
      const rows = await storage.getBookingsByOrganizer(org.id);
      // When no specific event is selected, only export bookings for active events
      const filtered = eventId ? rows.filter(r => r.event.id === eventId) : rows.filter(r => r.event.status === "active");
      const header = [
        "booking_id","event_id","event_title","customer_name","customer_email","customer_phone",
        "ticket_quantity","status","transaction_reference","created_at"
      ].join(",");
      const lines = filtered.map(({ booking, event }) => {
        const vals = [
          booking.id,
          event.id,
          (event.title || "").replace(/"/g,'""'),
          (booking.customerName || "").replace(/"/g,'""'),
          (booking.customerEmail || "").replace(/"/g,'""'),
          (booking.customerPhone || "").replace(/"/g,'""'),
          String(booking.ticketQuantity ?? ""),
          booking.status ?? "",
          booking.transactionReference ?? "",
          booking.createdAt?.toISOString?.() ?? ""
        ].map(v => `"${v}"`);
        return vals.join(",");
      });
      const csv = [header, ...lines].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="bookings${eventId ? "_"+eventId : ""}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.organizer.bookings.update.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(404).json({ message: "Organizer not found" });

      const input = api.organizer.bookings.update.input.parse(req.body);
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const event = await storage.getEvent(booking.eventId);
      if (!event || event.organizerId !== org.id) {
        return res.status(404).json({ message: "Event not found or access denied" });
      }

      const updated = await storage.updateBookingDetails(booking.id, {
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
      });

      res.status(200).json(updated!);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.organizer.bookings.delete.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(404).json({ message: "Organizer not found" });

      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const event = await storage.getEvent(booking.eventId);
      if (!event || event.organizerId !== org.id) {
        return res.status(404).json({ message: "Event not found or access denied" });
      }

      await storage.deleteBooking(booking.id);
      try { await syncWithRetry(event.id, 1); } catch (err) { console.error("Sync failed after booking delete", { eventId: event.id, bookingId: booking.id }, err); }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.organizer.bookings.approve.path, authenticateToken, requireOrganizer, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      if (booking.status !== 'payment_submitted') {
        return res.status(400).json({ message: "Booking is not awaiting payment approval" });
      }

      const updated = await storage.updateBookingStatus(booking.id, 'paid');
      
      // Generate tickets
      const tickets = await storage.createTickets(booking.id, booking.eventId, booking.ticketQuantity);
      
      // Fetch event for email context
      const event = await storage.getEvent(booking.eventId);
      if (event) {
        // Send email (AWAIT for serverless/vercel compatibility)
        try {
          const branding = await getOrganizerBranding(event.id);
          await sendTicketsEmail(booking.customerEmail, booking.customerName, event, tickets, branding.name);
        } catch (err) {
          console.error('Failed to send tickets email after approval:', err);
        }
        try { await syncWithRetry(event.id, 1); } catch (err) { console.error("Sync failed after booking approve", { eventId: event.id, bookingId: booking.id }, err); }
      }

      res.status(200).json(updated!);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.organizer.bookings.reject.path, authenticateToken, requireOrganizer, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const updated = await storage.updateBookingStatus(booking.id, 'pending_payment'); // or cancelled
      
      res.status(200).json(updated!);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.organizer.bookings.manualCreate.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const input = api.organizer.bookings.manualCreate.input.parse(req.body);
      
      // Verify the event belongs to this organizer
      const event = await storage.getEvent(input.eventId);
      const org = await storage.getOrganizerByUserId(req.user.id);
      
      if (!event || event.organizerId !== org?.id) {
        return res.status(404).json({ message: "Event not found or access denied" });
      }

      const booking = await storage.manualTicketCreate(input.eventId, {
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone,
        quantity: input.ticketQuantity
      });

      // Fetch tickets and send email
      const tickets = await storage.getTicketsByBooking(booking.id);
      // Send email (AWAIT for serverless/vercel compatibility)
      try {
        const branding = await getOrganizerBranding(event.id);
await sendTicketsEmail(booking.customerEmail, booking.customerName, event, tickets, branding.name);
      } catch (err) {
        console.error('Failed to send tickets email after manual creation:', err);
      }
      try { await syncWithRetry(event.id, 1); } catch (err) { console.error("Sync failed after manual create", { eventId: event.id, bookingId: booking.id }, err); }

      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else if (err instanceof Error) {
        res.status(400).json({ message: err.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.organizer.bookings.resend.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(404).json({ message: "Organizer not found" });

      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const event = await storage.getEvent(booking.eventId);
      if (!event || event.organizerId !== org.id) {
        return res.status(404).json({ message: "Event not found or access denied" });
      }

      if (booking.status !== 'paid') {
        return res.status(400).json({ message: "Can only resend tickets for paid bookings" });
      }

      const tickets = await storage.getTicketsByBooking(booking.id);
      if (tickets.length === 0) {
        return res.status(404).json({ message: "No tickets found for this booking" });
      }

      // Send email
      const branding = await getOrganizerBranding(event.id);
      await sendTicketsEmail(booking.customerEmail, booking.customerName, event, tickets, branding.name);

      // Log the resend action (non-fatal if it fails)
      try {
        await storage.logResend(booking.id, req.user.id);
      } catch (logErr) {
        console.error('Failed to log resend action:', logErr);
      }

      return res.status(200).json({ message: "Tickets resent successfully" });
    } catch (err) {
      console.error('Resend Error:', err);
      const errorMessage = err instanceof Error ? err.message : "Internal server error";
      if (!res.headersSent) {
        res.status(500).json({ message: errorMessage });
      }
    }
  });

  // Get tickets by booking ID (for WhatsApp sharing)
  app.get("/api/organizer/bookings/:id/tickets", authenticateToken, requireOrganizer, async (req: any, res) => {
    console.log('[GET TICKETS] Request received for booking:', req.params.id);
    try {
      const org = await storage.getOrganizerByUserId(req.user.id);
      console.log('[GET TICKETS] Organizer:', org?.id);
      if (!org) return res.status(404).json({ message: "Organizer not found" });

      const booking = await storage.getBooking(req.params.id);
      console.log('[GET TICKETS] Booking:', booking?.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const event = await storage.getEvent(booking.eventId);
      console.log('[GET TICKETS] Event:', event?.id, 'OrganizerId:', event?.organizerId, 'OrgId:', org.id);
      if (!event || event.organizerId !== org.id) {
        return res.status(404).json({ message: "Event not found or access denied" });
      }

      const tickets = await storage.getTicketsByBooking(booking.id);
      console.log('[GET TICKETS] Tickets found:', tickets.length);
      return res.status(200).json(tickets);
    } catch (err) {
      console.error('Get tickets by booking error:', err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.organizer.tickets.scan.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const input = api.organizer.tickets.scan.input.parse(req.body);
      
      const ticket = await storage.getTicketByCode(input.uniqueTicketCode);
      if (!ticket) {
        return res.status(404).json({ message: "Invalid ticket", status: "invalid" });
      }

      const org = await storage.getOrganizerByUserId(req.user.id);
      const event = await storage.getEvent(ticket.eventId);
      
      if (!event || event.organizerId !== org?.id) {
        return res.status(404).json({ message: "Invalid ticket for this organizer", status: "invalid" });
      }

      if (ticket.scanStatus === 'scanned') {
        return res.status(400).json({ message: "Ticket already used", status: "already_used" });
      }

      await storage.updateTicketStatus(ticket.id, 'scanned');

      res.status(200).json({ 
        message: "Entry allowed", 
        status: "valid",
        eventId: event.id,
        eventTitle: event.title
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, status: "error" });
      } else {
        res.status(500).json({ message: "Internal server error", status: "error" });
      }
    }
  });


  // --- ANALYTICS ---
  app.get("/api/organizer/analytics", authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(404).json({ message: "Organizer not found" });

      const eventsList = await storage.getEventsByOrganizer(org.id);
      const bookingsData = await storage.getBookingsByOrganizer(org.id);

      const eventIds = new Set(eventsList.map(e => e.id));

      const revenueByEvent = eventsList.map(event => {
        const eventBookings = bookingsData.filter(b => b.event.id === event.id && b.booking.status === 'paid');
        const revenue = eventBookings.reduce((sum, b) => sum + (b.event.ticketPrice * b.booking.ticketQuantity), 0);
        return { eventId: event.id, title: event.title, revenue };
      });

      const totalRevenue = revenueByEvent.reduce((sum, e) => sum + e.revenue, 0);

      const allBookings = bookingsData.filter(b => eventIds.has(b.event.id));
      const funnel = {
        total: allBookings.length,
        pending_payment: allBookings.filter(b => b.booking.status === 'pending_payment').length,
        payment_submitted: allBookings.filter(b => b.booking.status === 'payment_submitted').length,
        paid: allBookings.filter(b => b.booking.status === 'paid').length,
        cancelled: allBookings.filter(b => b.booking.status === 'cancelled').length,
      };

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const salesByDay: Record<string, number> = {};
      allBookings.forEach(b => {
        if (!b.booking.createdAt) return;
        const d = new Date(b.booking.createdAt);
        if (d >= thirtyDaysAgo) {
          const key = d.toISOString().split('T')[0];
          salesByDay[key] = (salesByDay[key] || 0) + b.booking.ticketQuantity;
        }
      });
      const salesOverTime = Object.entries(salesByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const eventPerformance = eventsList.map(event => {
        const sold = event.totalCapacity - event.remainingCapacity;
        const sellThrough = event.totalCapacity > 0 ? Math.round((sold / event.totalCapacity) * 100) : 0;
        return { eventId: event.id, title: event.title, sold, remaining: event.remainingCapacity, total: event.totalCapacity, sellThrough };
      });

      const attendance = await Promise.all(
        eventsList.map(async (event) => {
          const eventTickets = await storage.getTicketsByEvent(event.id);
          const total = eventTickets.length;
          const scanned = eventTickets.filter(t => t.ticket.scanStatus === 'scanned').length;
          return { eventId: event.id, title: event.title, scanned, total };
        })
      );

      const activeEvents = eventsList.filter(e => e.status === 'active').length;
      const totalTicketsSold = eventsList.reduce((sum, e) => sum + (e.totalCapacity - e.remainingCapacity), 0);
      const totalTicketsScanned = attendance.reduce((sum, a) => sum + a.scanned, 0);
      const avgAttendance = totalTicketsSold > 0 ? Math.round((totalTicketsScanned / totalTicketsSold) * 100) : 0;

      res.status(200).json({
        summary: { totalRevenue, totalBookings: funnel.total, activeEvents, avgAttendance },
        revenueByEvent,
        funnel,
        salesOverTime,
        eventPerformance,
        attendance,
      });
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- PUBLIC ROUTES ---
  app.post(api.public.organizer.apply.path, async (req, res) => {
    try {
      const input = api.public.organizer.apply.input.parse(req.body);
      const appRow = await storage.createOrganizerApplication(input);
      res.status(201).json(appRow);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.organizer.account.resetPassword.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const input = api.organizer.account.resetPassword.input.parse(req.body);
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(401).json({ message: "User not found" });
      const valid = await bcrypt.compare(input.currentPassword, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid current password" });
      const hashed = await bcrypt.hash(input.newPassword, 10);
      await storage.updateUserPassword(user.id, hashed);
      res.status(200).json({ message: "Password updated" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  app.get(api.public.events.get.path, async (req, res) => {
    const identifier = req.params.identifier;
    let event;
    // Check if identifier is a UUID (contains hyphens in UUID format)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if (isUuid) {
      event = await storage.getEvent(identifier);
    } else {
      event = await storage.getEventBySlug(identifier);
    }
    if (!event || event.deletedAt) {
      return res.status(404).json({ message: "Event not found" });
    }
    const org = await storage.getOrganizerById(event.organizerId);
    let organizerEmail: string | undefined;
    if (org) {
      const user = await storage.getUser(org.userId);
      organizerEmail = user?.email;
    }
    res.status(200).json({ ...event, organizerName: org?.brandName || org?.name || "TixPass", organizerLogo: org?.logoUrl || undefined, organizerEmail, organizerPhone: org?.phone });
  });

  // Organizer profile (returns branding + report settings)
  app.get("/api/organizer/profile", authenticateToken, requireOrganizer, async (req: any, res) => {
    const org = await storage.getOrganizerByUserId(req.user.id);
    if (!org) return res.status(404).json({ message: "Organizer not found" });
    res.status(200).json({
      name: org.name,
      brandName: org.brandName || "",
      logoUrl: org.logoUrl || "",
      phone: org.phone || "",
      reportEmail: org.reportEmail || "",
      reportTime: org.reportTime || "02:00",
      reportEnabled: org.reportEnabled ?? true,
      bookingFilterPreferences: org.bookingFilterPreferences ? JSON.parse(org.bookingFilterPreferences) : null,
    });
  });

  // Save booking filter preferences
  app.post("/api/organizer/booking-filter-preferences", authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const { eventId, status } = req.body;
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(404).json({ message: "Organizer not found" });
      const preferences = { eventId: eventId || "", status: status || "" };
      await db.update(organizers).set({
        bookingFilterPreferences: JSON.stringify(preferences),
        updatedAt: new Date(),
      }).where(eq(organizers.id, org.id));
      res.status(200).json({ message: "Filter preferences saved", preferences });
    } catch (err) {
      res.status(500).json({ message: "Failed to save filter preferences" });
    }
  });

  app.post(api.organizer.account.setReportEmail.path, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const base = api.organizer.account.setReportEmail.input.parse(req.body);
      const extra = req.body;
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(404).json({ message: "Organizer not found" });
      await storage.updateOrganizerReportEmail(org.id, base.reportEmail);
      if (typeof extra.reportTime === 'string') {
        await db.update(organizers).set({ reportEmail: base.reportEmail, updatedAt: new Date(), /* keep other field update below */ }).where(eq(organizers.id, org.id));
        await db.update(organizers).set({ reportTime: extra.reportTime, updatedAt: new Date() }).where(eq(organizers.id, org.id));
      }
      if (typeof extra.enabled === 'boolean') {
        await db.update(organizers).set({ reportEnabled: extra.enabled, updatedAt: new Date() }).where(eq(organizers.id, org.id));
      }
      res.status(200).json({ message: "Report email updated" });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Organizer branding (name + logo + phone for emails/tickets)
  app.post("/api/organizer/branding", authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(404).json({ message: "Organizer not found" });
      const { brandName, logoUrl, phone } = req.body;
      await db.update(organizers).set({
        brandName: brandName ?? org.brandName,
        logoUrl: logoUrl ?? org.logoUrl,
        phone: phone ?? org.phone,
        updatedAt: new Date(),
      }).where(eq(organizers.id, org.id));
      res.status(200).json({ message: "Branding updated" });
    } catch (err) {
      res.status(500).json({ message: "Failed to update branding" });
    }
  });

  const runDailyReports = async () => {
    try {
      const organizers = await storage.getOrganizers();
      const end = new Date();
      const start = new Date(end);
      start.setHours(0, 0, 0, 0);
      const prevEnd = new Date(start);
      prevEnd.setMilliseconds(-1);
      const prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      const startLabel = prevStart.toLocaleDateString();
      for (const { organizer, user } of organizers) {
        const bookings = await storage.getBookingsByOrganizer(organizer.id);
        const dayBookings = bookings.filter(b => {
          if (!b.booking.createdAt) return false;
          const d = new Date(b.booking.createdAt);
          return d >= prevStart && d <= prevEnd;
        });
        const total = dayBookings.length;
        const paid = dayBookings.filter(b => b.booking.status === 'paid').length;
        const submitted = dayBookings.filter(b => b.booking.status === 'payment_submitted').length;
        const pending = dayBookings.filter(b => b.booking.status === 'pending_payment').length;
        const revenueCents = dayBookings
          .filter(b => b.booking.status === 'paid')
          .reduce((sum, b) => sum + (b.event.ticketPrice * b.booking.ticketQuantity), 0);
        const toEmail = organizer.reportEmail || user.email;
        await sendDailyBookingsReportEmail(toEmail, organizer.name, startLabel, { total, paid, submitted, pending, revenueCents });
      }
    } catch (err) {
      console.error("Daily report run failed:", err);
    }
  };

  const scheduleDailyReports = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(2, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next.getTime() - now.getTime();
    setTimeout(() => {
      runDailyReports();
      setInterval(runDailyReports, 24 * 60 * 60 * 1000);
    }, delay);
  };
  scheduleDailyReports();

  const ORG_BANK_GET_PATH = api?.organizer?.bank?.get?.path ?? "/api/organizer/bank";
  const ORG_BANK_SAVE_PATH = api?.organizer?.bank?.save?.path ?? "/api/organizer/bank";
  const ORG_BANK_LOCK_PATH = api?.organizer?.bank?.lock?.path ?? "/api/organizer/bank/lock";
  const ORG_BANK_SAVE_SCHEMA = api?.organizer?.bank?.save?.input ?? z.object({
    bankName: z.string().min(2),
    accountHolder: z.string().min(2),
    accountNumber: z.string().min(2),
    routingNumber: z.string().min(2),
    accountType: z.string().optional(),
    paymentMethod: z.enum(['bank','link','paypal','revolut']).optional(),
    paymentLink: z.string().optional(),
    paypalClientId: z.string().optional(),
    paymentNumber: z.string().optional(),
    referenceCode: z.string().optional(),
  });
  const ORG_BANK_LOCK_SCHEMA = api?.organizer?.bank?.lock?.input ?? z.object({ enabled: z.boolean() });

  app.get(ORG_BANK_GET_PATH, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(401).json({ message: "Organizer not found" });
      const details = await storage.getOrganizerBankDetails(org.id);
      res.status(200).json(details || {});
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(ORG_BANK_SAVE_PATH, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const input = ORG_BANK_SAVE_SCHEMA.parse(req.body);
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(401).json({ message: "Organizer not found" });
      if (org.bankLocked) return res.status(403).json({ message: "Bank details are locked" });
      await storage.saveOrganizerBankDetails(org.id, input);
      res.status(200).json({ message: "Bank details saved" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(ORG_BANK_LOCK_PATH, authenticateToken, requireOrganizer, async (req: any, res) => {
    try {
      const input = ORG_BANK_LOCK_SCHEMA.parse(req.body);
      const org = await storage.getOrganizerByUserId(req.user.id);
      if (!org) return res.status(401).json({ message: "Organizer not found" });
      await storage.updateOrganizerBankLock(org.id, input.enabled);
      res.status(200).json({ message: "Bank lock updated", bankLocked: input.enabled });
    } catch {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  const PUBLIC_BANK_BY_EVENT_PATH = api?.public?.bank?.byEvent?.path ?? "/api/public/events/:id/bank";
  const PUBLIC_BOOKINGS_CREATE_PATH = api?.public?.bookings?.create?.path ?? "/api/public/bookings";
  const PUBLIC_BOOKINGS_CREATE_SCHEMA = api?.public?.bookings?.create?.input ?? z.object({
    eventId: z.string(),
    customerName: z.string(),
    customerEmail: z.string().email(),
    customerPhone: z.string(),
    ticketQuantity: z.coerce.number(),
  });
  const PUBLIC_BOOKINGS_SUBMIT_PAYMENT_PATH = api?.public?.bookings?.submitPayment?.path ?? "/api/public/bookings/:id/payment";
  const PUBLIC_BOOKINGS_SUBMIT_PAYMENT_SCHEMA = api?.public?.bookings?.submitPayment?.input ?? z.object({
    transactionReference: z.string(),
  });
  const PUBLIC_TICKETS_GET_PATH = api?.public?.tickets?.get?.path ?? "/api/public/tickets/:id";

  app.get(PUBLIC_BANK_BY_EVENT_PATH, async (req, res) => {
    const data = await storage.getOrganizerBankDetailsByEvent(req.params.id);
    if (!data) return res.status(404).json({ message: "Bank details not found" });
    res.status(200).json(data);
  });
  app.post(PUBLIC_BOOKINGS_CREATE_PATH, async (req, res) => {
    try {
      // Coerce ticketQuantity to number
      const bodySchema = PUBLIC_BOOKINGS_CREATE_SCHEMA;
      const input = bodySchema.parse(req.body);
      
      const event = await storage.getEvent(input.eventId);
      if (!event || event.deletedAt) return res.status(404).json({ message: "Event not found" });
      if (event.status !== "active") return res.status(400).json({ message: "Bookings are closed for now" });

      const booking = await storage.createBooking(input);
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(PUBLIC_BOOKINGS_SUBMIT_PAYMENT_PATH, async (req, res) => {
    try {
      const input = PUBLIC_BOOKINGS_SUBMIT_PAYMENT_SCHEMA.parse(req.body);
      const updated = await storage.submitPayment(req.params.id, input.transactionReference);
      if (!updated) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post(api.public.bookings.confirmPayPal.path, async (req, res) => {
    try {
      const { id } = req.params;
      const input = api.public.bookings.confirmPayPal.input.parse(req.body);
      console.log(`[PayPal] Confirming payment for booking ${id}, orderID: ${input.orderID}`);
      
      const booking = await storage.getBooking(id);
      if (!booking) {
        console.error(`[PayPal] Booking ${id} not found`);
        return res.status(404).json({ message: "Booking not found" });
      }

      // 1. Update status to paid and store orderID
      console.log(`[PayPal] Updating booking ${id} status to 'paid'`);
      const updated = await storage.confirmPayPalPayment(booking.id, input.orderID);
      if (!updated) {
        throw new Error("Failed to update booking status in database");
      }
      
      // 2. Generate tickets
      console.log(`[PayPal] Generating ${booking.ticketQuantity} tickets for booking ${id}`);
      const tickets = await storage.createTickets(booking.id, booking.eventId, booking.ticketQuantity);
      
      // 3. Fetch event for email context
      const event = await storage.getEvent(booking.eventId);
      if (event) {
        try {
          console.log(`[PayPal] Sending confirmation email to ${booking.customerEmail}`);
          const branding = await getOrganizerBranding(event.id);
          await sendTicketsEmail(booking.customerEmail, booking.customerName, event, tickets, branding.name);
          console.log(`[PayPal] Email sent successfully`);
        } catch (err) {
          console.error('[PayPal] Failed to send tickets email:', err);
        }
        
        try { 
          console.log(`[PayPal] Syncing event capacity for ${event.id}`);
          await syncWithRetry(event.id, 1); 
        } catch (err) { 
          console.error("[PayPal] Sync failed:", err); 
        }
      }

      console.log(`[PayPal] Booking ${id} confirmed successfully`);
      res.status(200).json(updated);
    } catch (err) {
      console.error('[PayPal] CRITICAL ERROR during confirmation:', err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(PUBLIC_TICKETS_GET_PATH, async (req, res) => {
    try {
      const ticketData = await storage.getTicket(req.params.id);
      if (!ticketData) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      const org = await storage.getOrganizerById(ticketData.event.organizerId);
      res.status(200).json({ ...ticketData, organizerName: org?.brandName || org?.name || "TixPass", organizerLogo: org?.logoUrl || undefined });
    } catch (err) {
      console.error('Error fetching public ticket:', err);
      res.status(400).json({ message: "Invalid ticket ID" });
    }
  });

  app.get("/api/public/bookings/:id/ticket-html", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const event = await storage.getEvent(booking.eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const tickets = await storage.getTicketsByBooking(booking.id);
      if (tickets.length === 0) return res.status(404).json({ message: "No tickets found" });

      const org = await storage.getOrganizerById(event.organizerId);
      const html = await generateTicketEmailHtml(event, tickets, booking.customerName, org?.brandName || org?.name, { useDataUrls: true });

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(html);
    } catch (err) {
      console.error("Error generating ticket HTML:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/public/bookings/:id/ticket-pdf-html", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const event = await storage.getEvent(booking.eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const tickets = await storage.getTicketsByBooking(booking.id);
      if (tickets.length === 0) return res.status(404).json({ message: "No tickets found" });

      const html = await generateTicketPdfHtml(event, tickets, booking.customerName);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(html);
    } catch (err) {
      console.error("Error generating ticket PDF HTML:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/public/qr/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const buf = await QRCode.toBuffer(code, { width: 200, margin: 1 });
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.status(200).send(buf);
    } catch (err) {
      console.error("Error generating QR:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/public/bookings/:id/whatsapp-ticket-html", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const event = await storage.getEvent(booking.eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const tickets = await storage.getTicketsByBooking(booking.id);
      if (tickets.length === 0) return res.status(404).json({ message: "No tickets found" });

      const html = await generateTicketWhatsAppHtml(event, tickets);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(html);
    } catch (err) {
      console.error("Error generating WhatsApp ticket HTML:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
