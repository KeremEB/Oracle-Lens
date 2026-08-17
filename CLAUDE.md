# Oracle Lens

Desktop application that displays a detailed inventory and statistics report for the
user's **own** Riot Games accounts by connecting to the locally running Riot clients.

**League of Legends ships first.** VALORANT follows in a later release. The
architecture must support this from day one — see *Multi-game architecture* below.
Do not write LoL-specific logic into shared layers.

---

## Non-negotiable rules

Read these before writing any code. They override convenience.

1. **Local client only.** The app connects exclusively to Riot clients running on the
   user's own machine (lockfile-based auth). It never asks for, transmits, or stores
   Riot credentials.
2. **No passwords, ever.** Not in memory beyond the request, not on disk, not in logs.
   The only persisted data is display snapshots (see *Persistence*).
3. **No account access for third parties.** There is no feature that reads another
   person's account. If a feature request implies it, stop and flag it.
4. **No account valuation.** The app does not estimate what an account is worth, in
   any currency or scoring scheme, and does not scrape or ingest account-marketplace
   data. This feature was built and then deliberately removed. Do not reintroduce it
   in any form, including as RP totals framed as market value.
5. **Riot compliance.** This is an informational read-only tool. No automation of
   gameplay, no queue manipulation, no client actions beyond reading data.
6. **No bundled Riot IP.** No game art, no licensed brand fonts committed to the repo.
   See *Assets* and *Typography*.
7. **Never commit secrets or lockfile contents.** Lockfiles are read at runtime only.

---

## Tech stack

Decided. Do not substitute without being asked.

| Layer | Choice |
|---|---|
| Shell | Electron |
| Language | TypeScript (strict mode) |
| UI | React |
| Styling | TailwindCSS |
| LCU connection | `league-connect` |
| Fonts | `@fontsource` packages (no committed font files) |
| Export | `html2canvas` + `jsPDF` |
| Packaging | `electron-builder` |
| i18n | English-only strings, externalized to `locales/en.json` |

---

## Multi-game architecture

This is the single most important structural decision in the project.

**Principle:** a game-agnostic core, plus one self-contained module per game. Adding
VALORANT should mean adding a folder, not editing the core.

### Connection reality per game

The two games do **not** share a connection model:

- **League of Legends** — League Client (LCU) lockfile. Full inventory and ranked data.
- **VALORANT** — a *separate* Riot Client lockfile and a different local API surface,
  with its own auth flow and entitlements. Treat it as a genuinely separate provider.
  Do not assume any LCU pattern carries over.

### Structure

```
src/
  main/
    core/
      connection/     provider registry, lifecycle, state machine (game-agnostic)
      cdn/            asset URL builders + local cache (per-game namespaces)
      store/          snapshot persistence
    games/
      lol/
        provider.ts   implements GameProvider
        endpoints/
        mappers/      LCU payload -> domain types
      valorant/       (later — separate Riot Client connection)
    index.ts
  preload/
    index.ts          contextBridge surface
  renderer/
    core/             app shell, navigation, grid density, search matching, i18n
    games/
      lol/            LoL screens, cards, sections, export
        export/       section capture, ZIP bundling, text PDF
      valorant/       (later)
    theme/
      brand.ts        Oracle Lens identity (waiting/disconnected states)
      games/          per-game theme tokens
    App.tsx
  shared/
    types/
      core.ts         GameProvider interface, connection state, shared primitives
      lol.ts
locales/
  en.json
```

### The GameProvider contract

Every game implements the same interface, defined in `src/shared/types/core.ts`:
detect availability, connect, disconnect, subscribe to events, and expose a set of
capability-flagged data fetchers.

Games have genuinely different data. Do **not** force a lowest-common-denominator
shape. Each provider declares which capabilities it supports (ranked, champions,
skins, chromas, collectibles, loot, …) and the UI renders only what is declared.
A missing capability is a normal state, not an error.

---

## Connection behaviour

The user must never press a "Connect" button under normal conditions.

- On launch, poll for available client lockfiles across all registered providers.
- Connect automatically to whatever is found.
- If nothing is found, show the branded waiting screen (see *Theming*).
- If a client closes mid-session, return to the waiting state without crashing and
  without discarding already-loaded data. `ECONNREFUSED` on a stale port must
  demote the connection rather than surface a raw error.
- If a client reopens, read the *new* lockfile and reconnect automatically.
- Connection state is per-provider and typed:
  `unavailable | connecting | connected | error`.
- A manual **Refresh** control (button, and `Ctrl+R`) re-fetches all data for the
  connected account.
- If more than one game's client is running, both are available and the user switches
  between them freely. Never force a choice on launch.

---

## Theming

Two themes, switched by connection state — not by screen region.

### 1. Brand theme — disconnected only

Used **only** when no client is connected: the waiting screen, the disconnected
state, and History opened without a live client. Drawn from the app logo.

