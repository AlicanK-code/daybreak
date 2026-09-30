# Firefox performance

Daybreak runs smoothly in Chrome but stutters in Firefox. A fix is ready on the
[`firefox-performance`](https://github.com/AlicanK-code/questlog/tree/firefox-performance) branch, kept
off `main` for now because it trades away the frosted-glass blur behind the cards. This note records
what was measured, so the work can be merged or redone later.

## The problem

Frame rate on the Today screen in demo mode at 1920×1080, measured in headless browsers (no graphics
card, so close to a worst case). Each figure is the median of three 3.5-second runs after a warm-up.

| | Chrome | Firefox |
|---|---|---|
| As released in 0.9.0 | 144 fps | **18 fps** (over 90% of frames stuttering) |
| With the fix | 144 fps | **58–65 fps** |

## What costs the frames

Measured in Firefox by switching each effect off in turn:

- **Live frosted blur (`backdrop-filter`) on every card**, over the fire that redraws 12 times a
  second. The biggest single cost: Firefox re-blurs every card whenever the fire behind it changes.
  Removing it roughly doubles the frame rate.
- **16 separately animated spark elements** drifting up the screen. Each triggers its own repaints;
  on their own they cost about half the remaining frame rate. Tweaks (smooth vs stepped motion, no CSS
  variables in the keyframes, `will-change`) made no real difference.
- **The player card's pulsing border glow**, repainting every frame. Updating it in 12 steps per
  cycle instead of continuously recovers most of its cost.
- Cheap, so worth keeping: the glow filters on the flames and XP bar (a few fps), the flame badge
  flicker, and the pixel fire itself (about 20 fps in this worst case).

## The fix on the branch

- Cards stay see-through, slightly more opaque, **without the live blur**. The tab bar and dialog
  backgrounds lose their blur too.
- **Sparks are drawn inside the pixel-fire canvas** (`stepSparks` / `paintSparks` in
  `src/lib/pixelFire.ts`, with tests), so fire and sparks redraw together as one layer.
- The border glow **pulses in 12 steps** (`steps(12)`) instead of every frame.

The only visible difference is that the fire behind the cards shows as crisp, dimmer pixels instead of
a soft blurred glow.

## Options for later

- **Merge the branch as is.** It may need conflicts resolved if `main` has moved on.
- **Fake the frost cheaply:** draw the tiny fire image a second time with smooth (not pixelated)
  scaling, which blurs it for free, and show it only behind the cards. This could restore the frosted
  look without the cost, but it must be measured, since keeping it aligned with the cards while
  scrolling could cost frames.
- **Step down automatically:** keep the full effects, and drop the blur and sparks when the frame
  rate falls. It keeps the best look on fast devices, at the cost of more complexity and harder
  testing.

## How it was measured

A Node script drove headless Chrome (DevTools protocol) and headless Firefox (WebDriver BiDi) against
the demo, injected CSS to switch individual effects off, and recorded `requestAnimationFrame`
intervals: average fps, 95th-percentile frame time, and the share of frames over 25 ms.
