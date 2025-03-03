import endOfDay from "date-fns/endOfDay";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function getEndOfToday() {
  const zone = "Asia/Seoul";
  return fromZonedTime(endOfDay(toZonedTime(new Date(), zone)), zone);
}

export function dateToInt(date: Date) {
  return Math.floor(date.getTime() / 1000);
}
