import { StringValue } from "ms";
import ms from "ms";

/**
 * Converts a duration string or number to milliseconds
 *
 * @param {(number | StringValue)} duration - Duration as string ('7d', '2m', '15m') or milliseconds
 * @returns {number} Duration in milliseconds
 *
 * @example
 * ```typescript
 * durationToMs('7d')  // 604800000
 * durationToMs('2m')  // 120000
 * durationToMs(60000) // 60000
 * ```
 */
export function durationToMs(duration: number | StringValue): number {
  if (typeof duration === "number") {
    return duration;
  }
  return ms(duration);
}
