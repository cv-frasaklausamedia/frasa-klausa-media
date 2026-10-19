/**
 * Parses the raw value of the `sidebar_state` cookie.
 * 
 * Rules:
 * - Only the exact string "false" is considered collapsed (returns false).
 * - Empty, undefined, null, or any other value defaults to expanded (returns true).
 */
export function parseSidebarCookie(value: string | undefined | null): boolean {
  return value !== "false";
}
