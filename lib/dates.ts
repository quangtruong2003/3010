export const VN_START = new Date("2022-10-30T00:00:00+07:00").getTime();
export function splitDuration(now: number) {
  const seconds = Math.max(0, Math.floor((now - VN_START) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor((seconds % 86400) / 3600), minutes: Math.floor((seconds % 3600) / 60), seconds: seconds % 60 };
}
export function pad(n: number) { return String(n).padStart(2, "0"); }