- **Surface** — `#141010` base, `#1E1818` panel, `#2A2222` raised.
- **Copper** — `#6B3A1F` dark, `#A66A3A` mid, `#D9A05B` bright. Borders, headings.
- **Signal red** — `#8B1A1A` dark, `#C1272D` mid, `#E63946` bright. Status text.
- **Green glow** — `#3E8E5A`. Interaction and "connection is live" only. Green is
  never a static fill.

The waiting screen shows the logo, the app name, and a soft pulsing animation while
scanning for a client. On connect it flashes green, then transitions to the game theme.

### 2. Game theme — connected

Once a client connects, the **entire** interface adopts that game's visual language —
sidebar, header, and game rail included, not just the content area. This was a
deliberate change from the original "constant brand chrome" plan.

**League of Legends** (`theme/games/lol/`):

- **Gold** — muted and warm, not saturated. Around `#B8A177`; text gold slightly
  lighter than border gold, which stays faint.
- **Navy** — very dark, low blue. Around `#0A0F1A` for surfaces.
- **Hextech** — `#0AC8B9` for accents.
- Thin gold borders, near-square corners, generous spacing, ceremonial feel.
- Champion and skin art is already colourful: the theme handles borders and
  surfaces, the card interior belongs to the artwork.

The VALORANT token set is a stub until that provider lands.

Each game theme is a token set applied by swapping CSS custom properties.
**Never fork components per game for styling reasons** — one component, tokens decide
how it looks. Forking is allowed only when the underlying data genuinely differs.

Rarity colours are separate and follow each game's own rarity system. Keep them
per-game in `theme/games/<game>/rarity.ts`.

### Colour format constraint

**Never define theme colours in `oklch`.** `html2canvas` cannot parse it and every
export fails with an unsupported-colour-function error. Use hex or `rgb()`.

### Scrollbars and motion

- Scrollbars are themed to the active palette: faint track, muted gold thumb,
  ~8–10px, no arrow buttons.
- Glow effects appear **on hover** (~150ms). The active sidebar tab carries a much
  fainter constant glow to signal position.
- Tab changes cross-fade (150–200ms, opacity only) and reset scroll to top.

---

## Typography

Riot's brand fonts (Beaufort, Spiegel, Tungsten, DIN Next) are **commercially licensed
and must not be committed or bundled.** Open alternatives via `@fontsource`:

- **Cinzel** — display headings, section titles (stands in for Beaufort).
- **Inter** — body text and numerals.
- VALORANT will pick its own stand-in when that theme lands.

Declare fonts as theme tokens, never hardcoded in components. If a font looks wrong
next to the real game, change the *alternative* — do not reach for the licensed original.

---

## Assets

**Do not commit game art to the repository.** Champion, skin, chroma, ward, emote,
profile icon, mastery crest, mastery banner, and rank emblem art is fetched at runtime
from Riot's public CDNs (Data Dragon / Community Dragon) and cached locally.

Build URLs from IDs via helpers in `src/main/core/cdn/`, namespaced per game. Never
hardcode a full asset URL in a component. Always handle the missing-asset case with a
placeholder — the CDNs have gaps, especially for very new or very old content.

**Never invent an asset mapping.** If the correct art or the level→asset mapping
cannot be located, say so and fall back to a plain treatment. Drawing an approximation
in CSS and passing it off as the real badge is not acceptable. The mastery banner
tier mapping was recovered from the client's own bundle for exactly this reason.

The only art committed to the repo is the **application's own logo/icon**
(`build/oraclelens.png`), used for the window icon, the installer icon, and the
waiting screen.

---

## Features

### Shipped (v1 — League of Legends)

1. **Connection layer** — provider registry, auto-detect, reconnect, typed state
   machine, manual refresh.
2. **App shell** — game rail (left, 60px), sidebar, full-width header.
3. **Account summary** — level, region, country, honor level, profile icon with
   level banner, RP and Blue Essence balances, shown as labelled chips.
4. **Ranked** — Solo/Duo and Flex: emblem, tier, division, LP, W/L, win rate.
   Win rate colour: yellow at exactly 50%, green above, red below — the colour must
   agree with the rounded figure that is displayed.
5. **Champions** — owned champions (sourced from *ownership*, not mastery, so
   unplayed champions appear) with mastery level 1–10 crest + banner badges,
   filterable by mastery level. Special-mode entries are split into a `CLASSIC`
   section.
6. **Skins** — owned skins with rarity gem icons (Epic / Legendary / Ultimate /
   Hextech / Transcendent / Exalted), filterable by rarity and legacy status.
   Base skins excluded. Special-mode entries split into `CLASSIC`.
7. **Chromas** — with their actual colour palettes.
8. **Collectibles** — ward skins, emotes, profile icons.
9. **Loot** — shards, chests, keys, orbs, gemstones, Mythic Essence, with disenchant
   and unlock values. Kept strictly separate from owned-item counts.
