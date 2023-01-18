import endOfDay from "date-fns/endOfDay";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

export function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function getEndOfToday() {
  const zone = "Asia/Seoul";
  return zonedTimeToUtc(endOfDay(utcToZonedTime(new Date(), zone)), zone);
}
