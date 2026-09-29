export function formatEventValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2) ?? String(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}
