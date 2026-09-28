# Changelog

All notable changes to QuestLog are recorded here, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/): a new **minor** version (0.x.0) for new features or
significant UI changes, a **patch** (0.x.y) for fixes only.

Each version is grouped into **Features** (new functionality), **UI & design** (visual changes)
and **Fixes** (bugs fixed). Changes collect under **Unreleased** until they're released as a
version; each release is tagged in git (e.g. `v0.7.0`).

## [Unreleased]

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

[Unreleased]: https://github.com/AlicanK-code/questlog/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/AlicanK-code/questlog/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/AlicanK-code/questlog/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/AlicanK-code/questlog/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/AlicanK-code/questlog/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/AlicanK-code/questlog/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AlicanK-code/questlog/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/AlicanK-code/questlog/releases/tag/v0.1.0
