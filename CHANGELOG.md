# Changelog

All notable changes to Daybreak (called QuestLog until 0.14.0) are recorded here, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/): a new **minor** version (0.x.0) for new features or
significant UI changes, a **patch** (0.x.y) for fixes only.

Each version is grouped into **Features** (new functionality), **UI & design** (visual changes)
and **Fixes** (bugs fixed). Changes collect under **Unreleased** until they're released as a
version; each release is tagged in git (e.g. `v0.7.0`).

## [Unreleased]

### Features

- **Custom schedules**: choose which weekdays a habit repeats on (e.g. Mon, Wed, Fri) with the new
  "Repeat on" day picker. Streaks and the streak XP bonus only count the days a habit is due, so a
  rest day no longer breaks them, and your day streak skips days when nothing was due.
- Habits that aren't due today move into a collapsible **Not today** list. You can still do one as
  an extra: it earns XP but doesn't change its streak, and shows as "Extra" in the day overview.
- Changing a schedule applies from today on. Past days keep the schedule they had, so a change
  never turns old days into misses.
- Perfect days, missed habits, filling in past days and completion rates all follow the schedule.
  The demo's workout habit is now on Mon, Wed and Fri.
- Needs a database update: run `supabase/migrations/20261001000000_habit_schedule.sql`.

## [0.14.0] - 2026-09-30

### UI & design

- **QuestLog is now Daybreak**: a fresh start every morning, matching the fire and sun theme. The
  new name is on the header, sign-in screen, browser tab and installed app. Your data, settings and
  web address are unchanged; an installed app picks up the new name after its next update, though
  some phones keep the old home-screen label until it's reinstalled.
- The new-habit button reads **Add habit**.

## [0.13.0] - 2026-09-30

### UI & design

- **The day overview and level flames dialogs now open in the middle of the screen on phones**
  instead of sliding up from the bottom. Forms (new habit, edit habit, username) stay as bottom
  sheets, close to your thumb and the keyboard.

## [0.12.0] - 2026-09-30

### Features

- **Install QuestLog as an app.** On a phone, use the browser's "Install app" / "Add to Home Screen";
  on desktop Chrome or Edge, use the install button in the address bar. It opens full screen with
  its own katana icon, starts instantly, and the app itself loads offline. Signing in and your
  habits still need a connection. Updates arrive automatically each time the site is deployed.

## [0.11.0] - 2026-09-29

### UI & design

- **New logo:** a katana pointing downwards with a spiral of spiky fire winding round its blade,
  replacing the shield, and shown larger in the header and on the sign-in screen. A simplified,
  bolder version is used at small sizes and as the browser tab icon, which until now still showed
  the old purple shield.
- The browser's toolbar colour on phones now matches the ember theme instead of the old purple.

## [0.10.0] - 2026-09-29

### Features

- **Turn habits off and on.** "Turn off" in a habit's edit screen (replacing Archive) hides it from
  Today and stops it counting. Turned-off habits collect in a **Turned off** list below your habits,
  each with a switch to turn it back on, keeping its history, streak record and settings. Days it
  was off count as missed once it's back on.

## [0.9.0] - 2026-09-29

### Features

- **Fill in or undo past days.** In Stats → Activity, tap any day from the last 7 days and tap a
  habit to switch it between done and not done, so a forgotten tick doesn't cost you a streak.
  Filled-in days earn the XP they would have earned on the day, including the streak bonus, and
  streaks heal straight away; XP already earned on later days stays as it was.
- A **"not ticked off yesterday"** shortcut appears on Today when yesterday has unfinished habits,
  opening yesterday's overview to fill them in.

### UI & design

- The **level-up celebration** now shows the new flame badge, rising up large in the middle of the
  popup, instead of the old round sun disc.
- Completions filled in after the day show an **Added later** tag in the daily overview.

### Fixes

- Early Bird and Night Owl trophies only count habits ticked off on the day itself, not ones filled
  in later.

## [0.8.1] - 2026-09-29

### Fixes

- Dialogs opened from inside a card, such as a day's overview in Stats → Activity, now cover the
  whole screen again instead of being cut off and hidden behind the cards below (a regression from
  the frosted cards in 0.8.0).

## [0.8.0] - 2026-09-28

### Features

- **Priority habits come first** on the Today list, hardest first (hard, then medium, then easy),
  and alphabetically when they share a difficulty. The rest of your habits follow in your own
  order.

### UI & design

- Priority habits show a flag in place of the drag handle, since they're placed automatically;
  drag-to-reorder (and the arrow keys) now arranges your other habits.
