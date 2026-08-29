import { format } from "date-fns";

export function parseWallClock(isoString: string): Date {
  const clean = isoString.replace('Z', '').split('T');
  const [year, month, day] = clean[0].split('-').map(Number);
  const [hour = 0, minute = 0] = clean[1]?.split(':').map(Number) || [];
  return new Date(year, month - 1, day, hour, minute);
}

export function formatEventDate(isoString: string, pattern = "EEE, MMM d"): string {
  return format(parseWallClock(isoString), pattern);
}

export function formatEventTime(isoString: string, pattern = "h:mm a"): string {
  return format(parseWallClock(isoString), pattern);
}

export function formatEventDateTime(isoString: string, pattern = "d MMM yyyy · h:mm a"): string {
  return format(parseWallClock(isoString), pattern);
}

export function toDateTimeLocal(isoString: string): string {
  const d = parseWallClock(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}