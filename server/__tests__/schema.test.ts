import { describe, it, expect } from 'vitest';
import { insertEventSchema, insertBookingSchema, insertOrganizerApplicationSchema, organizerBankInputSchema } from '../../shared/schema.js';

describe('insertEventSchema', () => {
  const validEvent = {
    organizerId: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Concert',
    description: 'A great concert',
    venue: 'Stadium Arena',
    eventDate: new Date('2026-12-01T19:00:00Z'),
    ticketTypes: 'General, VIP',
    ticketPrice: 2500,
    totalCapacity: 500,
    status: 'active',
  };

  it('accepts valid event data', () => {
    const result = insertEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it('rejects missing title field', () => {
    const { title, ...noTitle } = validEvent;
    const result = insertEventSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it('rejects missing venue field', () => {
    const { venue, ...noVenue } = validEvent;
    const result = insertEventSchema.safeParse(noVenue);
    expect(result.success).toBe(false);
  });

  it('rejects zero capacity', () => {
    const result = insertEventSchema.safeParse({ ...validEvent, totalCapacity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative capacity', () => {
    const result = insertEventSchema.safeParse({ ...validEvent, totalCapacity: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer price', () => {
    const result = insertEventSchema.safeParse({ ...validEvent, ticketPrice: 19.99 });
    expect(result.success).toBe(false);
  });

  it('accepts zero price (free event)', () => {
    const result = insertEventSchema.safeParse({ ...validEvent, ticketPrice: 0 });
    expect(result.success).toBe(true);
  });
});

describe('insertBookingSchema', () => {
  const validBooking = {
    eventId: '550e8400-e29b-41d4-a716-446655440000',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+35712345678',
    ticketQuantity: 2,
    status: 'pending_payment',
  };

  it('accepts valid booking data', () => {
    const result = insertBookingSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it('rejects missing customerName field', () => {
    const { customerName, ...noName } = validBooking;
    const result = insertBookingSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it('rejects missing customerEmail field', () => {
    const { customerEmail, ...noEmail } = validBooking;
    const result = insertBookingSchema.safeParse(noEmail);
    expect(result.success).toBe(false);
  });

  it('rejects missing ticketQuantity field', () => {
    const { ticketQuantity, ...noQty } = validBooking;
    const result = insertBookingSchema.safeParse(noQty);
    expect(result.success).toBe(false);
  });
});

describe('insertOrganizerApplicationSchema', () => {
  const validApplication = {
    name: 'Test Organizer',
    email: 'organizer@example.com',
    company: 'Event Co.',
    password: 'SecureP@ss123',
  };

  it('accepts valid application', () => {
    const result = insertOrganizerApplicationSchema.safeParse(validApplication);
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = insertOrganizerApplicationSchema.safeParse({ ...validApplication, password: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = insertOrganizerApplicationSchema.safeParse({ ...validApplication, email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects empty company', () => {
    const result = insertOrganizerApplicationSchema.safeParse({ ...validApplication, company: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = insertOrganizerApplicationSchema.safeParse({ ...validApplication, name: '' });
    expect(result.success).toBe(false);
  });
});

describe('organizerBankInputSchema', () => {
  const validBank = {
    bankName: 'Bank of Cyprus',
    accountHolder: 'John Doe',
    accountNumber: '1234567890',
    routingNumber: '1234',
    accountType: 'checking',
  };

  it('accepts valid bank details', () => {
    const result = organizerBankInputSchema.safeParse(validBank);
    expect(result.success).toBe(true);
  });

  it('accepts with PayPal fields', () => {
    const result = organizerBankInputSchema.safeParse({
      ...validBank,
      paymentMethod: 'paypal',
      paypalClientId: 'AfJ0AbCdEfGhIjKlMnOp',
    });
    expect(result.success).toBe(true);
  });

  it('accepts with payment link', () => {
    const result = organizerBankInputSchema.safeParse({
      ...validBank,
      paymentMethod: 'link',
      paymentLink: 'https://revolut.me/example',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short bank name', () => {
    const result = organizerBankInputSchema.safeParse({ ...validBank, bankName: 'B' });
    expect(result.success).toBe(false);
  });

  it('rejects short account number', () => {
    const result = organizerBankInputSchema.safeParse({ ...validBank, accountNumber: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects short routing number', () => {
    const result = organizerBankInputSchema.safeParse({ ...validBank, routingNumber: '12' });
    expect(result.success).toBe(false);
  });
});