- **Finished habits move to the bottom** of the Today list, gliding down when you tick them off
  and back up if you undo them.
- Cards on the Today, Stats and Trophies screens are now **frosted and see-through**, like the tab
  bar, so the fire glows softly behind them.

## [0.7.0] - 2026-09-28

### Features

- Tapping the level badge opens a **Level flames** dialog showing the flame at each rank
  (Novice, Apprentice, Adventurer, Knight, Champion, Hero, Legend) and at full blaze (level 25+),
  with the level range and XP for each. Your current stage is highlighted and stages still ahead
  are dimmed.

### UI & design

- The circular level badge is now a layered **flame** with the level number inside. It grows by
  the same amount with every level and burns fiercer, from warm orange-gold to deep crimson with a
  stronger glow and faster flicker, reaching full blaze at level 25. It pops on level-up and holds
  still for reduced motion.

## [0.6.0] - 2026-09-27

### Features

- **Reorder habits** by dragging the grip handle on each card (mouse or touch), or with the arrow
  keys on the handle. The new order saves when you drop the habit.
- **Priority labels**: mark any habit as a priority from the habit form.

### UI & design

- Priority habits show a flame-coloured **Priority** chip and a glowing ember edge on the card.

## [0.5.0] - 2026-09-27

### Features

- **Daily overview**: tap any day in Stats → Activity to see the habits you completed that day
  (with the time and XP for each) and those you missed, plus the day's XP and a perfect-day badge.
  For today, unfinished habits show as "still to do". Habits only count as missed on days they
  existed.

### Fixes

- The app no longer goes blank when it loads while the window reports zero width, such as when a
  page loads in the background.

## [0.4.0] - 2026-09-26

### UI & design

- The whole app moves from violet to the **Sun Breathing** fire theme: ember panels with a heated
  rim on every card, a fire logo, an ember activity heatmap and charts, fire-coloured confetti and a
  sun-disc level-up badge.
- A brighter, warmer palette overall.
- A faint **pixel-fire background** burns along the bottom of the screen, with pixel sparks
  drifting up out of it. It pauses in hidden tabs and shows a still frame for reduced motion.

### Fixes

- Empty days in the activity heatmap stay visible on the card.

## [0.3.0] - 2026-09-26

### Features

- **Usernames**: choose one when creating an account, or change it any time from the pencil on the
  player card. Accounts keep it on their profile; demo mode keeps it in the browser.

## [0.2.0] - 2026-09-26

### Features

- A synthesized **whoosh** sound when you gain XP (respects the mute toggle).

### UI & design

- **Sun Breathing XP bar**: a burning blade with a flame ball at your current XP, trailing a
  three-pronged tail of fire, with small streaks of flame flying off it. XP gains flare the flames.
- The player card is restyled to match: a dark ember panel with a slowly pulsing glow on its
  border, a sun-disc level badge, a gold rank title and a fire-coloured streak chip.

### Fixes

- XP gains are only celebrated once your data has loaded, so opening the app doesn't trigger the
  flare and whoosh.

## [0.1.0] - 2026-09-25

The first version of QuestLog, a gamified daily habit tracker.

### Features

- Daily habits with **XP** by difficulty (easy 10, medium 20, hard 35) and a streak bonus of +5%
  per consecutive day, up to +50%.
- **Levels** with rank titles, **streaks**, and a **trophy cabinet** of badges.
- **Stats**: XP earned over the last 30 days, a 16-week activity heatmap, and each habit's streaks
  and 30-day completion rate.
- **Celebrations**: sounds and confetti for completions, level-ups and badges, with a mute toggle
  and support for reduced motion.
- **Accounts** with Supabase (email sign-in, with each user's data private to them), plus a
  **demo mode** that needs no account.

[Unreleased]: https://github.com/AlicanK-code/daybreak/compare/v0.14.0...HEAD
[0.14.0]: https://github.com/AlicanK-code/daybreak/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/AlicanK-code/daybreak/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/AlicanK-code/daybreak/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/AlicanK-code/daybreak/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/AlicanK-code/daybreak/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/AlicanK-code/daybreak/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/AlicanK-code/daybreak/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/AlicanK-code/daybreak/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/AlicanK-code/daybreak/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/AlicanK-code/daybreak/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/AlicanK-code/daybreak/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/AlicanK-code/daybreak/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/AlicanK-code/daybreak/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AlicanK-code/daybreak/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/AlicanK-code/daybreak/releases/tag/v0.1.0
