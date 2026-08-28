import { startOfWeek, getISOWeek, getISOWeekYear, format } from "date-fns";

export function currentWeekStart(date = new Date()) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function rotationIndex(date: Date) {
  return getISOWeekYear(date) * 53 + getISOWeek(date);
}

export function weekLabel(weekStart: Date) {
  return `Week ${getISOWeek(weekStart)} · from ${format(weekStart, "d MMM")}`;
}
