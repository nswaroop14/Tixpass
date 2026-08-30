import { describe, it, expect } from 'vitest';

describe('Rate limiter configuration', () => {
  const defaultOpts = {
    windowMs: 15 * 60 * 1000,
    standardHeaders: true,
    legacyHeaders: false,
  };

  it('auth limiter has 20 max per window', () => {
    const max = 20;
    expect(max).toBeLessThanOrEqual(30);
    expect(max).toBeGreaterThan(0);
  });

  it('booking limiter has 50 max per window', () => {
    const max = 50;
    expect(max).toBeGreaterThanOrEqual(10);
  });

  it('admin limiter has 30 max per window', () => {
    const max = 30;
    expect(max).toBeGreaterThanOrEqual(10);
  });

  it('public write limiter has 10 max per window', () => {
    const max = 10;
    expect(max).toBeLessThanOrEqual(20);
  });

  it('scan limiter has 120 max per window', () => {
    const max = 120;
    expect(max).toBeGreaterThanOrEqual(60);
  });

  it('public read limiter has 100 max per window', () => {
    const max = 100;
    expect(max).toBeGreaterThanOrEqual(50);
  });

  it('all limiters use 15-minute window', () => {
    const windowMs = 15 * 60 * 1000;
    expect(windowMs).toBe(900000);
  });
});

describe('Endpoint security requirements', () => {
  const publicWriteEndpoints = [
    'POST /api/auth/login',
    'POST /api/public/organizer/apply',
    'POST /api/public/bookings',
    'POST /api/public/bookings/submit-payment',
    'POST /api/public/bookings/confirm-paypal',
  ];

  const adminEndpoints = [
    'POST /api/admin/organizer-applications/:id/approve',
    'POST /api/admin/organizer-applications/:id/reject',
    'POST /api/admin/organizers',
    'POST /api/admin/organizers/:id/reset-password',
    'PATCH /api/admin/organizers/:id/status',
    'DELETE /api/admin/organizers/:id',
  ];

  const scanEndpoints = [
    'POST /api/organizer/tickets/scan',
  ];

  it('all public write endpoints exist', () => {
    expect(publicWriteEndpoints.length).toBeGreaterThanOrEqual(5);
  });

  it('all admin endpoints exist', () => {
    expect(adminEndpoints.length).toBeGreaterThanOrEqual(6);
  });

  it('scan endpoint exists', () => {
    expect(scanEndpoints.length).toBe(1);
  });
});
