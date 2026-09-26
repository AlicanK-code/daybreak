import { describe, expect, it } from 'vitest'
import { USERNAME_MAX, cleanUsername, fallbackName, usernameError } from './username'

describe('cleanUsername', () => {
  it('trims and collapses whitespace', () => {
    expect(cleanUsername('  Sun   Knight \n')).toBe('Sun Knight')
  })
})

describe('usernameError', () => {
  it('accepts ordinary names', () => {
    for (const name of ['Tanjiro', 'Sun Knight', 'akn_9', "O'Brien", 'dark.lord-94', 'Çağla', '竈門炭治郎']) {
      expect(usernameError(name)).toBeNull()
    }
  })

  it('rejects empty or whitespace-only names', () => {
    expect(usernameError('')).toMatch(/enter/i)
    expect(usernameError('    ')).toMatch(/enter/i)
  })

  it('enforces the length limits on the cleaned-up name', () => {
    expect(usernameError('a')).toMatch(/at least/i)
    expect(usernameError('ab')).toBeNull()
    expect(usernameError('x'.repeat(USERNAME_MAX))).toBeNull()
    expect(usernameError('x'.repeat(USERNAME_MAX + 1))).toMatch(/or fewer/i)
    // Extra spaces don't count against the limit.
    expect(usernameError(`  ${'x'.repeat(USERNAME_MAX)}  `)).toBeNull()
  })

  it('rejects symbols, emoji and markup', () => {
    for (const name of ['<script>', 'a@b', 'fire🔥', 'hi!', 'a/b']) {
      expect(usernameError(name)).toMatch(/only/i)
    }
  })
})

describe('fallbackName', () => {
  it('uses the part of the email before the @', () => {
    expect(fallbackName('player42@example.com')).toBe('player42')
  })

  it('falls back to Adventurer when there is no email', () => {
    expect(fallbackName(undefined)).toBe('Adventurer')
    expect(fallbackName('@example.com')).toBe('Adventurer')
  })
})
