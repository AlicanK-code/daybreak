import { test as base, expect, type Page } from '@playwright/test'

interface DemoState {
  habits: { id: string; title: string }[]
  completions: { habitId: string; completedOn: string; xpEarned: number }[]
}

// A Thursday afternoon: the demo's Mon/Wed/Fri workout isn't due, so 4 of its 5 habits are.
const THURSDAY = new Date('2026-09-24T15:00:00+01:00')
const YESTERDAY = '2026-09-23'

/**
 * Every test fails on console errors, uncaught exceptions or Content Security Policy violations,
 * so a problem that doesn't break a visible step still gets caught.
 */
const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = []
      await page.addInitScript(() =>
        addEventListener('securitypolicyviolation', (e) => console.error(`CSP blocked ${e.blockedURI} (${e.violatedDirective})`)),
      )
      page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
      page.on('pageerror', (e) => problems.push(e.message))
      await use(problems)
      expect(problems, 'console errors, exceptions or CSP violations').toEqual([])
    },
    { auto: true },
  ],
})

async function openDemo(page: Page) {
  await page.clock.install({ time: THURSDAY })
  await page.goto('/')
  await page.getByRole('button', { name: /Try the demo/ }).click()
  await expect(page.getByRole('img', { name: '0 of 4 habits done today' })).toBeVisible()
}

/** Reads the demo's saved data, changes it here in the test, writes it back and reloads. */
async function editDemoData(page: Page, change: (state: DemoState) => void) {
  const state: DemoState = JSON.parse((await page.evaluate(() => localStorage.getItem('questlog-demo-v1')))!)
  change(state)
  await page.evaluate((json) => localStorage.setItem('questlog-demo-v1', json), JSON.stringify(state))
  await page.reload()
  await expect(page.getByRole('img', { name: /habits done today/ })).toBeVisible()
}

test('opens the demo with only the habits due today', async ({ page }) => {
  await openDemo(page)
  await expect(page.getByRole('button', { name: /^Complete / })).toHaveCount(4)
  await expect(page.getByRole('button', { name: /^Complete Morning workout/ })).toHaveCount(0)

  await page.getByRole('button', { name: /Not today/ }).click()
  await expect(page.getByRole('button', { name: /Do Morning workout as an extra/ })).toBeVisible()
})

test('completes and undoes a habit', async ({ page }) => {
  await openDemo(page)
  await page.getByRole('button', { name: /^Complete Read 20 pages/ }).click()
  await expect(page.getByRole('img', { name: '1 of 4 habits done today' })).toBeVisible()
  await expect(page.getByText(/XP earned today/)).toBeVisible()

  await page.getByRole('button', { name: 'Undo Read 20 pages' }).click()
  await expect(page.getByRole('img', { name: '0 of 4 habits done today' })).toBeVisible()
})

test('adds a habit on a schedule that skips today', async ({ page }) => {
  await openDemo(page)
  await page.getByRole('button', { name: 'New habit' }).click()
  const dialog = page.getByRole('dialog', { name: 'New habit' })
  await dialog.getByPlaceholder('e.g. Read 20 pages').fill('Stretch')
  await dialog.getByRole('button', { name: 'Thursday' }).click()
  await expect(dialog.getByText('Mon, Tue, Wed, Fri, Sat, Sun')).toBeVisible()
  await dialog.getByRole('button', { name: 'Add habit' }).click()
  await expect(dialog).toBeHidden()

  // Not due on a Thursday: it's listed under "Not today", and today's total doesn't change.
  await expect(page.getByRole('button', { name: /^Complete Stretch/ })).toHaveCount(0)
  await expect(page.getByRole('img', { name: '0 of 4 habits done today' })).toBeVisible()
  await page.getByRole('button', { name: /Not today/ }).click()
  await expect(page.getByRole('button', { name: /Do Stretch as an extra/ })).toBeVisible()
})

async function expectEditDialogFits(page: Page) {
  await openDemo(page)
  await page.getByRole('button', { name: 'Edit Read 20 pages' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit habit' })
  await expect(dialog.getByRole('button', { name: 'Save changes' })).toBeVisible()

  const fit = await dialog.evaluate((d) => {
    const r = d.getBoundingClientRect()
    return { inside: r.top >= 0 && r.bottom <= innerHeight, scrolls: d.scrollHeight > d.clientHeight + 1 }
  })
  expect(fit).toEqual({ inside: true, scrolls: false })
  // Editing doesn't jump into the title field (on a phone that would pop up the keyboard).
  await expect(dialog.getByPlaceholder('e.g. Read 20 pages')).not.toBeFocused()
}

test('fits the edit dialog on screen without scrolling', async ({ page }) => {
  await expectEditDialogFits(page)
})

test.describe('on the shortest screen that gets the roomy form', () => {
  // The habit form spreads out from 640px wide and 864px tall (the `roomy` variant in index.css).
  test.use({ viewport: { width: 1280, height: 864 } })
  test.skip(({ isMobile }) => isMobile, 'a desktop window size')
  test('still fits the edit dialog without scrolling', async ({ page }) => {
    await expectEditDialogFits(page)
  })
})

test('celebrates a level-up', async ({ page }) => {
  await openDemo(page)
  // Bring the demo to just short of level 10, so the next tick crosses it.
  await editDemoData(page, (state) => {
    const total = state.completions.reduce((s, c) => s + c.xpEarned, 0)
    state.completions[0].xpEarned += Math.round(60 * Math.pow(9, 1.8)) - total - 5
  })
  await page.getByRole('button', { name: /^Complete Read 20 pages/ }).click()
  await expect(page.getByRole('heading', { name: 'You reached level 10' })).toBeVisible()
  await page.getByRole('button', { name: 'Onward!' }).click()
  await expect(page.getByRole('heading', { name: 'You reached level 10' })).toBeHidden()
})

test('fills in a habit missed yesterday', async ({ page }) => {
  await openDemo(page)
  await editDemoData(page, (state) => {
    const read = state.habits.find((h) => h.title === 'Read 20 pages')!
    state.completions = state.completions.filter((c) => !(c.habitId === read.id && c.completedOn === YESTERDAY))
  })
  await page.getByRole('button', { name: /not ticked off yesterday/ }).click()
  const dialog = page.getByRole('dialog', { name: /Wednesday 23 September/ })
  await dialog.getByRole('button', { name: /^Mark Read 20 pages as done/ }).click()
  await expect(dialog.getByRole('region', { name: 'Completed' }).getByText('Read 20 pages')).toBeVisible()
  await expect(dialog.getByText('Added later')).toBeVisible()
})

test('shows stats and trophies', async ({ page }) => {
  await openDemo(page)
  await page.getByRole('tab', { name: 'Stats' }).click()
  await expect(page.getByText('XP earned', { exact: true })).toBeVisible()
  await expect(page.locator('.recharts-surface').first()).toBeVisible()

  await page.getByRole('tab', { name: 'Trophies' }).click()
  await expect(page.getByText('Trophy cabinet')).toBeVisible()
})
