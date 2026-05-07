function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function isValidYMD(year: number, month1: number, day: number): boolean {
  if (month1 < 1 || month1 > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(year, month1 - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month1 - 1 &&
    d.getDate() === day
  );
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

const WEEKDAY_ALIASES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

export function parseNaturalDate(
  input: string,
  today: Date = new Date(),
): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  if (raw === "today") return toISODate(today);
  if (raw === "tomorrow" || raw === "tom") return toISODate(addDays(today, 1));

  // YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    if (!isValidYMD(y, m, d)) return null;
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // MM/DD or MM/DD/YYYY
  const mdMatch = raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (mdMatch) {
    const m = Number(mdMatch[1]);
    const d = Number(mdMatch[2]);
    const explicitY = mdMatch[3] ? Number(mdMatch[3]) : undefined;
    if (explicitY !== undefined) {
      if (!isValidYMD(explicitY, m, d)) return null;
      return toISODate(new Date(explicitY, m - 1, d));
    }

    const y = today.getFullYear();
    if (!isValidYMD(y, m, d)) return null;
    let candidate = new Date(y, m - 1, d);
    // If already passed (strictly before today), bump to next year.
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    if (candidate.getTime() < todayStart.getTime()) {
      if (!isValidYMD(y + 1, m, d)) return null;
      candidate = new Date(y + 1, m - 1, d);
    }
    return toISODate(candidate);
  }

  // Weekday names: next occurrence; if same weekday, pick next week.
  const wd = WEEKDAY_ALIASES[raw];
  if (wd !== undefined) {
    const todayDow = today.getDay();
    let delta = (wd - todayDow + 7) % 7;
    if (delta === 0) delta = 7;
    return toISODate(addDays(today, delta));
  }

  // Relative: +Nd, +Nw, +Nm
  const relMatch = raw.match(/^\+(\d+)\s*([dwm])$/);
  if (relMatch) {
    const n = Number(relMatch[1]);
    const unit = relMatch[2];
    if (!Number.isFinite(n)) return null;
    const resolved =
      unit === "d"
        ? addDays(today, n)
        : unit === "w"
          ? addWeeks(today, n)
          : addMonths(today, n);
    return toISODate(resolved);
  }

  return null;
}

export const DATE_PRESETS: { label: string; value: string }[] = [
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "+3d", value: "+3d" },
  { label: "+1w", value: "+1w" },
  { label: "+2w", value: "+2w" },
  { label: "+1m", value: "+1m" },
  { label: "Clear", value: "clear" },
];
