import { z } from 'zod';
import {
  insertUserSchema, users,
  insertOrganizerSchema, organizers,
  insertEventSchema, events,
  insertBookingSchema, bookings,
  insertTicketSchema, tickets,
  organizerApplications,
  insertOrganizerApplicationSchema,
} from './schema.js';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>(), organizer: z.custom<typeof organizers.$inferSelect>().optional() }),
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.object({ user: z.custom<typeof users.$inferSelect>(), organizer: z.custom<typeof organizers.$inferSelect>().optional() }),
        401: errorSchemas.unauthorized,
      }
    }
  },
  admin: {
    organizers: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/organizers' as const,
        responses: { 200: z.array(z.object({ organizer: z.custom<typeof organizers.$inferSelect>(), user: z.custom<typeof users.$inferSelect>() })) },
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/organizers' as const,
        input: z.object({ name: z.string(), email: z.string().email(), password: z.string() }),
        responses: { 201: z.custom<typeof organizers.$inferSelect>(), 400: errorSchemas.validation },
      },
      updateStatus: {
        method: 'PATCH' as const,
        path: '/api/admin/organizers/:id/status' as const,
        input: z.object({ status: z.enum(["active", "paused"]) }),
        responses: { 200: z.custom<typeof organizers.$inferSelect>(), 404: errorSchemas.notFound },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/organizers/:id' as const,
        responses: { 204: z.void(), 404: errorSchemas.notFound },
      },
      resetPassword: {
        method: 'POST' as const,
        path: '/api/admin/organizers/:id/reset-password' as const,
        input: z.object({ newPassword: z.string() }),
        responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
      }
    },
    organizerApplications: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/organizer-applications' as const,
        responses: { 200: z.array(z.custom<typeof organizerApplications.$inferSelect>()) },
      },
      approve: {
        method: 'POST' as const,
        path: '/api/admin/organizer-applications/:id/approve' as const,
        responses: { 200: z.custom<typeof organizers.$inferSelect>(), 404: errorSchemas.notFound },
      },
      reject: {
        method: 'POST' as const,
        path: '/api/admin/organizer-applications/:id/reject' as const,
        input: z.object({ reason: z.string().optional() }),
        responses: { 200: z.custom<typeof organizerApplications.$inferSelect>(), 404: errorSchemas.notFound },
      },
    },
    maintenance: {
      repairOrganizer: {
        method: 'POST' as const,
        path: '/api/admin/maintenance/repair-organizer' as const,
        input: z.object({ organizerEmail: z.string().email() }),
        responses: { 200: z.object({ message: z.string() }) },
      },
    },
  },
  organizer: {
    maintenance: {
      repair: {
        method: 'POST' as const,
        path: '/api/organizer/maintenance/repair' as const,
        responses: { 200: z.object({ message: z.string() }) },
      },
    },
    events: {
      list: {
        method: 'GET' as const,
        path: '/api/organizer/events' as const,
        responses: { 200: z.array(z.custom<typeof events.$inferSelect>()) },
      },
      create: {
        method: 'POST' as const,
        path: '/api/organizer/events' as const,
        input: insertEventSchema.omit({ organizerId: true }),
        responses: { 201: z.custom<typeof events.$inferSelect>(), 400: errorSchemas.validation },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/organizer/events/:id' as const,
        input: insertEventSchema.partial().omit({ organizerId: true }),
        responses: { 200: z.custom<typeof events.$inferSelect>(), 404: errorSchemas.notFound },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/organizer/events/:id' as const,
        responses: { 204: z.void(), 404: errorSchemas.notFound },
      },
      tickets: {
        method: 'GET' as const,
        path: '/api/organizer/events/:id/tickets' as const,
        responses: { 
          200: z.array(z.object({ 
            ticket: z.custom<typeof tickets.$inferSelect>(), 
            booking: z.custom<typeof bookings.$inferSelect>() 
          })), 
          404: errorSchemas.notFound 
        },
      }
      ,
      bank: {
        get: {
          method: 'GET' as const,
          path: '/api/organizer/events/:id/bank' as const,
          responses: { 200: z.object({
            bankName: z.string().optional(),
            accountHolder: z.string().optional(),
            accountNumber: z.string().optional(),
            routingNumber: z.string().optional(),
            accountType: z.string().optional(),
          }), 404: errorSchemas.notFound },
        },
        update: {
          method: 'PUT' as const,
          path: '/api/organizer/events/:id/bank' as const,
          input: z.object({
            bankName: z.string().optional(),
            accountHolder: z.string().optional(),
            accountNumber: z.string().optional(),
            routingNumber: z.string().optional(),
            accountType: z.string().optional(),
          }),
          responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
        }
      }
    },
    account: {
      resetPassword: {
        method: 'POST' as const,
        path: '/api/organizer/reset-password' as const,
        input: z.object({ currentPassword: z.string(), newPassword: z.string().min(8) }),
        responses: { 200: z.object({ message: z.string() }), 400: errorSchemas.validation, 401: errorSchemas.unauthorized },
      },
      setReportEmail: {
        method: 'POST' as const,
        path: '/api/organizer/report-email' as const,
        input: z.object({ reportEmail: z.string().email() }),
        responses: { 200: z.object({ message: z.string() }) },
      },
    },
    bank: {
      get: {
        method: 'GET' as const,
        path: '/api/organizer/bank' as const,
        responses: { 200: z.object({
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
        }) },
      },
      save: {
        method: 'POST' as const,
        path: '/api/organizer/bank' as const,
        input: z.object({
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
        }),
        responses: { 200: z.object({ message: z.string() }), 403: errorSchemas.unauthorized },
      },
      lock: {
        method: 'POST' as const,
        path: '/api/organizer/bank/lock' as const,
        input: z.object({ enabled: z.boolean() }),
        responses: { 200: z.object({ message: z.string(), bankLocked: z.boolean() }) },
      }
    },
    bookings: {
      list: {
        method: 'GET' as const,
        path: '/api/organizer/bookings' as const,
        responses: { 200: z.array(z.object({ booking: z.custom<typeof bookings.$inferSelect>(), event: z.custom<typeof events.$inferSelect>() })) },
      },
      export: {
        method: 'GET' as const,
        path: '/api/organizer/bookings/export' as const,
        responses: { 200: z.string() },
      },
      update: {
        method: 'PATCH' as const,
        path: '/api/organizer/bookings/:id' as const,
        input: z.object({
          customerName: z.string().optional(),
          customerEmail: z.string().email().optional(),
          customerPhone: z.string().optional(),
        }),
        responses: { 200: z.custom<typeof bookings.$inferSelect>(), 404: errorSchemas.notFound },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/organizer/bookings/:id' as const,
        responses: { 204: z.void(), 404: errorSchemas.notFound },
      },
      approve: {
        method: 'POST' as const,
        path: '/api/organizer/bookings/:id/approve' as const,
        responses: { 200: z.custom<typeof bookings.$inferSelect>(), 404: errorSchemas.notFound },
      },
      reject: {
        method: 'POST' as const,
        path: '/api/organizer/bookings/:id/reject' as const,
        responses: { 200: z.custom<typeof bookings.$inferSelect>(), 404: errorSchemas.notFound },
      },
      manualCreate: {
        method: 'POST' as const,
        path: '/api/organizer/bookings/manual' as const,
        input: z.object({
          eventId: z.string(),
          customerName: z.string(),
          customerEmail: z.string().email(),
          customerPhone: z.string(),
          ticketQuantity: z.number().int().min(1),
        }),
        responses: { 201: z.custom<typeof bookings.$inferSelect>(), 400: errorSchemas.validation },
      },
      resend: {
        method: 'POST' as const,
        path: '/api/organizer/bookings/:id/resend' as const,
        responses: { 200: z.object({ message: z.string() }), 404: errorSchemas.notFound },
      }
    },
    tickets: {
      scan: {
        method: 'POST' as const,
        path: '/api/organizer/tickets/scan' as const,
        input: z.object({ uniqueTicketCode: z.string() }),
        responses: {
          200: z.object({ message: z.string(), status: z.string() }),
          400: z.object({ message: z.string(), status: z.string() }),
          404: errorSchemas.notFound
        }
      }
    }
  },
  public: {
    events: {
      get: {
        method: 'GET' as const,
        path: '/api/public/events/:id' as const,
        responses: { 200: z.custom<typeof events.$inferSelect>(), 404: errorSchemas.notFound },
      }
    },
    bank: {
      byEvent: {
        method: 'GET' as const,
        path: '/api/public/events/:id/bank' as const,
        responses: { 200: z.object({
          bankName: z.string(),
          accountHolder: z.string(),
          accountNumber: z.string(),
          routingNumber: z.string(),
          accountType: z.string(),
          paymentMethod: z.enum(['bank','link','paypal','revolut']).optional(),
          paymentLink: z.string().optional(),
          paypalClientId: z.string().optional(),
          paymentNumber: z.string().optional(),
          referenceCode: z.string().optional(),
        }), 404: errorSchemas.notFound },
      },
    },
    organizer: {
      apply: {
        method: 'POST' as const,
        path: '/api/public/organizer-apply' as const,
        input: insertOrganizerApplicationSchema,
        responses: { 201: z.custom<typeof organizerApplications.$inferSelect>(), 400: errorSchemas.validation },
      },
    },
    bookings: {
      create: {
        method: 'POST' as const,
        path: '/api/public/bookings' as const,
        input: insertBookingSchema.omit({ status: true, transactionReference: true, eventId: true }).extend({ eventId: z.string() }),
        responses: { 201: z.custom<typeof bookings.$inferSelect>(), 400: errorSchemas.validation },
      },
      submitPayment: {
        method: 'POST' as const,
        path: '/api/public/bookings/:id/payment' as const,
        input: z.object({ transactionReference: z.string() }),
        responses: { 200: z.custom<typeof bookings.$inferSelect>(), 404: errorSchemas.notFound },
      },
      confirmPayPal: {
        method: 'POST' as const,
        path: '/api/public/bookings/:id/paypal-confirm' as const,
        input: z.object({ orderID: z.string() }),
        responses: { 200: z.custom<typeof bookings.$inferSelect>(), 404: errorSchemas.notFound },
      }
    },
    tickets: {
      get: {
        method: 'GET' as const,
        path: '/api/public/tickets/:id' as const,
        responses: { 200: z.object({ ticket: z.custom<typeof tickets.$inferSelect>(), event: z.custom<typeof events.$inferSelect>() }), 404: errorSchemas.notFound },
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
