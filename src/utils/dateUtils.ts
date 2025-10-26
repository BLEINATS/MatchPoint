import { isWithinInterval as isWithinIntervalFns, eachDayOfInterval as eachDayOfIntervalFns, endOfDay as endOfDayFns } from 'date-fns';

/**
 * Parses a date string into a local Date object, handling both 'YYYY-MM-DD' and full ISO strings correctly.
 * - For full ISO strings (e.g., "2025-10-26T20:48:40.336Z"), it uses the standard `new Date()` constructor, which is reliable.
 * - For 'YYYY-MM-DD' strings, it parses them manually to avoid timezone issues where `new Date('YYYY-MM-DD')` can be interpreted as UTC midnight,
 *   potentially resulting in the previous day in some timezones.
 */
export const parseDateStringAsLocal = (dateString: string): Date => {
  if (!dateString) {
    return new Date('invalid');
  }

  // If it's a full ISO string (contains 'T'), new Date() is reliable.
  if (dateString.includes('T')) {
    const d = new Date(dateString);
    // Check if the date is valid before returning
    return !isNaN(d.getTime()) ? d : new Date('invalid');
  }

  // If it's just a date string 'YYYY-MM-DD', parse it manually to avoid timezone issues.
  const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch.map(Number);
    // Month is 0-indexed in JavaScript's Date constructor
    return new Date(year, month - 1, day);
  }

  // Fallback for other potential formats, though it might have timezone issues.
  const parsedDate = new Date(dateString);
  return !isNaN(parsedDate.getTime()) ? parsedDate : new Date('invalid');
};


export const isWithinInterval = isWithinIntervalFns;
export const eachDayOfInterval = eachDayOfIntervalFns;
export const endOfDay = endOfDayFns;
