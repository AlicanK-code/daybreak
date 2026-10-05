import { test as base, expect, type Page } from '@playwright/test'

interface DemoState {
  habits: { id: string; title: string }[]
  completions: { habitId: string; completedOn: string; xpEarned: number }[]
  tasks: { xpEarned: number }[]
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
  // Habit buttons only ("Complete task …" ones are tasks).
  await expect(page.getByRole('button', { name: /^Complete (?!task )/ })).toHaveCount(4)
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
  await page.getByRole('button', { name: 'New habit or task' }).click()
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

test('adds a one-off task and ticks it off for XP, without touching the habit total', async ({ page }) => {
  await openDemo(page)
  const tasks = page.getByRole('region', { name: 'Tasks' })
  // The demo's overdue task is listed first, with how late it is.
  await expect(tasks.getByText('2 days late')).toBeVisible()

  await page.getByRole('button', { name: 'New habit or task' }).click()
  await page.getByRole('radio', { name: /Task/ }).click()
  const dialog = page.getByRole('dialog', { name: 'New task' })
  await dialog.getByPlaceholder(/dentist/).fill('Post the parcel')
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(dialog).toBeHidden()

  await tasks.getByRole('button', { name: /^Complete task Post the parcel for 10 XP/ }).click()
  await expect(tasks.getByRole('button', { name: 'Undo Post the parcel' })).toBeVisible()
  await expect(page.getByText('+10 XP earned today')).toBeVisible()
  await expect(page.getByRole('img', { name: '0 of 4 habits done today' })).toBeVisible()

  // A task for later goes under "Upcoming tasks", not today's list.
  await page.getByRole('button', { name: 'New habit or task' }).click()
  const next = page.getByRole('dialog', { name: 'New task' }) // the form remembers it was adding tasks
  await next.getByPlaceholder(/dentist/).fill('Pay the car tax')
  await next.getByRole('button', { name: 'Tomorrow', exact: true }).click()
  await next.getByRole('button', { name: 'Add task' }).click()
  await expect(next).toBeHidden()
  await expect(tasks.getByText('Pay the car tax')).toHaveCount(0)
  await page.getByRole('button', { name: /Upcoming tasks/ }).click()
  await expect(page.getByText('Pay the car tax')).toBeVisible()
})

test("won't set a task's due date in the past", async ({ page }) => {
  await openDemo(page)
  await page.getByRole('button', { name: 'Edit Fix the bike' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit task' })
  await dialog.getByRole('button', { name: 'Pick date' }).click()
  const date = dialog.getByLabel('Due date')
  await date.fill('2025-03-05')
  await expect(dialog.getByRole('alert')).toHaveText('Pick today or a later date.')
  await expect(dialog.getByRole('button', { name: 'Save changes' })).toBeDisabled()

  await date.fill('2026-10-01')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toBeHidden()
  await page.getByRole('button', { name: /Upcoming tasks/ }).click()
  await expect(page.getByText('Thu 1 Oct')).toBeVisible()
})

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
    const total = [...state.completions, ...state.tasks].reduce((s, c) => s + c.xpEarned, 0)
    state.completions[0].xpEarned += Math.round(60 * Math.pow(9, 1.8)) - total - 5
  })
  await page.getByRole('button', { name: /^Complete Read 20 pages/ }).click()
  await expect(page.getByRole('heading', { name: 'You reached level 10' })).toBeVisible()
  await page.getByRole('button', { name: 'Onward!' }).click()
  await expect(page.getByRole('heading', { name: 'You reached level 10' })).toBeHidden()

  // The trophy notification closes straight away with reduced motion (no burn).
  await expect(page.getByText('Reach level 10')).toBeVisible()
  await page.getByRole('button', { name: 'Dismiss' }).click()
  await expect(page.getByText('Reach level 10')).toBeHidden()
})

test.describe('with animations on', () => {
  // The other tests run with reduced motion, which skips the ember effects; these draw them for real.
  test.use({ reducedMotion: 'no-preference' })

  test('bursts embers from a ticked habit, and sends an ember storm up on a level-up', async ({ page }) => {
    await openDemo(page)
    const embers = page.locator('canvas[data-celebration]')
    // Count lit pixels on the ember canvas, to tell it's actually drawing.
    const lit = () =>
      embers.evaluate((c: HTMLCanvasElement) => {
        const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
        let n = 0
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++
        return n
      })

    await page.getByRole('button', { name: /^Complete Drink 2L of water/ }).click()
    await expect(embers).toBeAttached()
    await expect.poll(lit).toBeGreaterThan(0)
    // The burst burns out and the canvas clears.
    await expect.poll(lit, { timeout: 5000 }).toBe(0)

    await editDemoData(page, (state) => {
      const total = [...state.completions, ...state.tasks].reduce((s, c) => s + c.xpEarned, 0)
      state.completions[0].xpEarned += Math.round(60 * Math.pow(9, 1.8)) - total - 5
    })
    await page.getByRole('button', { name: /^Complete Read 20 pages/ }).click()
    await expect(page.getByRole('heading', { name: 'You reached level 10' })).toBeVisible()
    await expect.poll(lit).toBeGreaterThan(0)
  })

  test('burns a dismissed notification away like a scroll, then removes it', async ({ page }) => {
    await openDemo(page)
    await editDemoData(page, (state) => {
      const total = [...state.completions, ...state.tasks].reduce((s, c) => s + c.xpEarned, 0)
      state.completions[0].xpEarned += Math.round(60 * Math.pow(9, 1.8)) - total - 5
    })
    await page.getByRole('button', { name: /^Complete Read 20 pages/ }).click()
    await page.getByRole('button', { name: 'Onward!' }).click()

    const note = page.locator('[aria-live] > div').filter({ hasText: 'Reach level 10' })
    await expect(note).toBeVisible()
    await note.getByRole('button', { name: 'Dismiss' }).click()
    // While it burns, the notification is masked away bit by bit, under the real security headers.
    await expect.poll(() => note.evaluate((el) => getComputedStyle(el).maskImage)).toContain('data:image/png')
    await expect(note).toHaveCount(0, { timeout: 4000 })
  })
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
