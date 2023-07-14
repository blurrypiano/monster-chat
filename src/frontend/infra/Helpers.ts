import { EntIdType } from "./Ecs";

export function tryParseInt(value: any): number | undefined {
  if (typeof value === "number") return value;
  const num = parseInt(value);
  if (isNaN(num)) return undefined;
  return num;
}

export function tryParseString(value: any): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}

export function tryParseEntId(value: any): EntIdType | undefined {
  return tryParseInt(value);
}