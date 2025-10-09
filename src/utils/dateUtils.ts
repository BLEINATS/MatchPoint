import { isWithinInterval as isWithinIntervalFns, eachDayOfInterval as eachDayOfIntervalFns, endOfDay as endOfDayFns } from 'date-fns';

/**
 * Parses a 'YYYY-MM-DD' string as a local date object, avoiding timezone issues.
 * new Date('2025-09-27') can be interpreted as UTC midnight, which might be the previous day in some timezones.
 * new Date(2025, 8, 27) is always interpreted in the local timezone.
 */
export const parseDateStringAsLocal = (dateString: string): Date => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Return an invalid date or throw an error if the format is wrong
    return new Date('invalid');
  }
  const [year, month, day] = dateString.split('-').map(Number);
  // Month is 0-indexed in JavaScript's Date constructor
  return new Date(year, month - 1, day);
};

export const isWithinInterval = isWithinIntervalFns;
export const eachDayOfInterval = eachDayOfIntervalFns;
export const endOfDay = endOfDayFns;
