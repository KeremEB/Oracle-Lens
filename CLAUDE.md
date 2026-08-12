# Oracle Lens

Desktop application that displays a detailed inventory and statistics report for the
user's **own** Riot Games accounts by connecting to the locally running Riot clients.

**League of Legends ships first.** Teamfight Tactics and VALORANT follow in later
releases. The architecture must support this from day one — see *Multi-game
architecture* below. Do not write LoL-specific logic into shared layers.

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
4. **Riot compliance.** This is an informational read-only tool. No automation of
   gameplay, no queue manipulation, no client actions beyond reading data.
5. **No bundled Riot IP.** No game art, no licensed brand fonts committed to the repo.
   See *Assets* and *Typography*.
6. **Never commit secrets or lockfile contents.** Lockfiles are read at runtime only.

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

This is the single most important structural decision in the project. Get it right
before building features.

**Principle:** a game-agnostic core, plus one self-contained module per game. Adding
TFT or VALORANT should mean adding a folder, not editing the core.

### Connection reality per game

The three games do **not** share a connection model. Know the difference:

- **League of Legends** — League Client (LCU) lockfile. Full inventory and ranked data.
- **Teamfight Tactics** — served by the *same* League Client. Same connection, different
  endpoints (Little Legends, Tacticians, Arenas, Boons, TFT-specific ranked queues).
  This is why TFT is the cheap second game.
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
      tft/            (later — reuses the LoL client connection)
      valorant/       (later — separate Riot Client connection)
    index.ts
  preload/
    index.ts          contextBridge surface
  renderer/
    core/             app shell, navigation, game switcher, settings
    games/
      lol/            LoL-themed screens and components
      tft/            (later)
      valorant/       (later)
    theme/
      brand.ts        Oracle Lens identity (constant across games)
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

Every game implements the same interface, defined in `src/shared/types/core.ts`.
Roughly: detect availability, connect, disconnect, subscribe to events, and expose a
set of capability-flagged data fetchers.

Games have genuinely different data. Do **not** force a lowest-common-denominator
shape. Instead, each provider declares which capabilities it supports (ranked,
champions, skins, chromas, collectibles, value score, …) and the UI renders only
what is declared. A missing capability is a normal state, not an error.

---

## Connection behaviour

The user must never press a "Connect" button under normal conditions.

- On launch, poll for available client lockfiles across all registered providers.
- Connect automatically to whatever is found.
- If nothing is found, show a passive waiting state (`Waiting for Riot client…`).
- If a client closes mid-session, return to the waiting state without crashing and
  without discarding already-loaded data.
- If a client reopens, reconnect automatically.
- Connection state is per-provider and typed:
  `unavailable | connecting | connected | error`.
- If more than one game's client is running, both are available and the user switches
  between them freely. Never force a choice on launch.

---

## Theming

Two layers, and they must not bleed into each other.

### 1. Brand chrome — constant

The application shell (title bar, sidebar, settings, game switcher, connection
indicator) always wears the Oracle Lens identity, regardless of the active game.
This is what keeps the app from feeling like three unrelated apps stapled together.

- **Surface** — deep neutral grey backgrounds and panels.
- **Copper** — primary accent from the logo. Borders, headings, active states.
- **Signal red** — secondary accent from the logo. Highlights and warnings.
- **Green glow** — interaction only. A soft luminous halo behind buttons on hover, and
  behind the connect affordance when a connection goes live. Green is never a static
  fill; it always means "something is live".

Exact hex values are locked in `theme/brand.ts` once the logo is finalised.

### 2. Game theme — swaps with the active game

Once the user enters a game's account view, that game's content area adopts that
game's visual language: palette, typography scale, border and panel treatment,
texture, motion feel.

- **League of Legends** — gold and deep blue, ornamental borders, serif display
  headings, a heavier and more ceremonial feel.
- **Teamfight Tactics** — softer and more playful; lighter surfaces, rounded forms.
- **VALORANT** — high-contrast, angular, sharp corners, tight condensed type,
  minimal ornament.

Each game theme is a token set under `theme/games/`, applied by swapping CSS custom
properties on the content container. **Never fork components per game for styling
reasons** — one component, tokens decide how it looks. Forking is allowed only when
the underlying data genuinely differs.

Both light and dark modes ship for every theme; dark is the default and the choice
persists.

