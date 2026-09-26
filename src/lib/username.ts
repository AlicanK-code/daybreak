/** Rules for the name shown on the player card. It's a display name, so it doesn't need to be unique. */

export const USERNAME_MIN = 2
export const USERNAME_MAX = 24

// Letters in any language, digits, spaces and a few friendly separators.
const ALLOWED = /^[\p{L}\p{N} _\-.']+$/u

/** Trims and collapses runs of whitespace, so "  Sun   Knight " becomes "Sun Knight". */
export function cleanUsername(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

/** Why a username can't be used, or null if it's fine. Checks the cleaned-up form. */
export function usernameError(raw: string): string | null {
  const name = cleanUsername(raw)
  if (name.length === 0) return 'Enter a username.'
  if (name.length < USERNAME_MIN) return `Use at least ${USERNAME_MIN} characters.`
  if (name.length > USERNAME_MAX) return `Keep it to ${USERNAME_MAX} characters or fewer.`
  if (!ALLOWED.test(name)) return "Use letters, numbers, spaces and _ - . ' only."
  return null
}

/** The name to show when none has been set: the part of the email before the @. */
export function fallbackName(email: string | undefined): string {
  return email?.split('@')[0] || 'Adventurer'
}
