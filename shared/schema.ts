import { pgTable, text, integer, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"), // 'admin', 'organizer'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const organizers = pgTable("organizers", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  brandName: text("brand_name"),
  logoUrl: text("logo_url"),
  status: text("status").notNull().default("active"), // 'active', 'paused'
  reportEmail: text("report_email"),
  reportTime: text("report_time"),
  reportEnabled: boolean("report_enabled").default(true),
  lastReportSentAt: timestamp("last_report_sent_at"),
  bankLocked: boolean("bank_locked").default(false),
  bookingFilterPreferences: text("booking_filter_preferences"), // JSON string for saved filters
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const organizerBankDetails = pgTable("organizer_bank_details", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  organizerId: uuid("organizer_id").references(() => organizers.id).notNull(),
  ciphertext: text("ciphertext").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventBankDetails = pgTable("event_bank_details", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  details: text("details").notNull(), // raw JSON string
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventBankAudit = pgTable("event_bank_audit", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  organizerId: uuid("organizer_id").references(() => organizers.id).notNull(),
  oldDetails: text("old_details"),
  newDetails: text("new_details").notNull(),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const organizerApplications = pgTable("organizer_applications", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  organizerId: uuid("organizer_id").references(() => organizers.id).notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  bannerUrl: text("banner_url"),
  language: text("language"),
  screen: text("screen"),
  venue: text("venue").notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventDateText: text("event_date_text"),
  ticketTypes: text("ticket_types").notNull(),
  ticketPrice: integer("ticket_price").notNull(), // stored in cents (cents/euro)
  totalCapacity: integer("total_capacity").notNull().default(100),
  remainingCapacity: integer("remaining_capacity").notNull().default(100),
  notes: text("notes"),
  status: text("status").notNull().default("active"), // 'active', 'paused'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  ticketQuantity: integer("ticket_quantity").notNull(),
  status: text("status").notNull().default("pending_payment"), // 'pending_payment', 'payment_submitted', 'paid', 'cancelled'
  transactionReference: text("transaction_reference"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull(),
  uniqueTicketCode: text("unique_ticket_code").notNull().unique(),
  qrData: text("qr_data").notNull(),
  scanStatus: text("scan_status").notNull().default("unused"), // 'unused', 'scanned'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const resendLogs = pgTable("resend_logs", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  resentAt: timestamp("resent_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export const insertOrganizerSchema = createInsertSchema(organizers).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export const insertOrganizerApplicationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  phone: z.string().optional(),
  password: z.string().min(8),
});
export const organizerBankInputSchema = z.object({
  bankName: z.string().min(2),
  accountHolder: z.string().min(2),
  accountNumber: z.string().min(6),
  routingNumber: z.string().min(4),
  accountType: z.string().min(2),
});
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true, remainingCapacity: true }).extend({
  eventDate: z.coerce.date(),
  ticketPrice: z.coerce.number().int(),
  totalCapacity: z.coerce.number().int().min(1),
});
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Organizer = typeof organizers.$inferSelect;
export type InsertOrganizer = z.infer<typeof insertOrganizerSchema>;
export type OrganizerApplication = typeof organizerApplications.$inferSelect;
export type InsertOrganizerApplication = z.infer<typeof insertOrganizerApplicationSchema>;
export type OrganizerBankDetails = typeof organizerBankDetails.$inferSelect;
export type OrganizerBankInput = z.infer<typeof organizerBankInputSchema>;
export type EventBankDetails = typeof eventBankDetails.$inferSelect;
export type EventBankAudit = typeof eventBankAudit.$inferSelect;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
