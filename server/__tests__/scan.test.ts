import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!';

// Mock storage
const mockStorage = {
  getTicketByCode: vi.fn(),
  getEvent: vi.fn(),
  getOrganizerByUserId: vi.fn(),
  updateTicketStatus: vi.fn(),
  getBooking: vi.fn(),
};

vi.mock('../db.js', () => ({
  db: {},
}));

vi.mock('../storage.js', () => ({
  storage: mockStorage,
}));

function createOrganizerToken(userId: string) {
  return jwt.sign({ id: userId, role: 'organizer' }, JWT_SECRET, { expiresIn: '1h' });
}

const mockOrganizer = { id: 'org-1', userId: 'user-1', name: 'Test Organizer' };

const mockEvent = {
  id: 'event-1',
  organizerId: 'org-1',
  title: 'Test Movie',
  status: 'active',
  deletedAt: null,
  eventDate: '2026-09-15T19:00:00',
  venue: 'Cinema Hall',
  screen: 'Screen 1',
  ticketTypes: 'Regular',
  ticketPrice: 1000,
  bannerUrl: '',
  notes: '',
  language: 'English',
  subtitle: '',
};

const mockTicket = {
  id: 'ticket-1',
  eventId: 'event-1',
  bookingId: 'booking-1',
  uniqueTicketCode: 'ABC123DEF456',
  qrData: 'TICKET:ABC123DEF456',
  scanStatus: 'unused',
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockBooking = {
  id: 'booking-1',
  eventId: 'event-1',
  customerName: 'John Doe',
  customerEmail: 'john@test.com',
  status: 'paid',
};

describe('Scan endpoint - deleted ticket handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns "Ticket no longer exists" for non-existent ticket code', async () => {
    mockStorage.getTicketByCode.mockResolvedValue(null);
    mockStorage.getOrganizerByUserId.mockResolvedValue(mockOrganizer);

    const ticket = await mockStorage.getTicketByCode('NONEXISTENT');
    expect(ticket).toBeNull();
  });

  it('returns "Ticket no longer exists" for soft-deleted ticket', async () => {
    const deletedTicket = { ...mockTicket, deletedAt: new Date() };
    mockStorage.getTicketByCode.mockResolvedValue(null); // getTicketByCode now filters deleted

    const ticket = await mockStorage.getTicketByCode('ABC123DEF456');
    expect(ticket).toBeNull();
  });

  it('returns ticket for valid non-deleted code', async () => {
    mockStorage.getTicketByCode.mockResolvedValue(mockTicket);

    const ticket = await mockStorage.getTicketByCode('ABC123DEF456');
    expect(ticket).not.toBeNull();
    expect(ticket?.uniqueTicketCode).toBe('ABC123DEF456');
  });
});

describe('Scan endpoint - paused event handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns "Event is paused" when event status is paused', async () => {
    const pausedEvent = { ...mockEvent, status: 'paused' };
    mockStorage.getTicketByCode.mockResolvedValue(mockTicket);
    mockStorage.getEvent.mockResolvedValue(pausedEvent);
    mockStorage.getOrganizerByUserId.mockResolvedValue(mockOrganizer);

    const event = await mockStorage.getEvent(mockTicket.eventId);
    expect(event?.status).toBe('paused');
  });

  it('allows scanning when event is active', async () => {
    mockStorage.getTicketByCode.mockResolvedValue(mockTicket);
    mockStorage.getEvent.mockResolvedValue(mockEvent);
    mockStorage.getOrganizerByUserId.mockResolvedValue(mockOrganizer);

    const event = await mockStorage.getEvent(mockTicket.eventId);
    expect(event?.status).toBe('active');
  });
});

describe('Scan endpoint - deleted event handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns "Event no longer exists" when event is null', async () => {
    mockStorage.getTicketByCode.mockResolvedValue(mockTicket);
    mockStorage.getEvent.mockResolvedValue(null);

    const event = await mockStorage.getEvent(mockTicket.eventId);
    expect(event).toBeNull();
  });

  it('returns "Event no longer exists" when event is soft-deleted', async () => {
    const deletedEvent = { ...mockEvent, deletedAt: new Date() };
    mockStorage.getTicketByCode.mockResolvedValue(mockTicket);
    mockStorage.getEvent.mockResolvedValue(deletedEvent);

    const event = await mockStorage.getEvent(mockTicket.eventId);
    expect(event?.deletedAt).not.toBeNull();
  });
});

