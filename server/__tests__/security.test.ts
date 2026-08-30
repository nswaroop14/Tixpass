import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeAttr, isValidPaypalClientId, isSafeUrl, isSafePaymentUrl, isSafeImageUrl } from '../security.js';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('handles null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('handles numbers', () => {
    expect(escapeHtml(123 as any)).toBe('123');
  });

  it('escapes complex XSS payload - no executable tags', () => {
    const xss = '<img src=x onerror=alert(1)>：<script>document.cookie</script>';
    const result = escapeHtml(xss);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('&lt;img');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  it('does not double-escape', () => {
    const already = '&amp;';
    expect(escapeHtml(already)).toBe('&amp;amp;');
  });
});

describe('escapeAttr', () => {
  it('escapes quotes for attribute context', () => {
    expect(escapeAttr('a "b" c')).toBe('a &quot;b&quot; c');
  });

  it('handles special HTML in attributes', () => {
    const result = escapeAttr('"><script>alert(1)</script>');
    expect(result).not.toContain('>');
    expect(result).toContain('&quot;');
  });
});

describe('isValidPaypalClientId', () => {
  it('accepts valid PayPal client ID', () => {
    expect(isValidPaypalClientId('AfJ0AbCdEfGhIjKlMnOp')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidPaypalClientId('')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidPaypalClientId(null)).toBe(false);
  });

  it('rejects strings with special characters', () => {
    expect(isValidPaypalClientId('AfJ0<script>alert(1)</script>')).toBe(false);
  });

  it('rejects strings with spaces', () => {
    expect(isValidPaypalClientId('AfJ0 AbCdEfGhIj')).toBe(false);
  });

  it('rejects strings shorter than 10 chars', () => {
    expect(isValidPaypalClientId('short')).toBe(false);
  });

  it('rejects strings longer than 256 chars', () => {
    expect(isValidPaypalClientId('A'.repeat(257))).toBe(false);
  });

  it('accepts underscores and hyphens', () => {
    expect(isValidPaypalClientId('AfJ0_test-id_1234567890')).toBe(true);
  });
});

describe('isSafeUrl', () => {
  it('accepts http URLs', () => {
    expect(isSafeUrl('http://example.com')).toBe(true);
  });

  it('accepts https URLs', () => {
    expect(isSafeUrl('https://example.com/path?q=1')).toBe(true);
  });

  it('accepts relative paths', () => {
    expect(isSafeUrl('/event/abc')).toBe(true);
  });

  it('accepts hash fragments', () => {
    expect(isSafeUrl('#section')).toBe(true);
  });

  it('rejects javascript: URLs', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('JavaScript:alert(1)')).toBe(false);
  });

  it('rejects vbscript: URLs', () => {
    expect(isSafeUrl('vbscript:MsgBox(1)')).toBe(false);
  });

  it('rejects data: URLs', () => {
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false);
  });

  it('rejects null and empty', () => {
    expect(isSafeUrl(null)).toBe(false);
    expect(isSafeUrl('')).toBe(false);
  });

  it('rejects javascript: with whitespace prefix', () => {
    expect(isSafeUrl('  javascript:alert(1)')).toBe(false);
  });
});

describe('isSafePaymentUrl', () => {
  it('accepts https URLs', () => {
    expect(isSafePaymentUrl('https://paypal.com/pay/abc')).toBe(true);
  });

  it('accepts http URLs', () => {
    expect(isSafePaymentUrl('http://example.com')).toBe(true);
  });

  it('rejects relative paths', () => {
    expect(isSafePaymentUrl('/event/abc')).toBe(false);
  });

  it('rejects javascript:', () => {
    expect(isSafePaymentUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data:', () => {
    expect(isSafePaymentUrl('data:text/html,<script>x</script>')).toBe(false);
  });

  it('rejects null', () => {
    expect(isSafePaymentUrl(null)).toBe(false);
  });
});

describe('isSafeImageUrl', () => {
  it('accepts https image URLs', () => {
    expect(isSafeImageUrl('https://example.com/image.png')).toBe(true);
  });

  it('accepts data:image/ URLs', () => {
    expect(isSafeImageUrl('data:image/png;base64,abc123')).toBe(true);
    expect(isSafeImageUrl('data:image/jpeg;base64,abc123')).toBe(true);
  });

  it('rejects data:text/html', () => {
    expect(isSafeImageUrl('data:text/html,<script>x</script>')).toBe(false);
  });

  it('rejects javascript:', () => {
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects null', () => {
    expect(isSafeImageUrl(null)).toBe(false);
  });
});
