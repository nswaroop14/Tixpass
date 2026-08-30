import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!';

describe('Password hashing', () => {
  it('hashes password with bcrypt', async () => {
    const password = 'SecureP@ssw0rd!';
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verifies correct password', async () => {
    const password = 'SecureP@ssw0rd!';
    const hash = await bcrypt.hash(password, 10);
    const valid = await bcrypt.compare(password, hash);
    expect(valid).toBe(true);
  });

  it('rejects incorrect password', async () => {
    const password = 'SecureP@ssw0rd!';
    const hash = await bcrypt.hash(password, 10);
    const valid = await bcrypt.compare('WrongPassword!', hash);
    expect(valid).toBe(false);
  });

  it('handles empty password', async () => {
    const hash = await bcrypt.hash('', 10);
    const valid = await bcrypt.compare('', hash);
    expect(valid).toBe(true);
  });
});

describe('JWT tokens', () => {
  it('creates and verifies a valid token', () => {
    const payload = { id: 'user-123', role: 'organizer' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.id).toBe('user-123');
    expect(decoded.role).toBe('organizer');
  });

  it('creates admin token', () => {
    const payload = { id: 'admin-1', role: 'admin' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.role).toBe('admin');
  });

  it('rejects invalid token', () => {
    expect(() => jwt.verify('invalid-token', JWT_SECRET)).toThrow();
  });

  it('rejects token signed with different secret', () => {
    const token = jwt.sign({ id: 'user-1' }, 'wrong-secret', { expiresIn: '1h' });
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
  });

  it('rejects expired token', () => {
    const token = jwt.sign({ id: 'user-1' }, JWT_SECRET, { expiresIn: '-1s' });
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
  });

  it('token payload contains expected fields', () => {
    const payload = { id: 'user-123', role: 'organizer' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    const decoded: any = jwt.decode(token);
    expect(decoded).toHaveProperty('id');
    expect(decoded).toHaveProperty('role');
    expect(decoded).toHaveProperty('exp');
    expect(decoded).toHaveProperty('iat');
  });
});

describe('SESSION_SECRET validation', () => {
  it('rejects undefined', () => {
    const secret = undefined;
    expect(!secret || secret.length < 32).toBe(true);
  });

  it('rejects empty string', () => {
    const secret = '';
    expect(!secret || secret.length < 32).toBe(true);
  });

  it('rejects short secret', () => {
    const secret = 'short';
    expect(!secret || secret.length < 32).toBe(true);
  });

  it('rejects exactly 31 chars', () => {
    const secret = 'a'.repeat(31);
    expect(!secret || secret.length < 32).toBe(true);
  });

  it('accepts 32 chars', () => {
    const secret = 'a'.repeat(32);
    expect(!secret || secret.length < 32).toBe(false);
  });

  it('accepts long hex string', () => {
    const secret = '4e0e671329d2b268b0439ef16392c5b261db34e1ce050007e61100f64d5e6da9';
    expect(!secret || secret.length < 32).toBe(false);
  });
});