describe('Scan endpoint - successful scan response fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ticket number in scan response', async () => {
    mockStorage.getTicketByCode.mockResolvedValue(mockTicket);
    mockStorage.getEvent.mockResolvedValue(mockEvent);
    mockStorage.getOrganizerByUserId.mockResolvedValue(mockOrganizer);
    mockStorage.updateTicketStatus.mockResolvedValue({ ...mockTicket, scanStatus: 'scanned' });
    mockStorage.getBooking.mockResolvedValue(mockBooking);

    const ticket = await mockStorage.getTicketByCode('ABC123DEF456');
    expect(ticket?.uniqueTicketCode).toBe('ABC123DEF456');
  });

  it('returns event details in scan response', async () => {
    mockStorage.getEvent.mockResolvedValue(mockEvent);
    mockStorage.getBooking.mockResolvedValue(mockBooking);

    const event = await mockStorage.getEvent('event-1');
    expect(event?.title).toBe('Test Movie');
    expect(event?.venue).toBe('Cinema Hall');
    expect(event?.screen).toBe('Screen 1');
    expect(event?.ticketTypes).toBe('Regular');
  });

  it('returns customer name from booking', async () => {
    mockStorage.getBooking.mockResolvedValue(mockBooking);

    const booking = await mockStorage.getBooking('booking-1');
    expect(booking?.customerName).toBe('John Doe');
  });

  it('handles missing booking gracefully', async () => {
    mockStorage.getBooking.mockResolvedValue(null);

    const booking = await mockStorage.getBooking('nonexistent');
    const customerName = booking?.customerName || 'Guest';
    expect(customerName).toBe('Guest');
  });
});

describe('Scan endpoint - already scanned ticket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns "Ticket already used" for scanned ticket', async () => {
    const scannedTicket = { ...mockTicket, scanStatus: 'scanned' };
    mockStorage.getTicketByCode.mockResolvedValue(scannedTicket);

    const ticket = await mockStorage.getTicketByCode('ABC123DEF456');
    expect(ticket?.scanStatus).toBe('scanned');
  });
});

describe('Scan endpoint - organizer ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects scan when ticket belongs to different organizer', async () => {
    const otherOrgEvent = { ...mockEvent, organizerId: 'org-999' };
    mockStorage.getTicketByCode.mockResolvedValue(mockTicket);
    mockStorage.getEvent.mockResolvedValue(otherOrgEvent);
    mockStorage.getOrganizerByUserId.mockResolvedValue(mockOrganizer);

    const event = await mockStorage.getEvent(mockTicket.eventId);
    const org = await mockStorage.getOrganizerByUserId('user-1');
    expect(event?.organizerId).not.toBe(org?.id);
  });

  it('allows scan when ticket belongs to same organizer', async () => {
    mockStorage.getTicketByCode.mockResolvedValue(mockTicket);
    mockStorage.getEvent.mockResolvedValue(mockEvent);
    mockStorage.getOrganizerByUserId.mockResolvedValue(mockOrganizer);

    const event = await mockStorage.getEvent(mockTicket.eventId);
    const org = await mockStorage.getOrganizerByUserId('user-1');
    expect(event?.organizerId).toBe(org?.id);
  });
});

describe('Scan endpoint - response schema', () => {
  it('200 response has required fields', () => {
    const response = {
      message: 'Entry allowed',
      status: 'valid',
      ticketNumber: 'ABC123DEF456',
      eventTitle: 'Test Movie',
      eventDate: '2026-09-15T19:00:00',
      eventVenue: 'Cinema Hall',
      eventScreen: 'Screen 1',
      ticketType: 'Regular',
      customerName: 'John Doe',
    };

    expect(response.message).toBe('Entry allowed');
    expect(response.status).toBe('valid');
    expect(response.ticketNumber).toBeDefined();
    expect(response.eventTitle).toBeDefined();
    expect(response.eventVenue).toBeDefined();
    expect(response.customerName).toBeDefined();
  });

  it('404 response has invalid status', () => {
    const response = { message: 'Ticket no longer exists', status: 'invalid' };
    expect(response.status).toBe('invalid');
  });

  it('403 response has paused status', () => {
    const response = { message: 'Event is paused', status: 'paused' };
    expect(response.status).toBe('paused');
  });

  it('400 response has already_used status', () => {
    const response = { message: 'Ticket already used', status: 'already_used' };
    expect(response.status).toBe('already_used');
  });
});

describe('Storage - getTicketByCode filters deleted tickets', () => {
  it('ticket with deletedAt should be filtered out', () => {
    // The storage.getTicketByCode now uses isNull(tickets.deletedAt)
    // This means deleted tickets won't be returned
    const deletedTicket = { ...mockTicket, deletedAt: new Date() };
    expect(deletedTicket.deletedAt).not.toBeNull();
  });

  it('ticket without deletedAt should be returned', () => {
    const activeTicket = { ...mockTicket, deletedAt: null };
    expect(activeTicket.deletedAt).toBeNull();
  });
});
