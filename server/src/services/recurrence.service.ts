export function computeOccurrences(
  recurrenceType: string,
  startDate: Date,
  endDate: Date | null,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  if (recurrenceType === 'NONE') {
    if (startDate >= rangeStart && startDate <= rangeEnd) {
      return [startDate];
    }
    return [];
  }

  const effectiveStart = rangeStart > startDate ? rangeStart : startDate;
  const effectiveEnd = endDate && endDate < rangeEnd ? endDate : rangeEnd;

  if (effectiveStart > effectiveEnd) return [];

  switch (recurrenceType) {
    case 'DAILY':
      return computeDailyOccurrences(effectiveStart, effectiveEnd);

    case 'WEEKLY':
      return computeWeeklyOccurrences(startDate, effectiveStart, effectiveEnd, 7);

    case 'BIWEEKLY':
      return computeWeeklyOccurrences(startDate, effectiveStart, effectiveEnd, 14);

    case 'MONTHLY':
      return computeMonthlyOccurrences(startDate, effectiveStart, effectiveEnd);

    default:
      return [];
  }
}

function utcDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d));
}

function sameUTCDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function addDaysUTC(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86400000);
}

function computeDailyOccurrences(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = utcDate(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endDay = utcDate(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  while (current <= endDay) {
    dates.push(new Date(current));
    current = addDaysUTC(current, 1);
  }
  return dates;
}

function computeWeeklyOccurrences(
  originalStart: Date,
  rangeStart: Date,
  rangeEnd: Date,
  intervalDays: number
): Date[] {
  const dates: Date[] = [];
  let current = utcDate(originalStart.getUTCFullYear(), originalStart.getUTCMonth(), originalStart.getUTCDate());
  const rangeStartDay = utcDate(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth(), rangeStart.getUTCDate());
  const rangeEndDay = utcDate(rangeEnd.getUTCFullYear(), rangeEnd.getUTCMonth(), rangeEnd.getUTCDate());

  while (current < rangeStartDay) {
    current = addDaysUTC(current, intervalDays);
  }

  while (current <= rangeEndDay) {
    dates.push(new Date(current));
    current = addDaysUTC(current, intervalDays);
  }

  return dates;
}

function computeMonthlyOccurrences(
  originalStart: Date,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const dates: Date[] = [];
  const targetDay = originalStart.getUTCDate();

  let year = rangeStart.getUTCFullYear();
  let month = rangeStart.getUTCMonth();

  const endYear = rangeEnd.getUTCFullYear();
  const endMonth = rangeEnd.getUTCMonth();

  while (year < endYear || (year === endYear && month <= endMonth)) {
    // Last day of this month
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const day = Math.min(targetDay, lastDay);
    const candidate = utcDate(year, month, day);

    if (candidate >= rangeStart && candidate <= rangeEnd && candidate >= originalStart) {
      dates.push(candidate);
    }

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return dates;
}
