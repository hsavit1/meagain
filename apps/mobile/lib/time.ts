export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(yyyyMmDd: string, days: number): string {
  const d = new Date(yyyyMmDd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dayOfWeekISO(yyyyMmDd: string): number {
  return new Date(yyyyMmDd + "T00:00:00Z").getUTCDay();
}

export function formatDateLong(yyyyMmDd: string): string {
  const d = new Date(yyyyMmDd + "T00:00:00Z");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateShort(yyyyMmDd: string): string {
  const d = new Date(yyyyMmDd + "T00:00:00Z");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function dayShortFromISO(yyyyMmDd: string): string {
  return DAYS[dayOfWeekISO(yyyyMmDd)];
}

export function dayLong(dayOfWeek: number): string {
  return DAYS_LONG[dayOfWeek];
}

export function dayShort(dayOfWeek: number): string {
  return DAYS[dayOfWeek];
}

export function dayNum(yyyyMmDd: string): number {
  return new Date(yyyyMmDd + "T00:00:00Z").getUTCDate();
}

export function formatTime12h(hhmm: string): string {
  const [hStr, m] = hhmm.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

export function formatTimeRange(startTime: string, duration: number): string {
  const end = addMinutes(startTime, duration);
  return `${formatTime12h(startTime)} – ${formatTime12h(end)}`;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(hhmm: string, minutes: number): string {
  return minutesToHHMM(timeToMinutes(hhmm) + minutes);
}

export function startOfWeekISO(yyyyMmDd: string): string {
  const dow = dayOfWeekISO(yyyyMmDd);
  return addDaysISO(yyyyMmDd, -dow);
}

export function diffDaysISO(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const dbb = new Date(b + "T00:00:00Z").getTime();
  return Math.round((da - dbb) / 86400000);
}
