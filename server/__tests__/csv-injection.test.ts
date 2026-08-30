import { describe, it, expect } from 'vitest';

function sanitizeCsv(v: string): string {
  const escaped = v.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(escaped)) return `'${escaped}`;
  return escaped;
}

describe('CSV injection prevention', () => {
  it('sanitizes formula starting with =', () => {
    const result = sanitizeCsv('=CMD("calc")');
    expect(result).toMatch(/^'/);
    expect(result).toContain('CMD');
  });

  it('sanitizes formula starting with +', () => {
    expect(sanitizeCsv('+1+1')).toBe("'+1+1");
  });

  it('sanitizes formula starting with -', () => {
    expect(sanitizeCsv('-1+1')).toBe("'-1+1");
  });

  it('sanitizes formula starting with @', () => {
    expect(sanitizeCsv('@SUM(1,1)')).toBe("'@SUM(1,1)");
  });

  it('sanitizes formula starting with tab', () => {
    const result = sanitizeCsv('\t=CMD("calc")');
    expect(result).toMatch(/^'/);
    expect(result).toContain('\t');
  });

  it('does not sanitize normal text', () => {
    expect(sanitizeCsv('John Doe')).toBe('John Doe');
  });

  it('does not sanitize email', () => {
    expect(sanitizeCsv('john@example.com')).toBe('john@example.com');
  });

  it('escapes double quotes', () => {
    expect(sanitizeCsv('Say "hello"')).toBe('Say ""hello""');
  });

  it('handles empty string', () => {
    expect(sanitizeCsv('')).toBe('');
  });

  it('does not sanitize numbers as strings', () => {
    expect(sanitizeCsv('12345')).toBe('12345');
  });

  it('sanitizes XSS-like CSV payload starting with =', () => {
    const xss = '=HYPERLINK("https://evil.com")';
    const result = sanitizeCsv(xss);
    expect(result).toMatch(/^'/);
    expect(result).toContain('HYPERLINK');
  });
});