10. **Search** — per-tab, diacritic- and case-insensitive, Turkish-aware.
11. **Sorting** — per-tab: mastery points or rarity by default, plus A–Z / Z–A using
    `localeCompare('tr')`.
12. **Grid density** — `Ctrl+Scroll` resizes cards on every grid tab. Mastery crests
    and rarity gems scale with the card. Fixed step levels, persisted.
13. **Export** — see below.
14. **History** — local snapshots, viewable without a live client.

### Removed

**Account value scoring.** Built, then removed at the user's request along with all
pricing data and RP package tables. See non-negotiable rule 4.

### Later

- **v2 — VALORANT.** Separate Riot Client provider. Ranked, agents, skins and
  variants, buddies, sprays, player cards, titles, VALORANT theme.

---

## Export

Three modes:

1. **All sections (ZIP)** — one PNG per section (Account Details, Champions, Skins,
   Chromas, Wards, Emotes, Profile Icons, Loot), bundled into a single ZIP. Never a
   single stacked image.
2. **Current section (PNG)** — quick export of the active tab.
3. **Text report (PDF)** — no images. Account summary, ranked, and per-category text
   listings. Searchable, small, page-numbered.

PNG rules:

- Cards spread **horizontally**; grow width rather than producing a very tall image.
- Cards must stay legible — extend the canvas rather than shrinking cards.
- 2× scale for sharpness.
- Header band on each image: summoner, server, section name, item count, date.
- Split very large sections into numbered parts.

Filename: `OracleLens_[summoner]_[section]_[date]`.

### The blank-export trap

`html2canvas` has a **100-entry default image cache**. Any section with more than 100
distinct image sources rendered blank cards — the failure that cost the most time in
this project. Before touching capture code, understand the fix in
`renderer/games/lol/export/capture.ts`. Also verify every image with `complete` **and**
`naturalWidth`; `onload` alone does not fire for cached images.

---

## Layout

- **Game rail** — far left, 60px, one icon per game. Icons carry their own game's
  colours (LoL: gold on navy) rather than the brand palette; active is bright, inactive
  is dim. This is the one place where per-game colour appears outside the content area.
- **Sidebar** — tabs with right-aligned count badges, grouped by faint dividers:
  collection tabs, then Loot, then History.
- **Header** — full width, above the rail and sidebar. Left: profile icon + level
  banner + name + level. Middle: ranked blocks. Right: chips and controls. Vertical
  dividers separate the three groups.
- **Content** — filter row (search, filters, sort, export) above the grid. Grids use
  `auto-fill` / `minmax` driven by the grid-density value.

**Responsive:** nothing may overflow horizontally. On narrow windows the filter row
splits into two rows — search on top, controls below — and the keyboard-hint text
hides. Header chips wrap rather than scroll or clip.

---

## Keyboard

- `Ctrl+Scroll` — resize grid cards.
- `Ctrl+R` — refresh data. Must call `preventDefault()`; it must never trigger an
  Electron page reload.

---

## Persistence

Stored in the Electron `userData` directory:

- Cached CDN metadata per game, with a version stamp.
- Account snapshots: account ID plus displayed data only, tagged by game and dated.
  Re-viewing an account adds a new snapshot rather than overwriting. Oldest entries
  are pruned past a cap.
- Preferences: grid density, sort order, last active game.

**Never stored:** credentials, tokens, lockfile contents, session cookies.

---

## Code conventions

- TypeScript `strict: true`. No `any` in committed code.
- Domain types live in `src/shared/types/` and are shared across processes.
- Client responses are validated and mapped into domain types at the provider
  boundary. Raw payloads never travel past `src/main/games/<game>/mappers/`.
- All user-facing strings go through `locales/en.json`. No hardcoded copy in JSX.
- No raw hex in components — theme tokens only. No `oklch` anywhere.
- Nothing game-specific in `core/`. If a core file needs a game name in a
  conditional, the abstraction is wrong — stop and fix the seam.
- Prefer small, focused components. Past ~150 lines, split.
- Network and filesystem failures are expected, not exceptional. Handle them with
  visible UI states rather than swallowed errors.
- Delete diagnostic harnesses once the bug they chased is fixed.

---

## Commands

```bash
npm install       # install dependencies
npm run dev       # start in development mode
npm run build     # type-check and build
npm run package   # produce a distributable installer
```

---

## Working style for Claude Code

- Work one feature at a time. Ask before expanding scope.
- **Do not commit.** The user commits manually after testing.
- When a prompt has numbered items, do all of them, then list what was done and what
  was skipped and why. Partial silent completion has been a recurring problem.
- Before adding a dependency, say what it's for and whether a small local
  implementation would do instead.
- When a local API endpoint's shape is uncertain, say so rather than guessing. Many
  LCU and Riot Client endpoints are undocumented and change between patches.
- When a bug survives two attempted fixes, stop guessing and produce diagnostics
  first.
- Flag anything that would conflict with the non-negotiable rules above.