Rarity colours are separate from all of the above and follow each game's own rarity
system. Keep them per-game in `theme/games/<game>/rarity.ts`.

---

## Typography

Riot's brand fonts (Beaufort, Spiegel, Tungsten, DIN Next) are **commercially licensed
and must not be committed or bundled.** Use visually sympathetic open alternatives
loaded via `@fontsource`:

- LoL display headings — an ornamental serif (Cinzel or Marcellus).
- TFT — a rounded, friendly sans.
- VALORANT — a condensed geometric sans.
- Shared body text and numerals — Inter, for legibility in dense stat tables.

Declare fonts as theme tokens, never hardcoded in components. If a font choice looks
wrong next to the real game, change the *alternative* — do not reach for the licensed
original.

---

## Assets

**Do not commit game art to the repository.** Champion, skin, chroma, ward, emote,
profile icon, mastery crest, and rank emblem art is fetched at runtime from Riot's
public CDNs (Data Dragon / Community Dragon) and cached locally.

Reasons: the repo stays small, content stays current as Riot ships patches, and we
avoid redistributing Riot's assets.

Build URLs from IDs via helpers in `src/main/core/cdn/`, namespaced per game. Never
hardcode a full asset URL in a component. Always handle the missing-asset case with a
placeholder — the CDNs have gaps, especially for very new or very old content.

The only art committed to the repo is the **application's own logo/icon** (window
icon, installer icon), in `build/`.

---

## Roadmap

Build in this order. Do not scaffold future games early — build the seams, not the
implementations.

### v1 — League of Legends

1. **Core connection layer** — provider registry, auto-detect, reconnect, state
   machine. No UI polish.
2. **App shell** — brand chrome, navigation, game switcher (with only LoL present).
3. **Account summary** — level, region, honor level + checkpoint, profile icon.
4. **Ranked** — Solo/Duo and Flex: tier, division, LP, wins/losses, win rate.
5. **Champions** — owned champions with mastery level (1–10) crest badges, filterable
   by mastery level.
6. **Skins** — owned skins with rarity gem icons (Epic / Legendary / Ultimate /
   Hextech / Transcendent / Exalted), filterable by rarity and legacy status.
7. **Chromas** — grouped under their skin, rendered with their actual colour palette.
8. **Collectibles** — ward skins, emotes, profile icons.
9. **Search** — across champions, skins, and collectibles.
10. **Export** — render the report to PNG and PDF.
11. **History** — recently viewed snapshots.

### v2 — Teamfight Tactics

Reuses the LoL client connection. TFT ranked, Little Legends, Tacticians, Arenas,
Boons, TFT theme.

### v3 — VALORANT

Separate Riot Client provider. Ranked, agents, skins and variants, buddies, sprays,
player cards, titles, VALORANT theme.

---

## Persistence

Stored locally in the Electron `userData` directory:

- Cached CDN metadata per game, with a version stamp.
- Snapshots of previously viewed accounts: account ID plus displayed data only,
  tagged by game.
- User preferences: theme mode, last active game, filters.

**Never stored:** credentials, tokens, lockfile contents, session cookies.

---

## Code conventions

- TypeScript `strict: true`. No `any` in committed code.
- Domain types live in `src/shared/types/` and are shared across processes.
- Client responses are validated and mapped into domain types at the provider
  boundary. Raw client payloads never travel past `src/main/games/<game>/mappers/`.
- All user-facing strings go through `locales/en.json`. No hardcoded copy in JSX.
- Nothing game-specific in `core/`. If a core file needs a game name in a
  conditional, the abstraction is wrong — stop and fix the seam.
- Prefer small, focused components. Past ~150 lines, split.
- Network and filesystem failures are expected, not exceptional. Handle them with
  visible UI states rather than swallowed errors.

---

## Commands

```bash
npm install       # install dependencies
npm run dev       # start in development mode
npm run build     # type-check and build
npm run package   # produce a distributable installer
npm run lint      # lint and format check
```

---

## Working style for Claude Code

- Work one feature at a time. Ask before expanding scope.
- Before adding a dependency, say what it's for and whether a small local
  implementation would do instead.
- When a local API endpoint's shape is uncertain, say so rather than guessing. Many
  LCU and Riot Client endpoints are undocumented and change between patches.
- Flag anything that would conflict with the non-negotiable rules above.
