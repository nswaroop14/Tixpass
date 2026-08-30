import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';

const TEST_KEY = crypto.randomBytes(32).toString('base64');
process.env.BANK_ENCRYPTION_KEY = TEST_KEY;

const { encryptObject, decryptToObject } = await import('../crypto.js');

describe('encryptObject / decryptToObject', () => {
  it('encrypts and decrypts an object', () => {
    const data = { bankName: 'Bank of Cyprus', accountNumber: '123456' };
    const encrypted = encryptObject(data);
    expect(encrypted).not.toBe(JSON.stringify(data));
    expect(encrypted.startsWith('enc:')).toBe(true);

    const decrypted = decryptToObject(encrypted);
    expect(decrypted).toEqual(data);
  });

  it('produces different ciphertext for same input (random IV)', () => {
    const data = { accountNumber: '123456' };
    const enc1 = encryptObject(data);
    const enc2 = encryptObject(data);
    expect(enc1).not.toBe(enc2);
  });

  it('decrypts to the same plaintext', () => {
    const data = { accountNumber: '123456', routing: '021000021' };
    const encrypted = encryptObject(data);
    expect(decryptToObject(encrypted)).toEqual(data);
  });

  it('handles complex nested objects', () => {
    const data = {
      bankName: 'Test Bank',
      accountHolder: 'John Doe',
      accountNumber: '123456789',
      nested: { key: 'value', array: [1, 2, 3] },
    };
    const encrypted = encryptObject(data);
    const decrypted = decryptToObject(encrypted);
    expect(decrypted).toEqual(data);
  });

  it('throws on tampered ciphertext', () => {
    const data = { accountNumber: '123456' };
    const encrypted = encryptObject(data);
    const tampered = encrypted.slice(0, -5) + 'XXXXX';
    expect(() => decryptToObject(tampered)).toThrow();
  });

  it('handles empty object', () => {
    const data = {};
    const encrypted = encryptObject(data);
    expect(decryptToObject(encrypted)).toEqual(data);
  });

  it('handles strings with special characters', () => {
    const data = { name: '<script>alert("xss")</script>' };
    const encrypted = encryptObject(data);
    const decrypted = decryptToObject(encrypted);
    expect(decrypted.name).toBe('<script>alert("xss")</script>');
  });

  it('handles backward compatibility with plaintext JSON', () => {
    const data = { bankName: 'Test', accountNumber: '123' };
    const plaintext = JSON.stringify(data);
    const decrypted = decryptToObject(plaintext);
    expect(decrypted).toEqual(data);
  });
});
