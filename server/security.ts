/**
 * Security utilities for TixPass
 * Centralized HTML escaping and validation functions.
 */

/**
 * Escapes special characters for safe insertion into HTML text content.
 * Converts: & < > " '
 */
export function escapeHtml(str: string | undefined | null): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapes a value for safe use inside an HTML attribute value.
 * Uses escapeHtml which covers quotes and angle brackets.
 */
export function escapeAttr(str: string | undefined | null): string {
  return escapeHtml(str);
}

/**
 * Validates a PayPal Client ID format.
 * Rejects anything that could inject into a script URL.
 */
export function isValidPaypalClientId(id: string | undefined | null): boolean {
  if (!id || typeof id !== 'string') return false;
  // PayPal client IDs are alphanumeric with hyphens and underscores
  // Typical format: "AfJ0..."
  return /^[A-Za-z0-9_-]{10,256}$/.test(id);
}

/**
 * Validates a URL to ensure it only uses allowed protocols.
 * Rejects javascript:, data:, vbscript:, and other dangerous schemes.
 * Only allows http, https, relative paths, and # fragments.
 */
export function isSafeUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (/^(javascript:|vbscript:|data:)/i.test(trimmed)) return false;
  // Only allow http, https, relative paths, and # fragments
  return /^(https?:\/\/|\/|#)/.test(trimmed);
}

/**
 * Strict URL validator for payment and navigation links.
 * Only allows http/https — no data:, no javascript:, no relative paths.
 */
export function isSafePaymentUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (/^(javascript:|vbscript:|data:)/i.test(trimmed)) return false;
  return /^https?:\/\//.test(trimmed);
}

/**
 * URL validator for image sources (banner, logo, poster).
 * Allows http/https and data:image (for base64 inline images).
 */
export function isSafeImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (/^(javascript:|vbscript:|data:(?!image\/))/i.test(trimmed)) return false;
  return /^(https?:\/\/|data:image\/)/.test(trimmed);
}
