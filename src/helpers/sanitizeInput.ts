type AnyObject = Record<string, any>;

export function SanitizeInput<T extends AnyObject>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === "string" && value.trim() === "" ? null : value,
    ])
  ) as T;
}
