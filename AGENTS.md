# Recent Tabs: guide for coding agents

## Current baseline

The modernization baseline is commit `96f48ab` (`feat: migrate extension to
Manifest V3`, 2026-08-30). It is a working modernization of the original 2020
extension, not the old Manifest V2 snapshot. The rest of this guide describes
the current feature branch, including changes made after `96f48ab`. That commit
alone had 8 tests and did not include domain search shortcuts.

The verified stack is:

- Manifest V3 for Chromium and Firefox;
- React and React DOM 19.2.8;
- Webpack 5 through `@webextension-toolbox/webextension-toolbox` 7.1.1;
- Babel 7, Dart Sass, Jest 30, and Prettier 3;
- `webextension-polyfill` for the Promise-based cross-browser API;
- Node.js `>=22.11.0 <26`.

Do not describe this repository as requiring a Manifest V3 migration or as being
blocked by `node-sass`. Those issues were fixed in `96f48ab`.

## Product scope

Recent Tabs is a browser extension for keyboard-first switching between recently
used tabs and searching bookmarks and browser history. It also has optional
background policies for closing excess tabs, preventing duplicate tabs, and
physically sorting the tab strip by recent use. User-defined domain search
shortcuts can scope popup results to configured URL hostname/path fragments.

The intended desktop browsers are Chrome, Yandex Browser, and Firefox. Chrome
and Yandex Browser use the same Chromium package. Firefox receives a separately
generated XPI with a different background declaration.

Keep the extension's purpose narrow: tab discovery and tab management. Avoid
adding unrelated permissions or features, especially when preparing a store
release.

## Commands and verified status

Use the checked-in lockfile and Node version from `package.json`:

```sh
npm ci
npm test -- --runInBand
npm run build:chrome
npm run build:firefox
```

At the current feature-branch head on macOS arm64 with Node 24.12.0 and npm
11.6.2:

- `npm ci` succeeds;
- all 30 Jest tests pass;
- both Chrome and Firefox production builds succeed without webpack errors;
- packages are written to `packages/recent-tabs.v<version>.chrome.zip` and
  `packages/recent-tabs.v<version>.firefox.xpi`;
- unpacked output is written to `dist/chrome` and `dist/firefox`;
- `npm audit --omit=dev` reports no production vulnerabilities;
- full `npm audit` reports six issues in the development-only
  `webextension-toolbox` dependency tree, including one high-severity
  `serialize-javascript` advisory, with no complete direct-package fix;
- repository-wide Prettier check is not clean. Do not format the whole legacy
  tree as part of a focused feature.

The build filters webpack entries to `scripts/*`. Ordinary top-level files such
as the comment-only `src/db.js` are copied but are no longer emitted as JS entry
bundles.

Always inspect generated manifests after changing `src/manifest.json`:

```sh
sed -n '1,240p' dist/chrome/manifest.json
sed -n '1,240p' dist/firefox/manifest.json
```

Source-manifest tests validate the toolbox directives, but only the generated
manifests prove that target-specific keys were transformed correctly.

## Repository map

- `src/manifest.json` is the source manifest. It uses toolbox-specific
  conditional keys for Chromium and Firefox background declarations.
- `src/scripts/background.js` is the Chromium service worker and Firefox event
  page entry. It owns MRU persistence and background tab policies.
- `src/scripts/popup.js` mounts the main popup with React `createRoot`.
- `src/scripts/settings.js` mounts the options page with React `createRoot`.
- `src/components/TabsPopup/` composes open tabs, bookmarks, and history and
  handles keyboard actions.
- `src/components/TabsList/` renders all result types.
- `src/components/SettingsPopup/` edits values in `browser.storage.local`.
- `src/hooks/tabs.js` and `src/hooks/history.js` read the popup-local
  `TabsStorage` singleton.
- `src/hooks/bookmarks.js` queries the bookmarks API directly.
- `src/hooks/settings.js` reads settings directly and subscribes to storage
  changes.
- `src/lib/TabsApiWrapper.js` is the imperative browser tabs/windows/history API
  boundary.
- `src/lib/TabsStorage.js` owns popup-local tab/history caches and MRU sorting.
- `src/lib/tabsStore.js` creates one `TabsStorage` instance per popup page
  lifetime.
- `src/lib/Storage.js` defines known setting keys, defaults, refresh, and writes.
- `src/lib/FilterTabs.js` implements substring search and Russian/English
  keyboard-layout correction.
- `src/lib/DomainSearchShortcuts.js` normalizes shortcut settings, parses the
  first query token, matches URL hostname/path fragments, and applies the scope
  before text-result limits.
- `src/lib/constants.js` contains cross-context storage keys.
- `webextension-toolbox-config.js` configures script entries, worker-safe
  `globalThis`, and SCSS loaders.

## Runtime architecture

### Background context

Chromium runs `scripts/background.js` as an ephemeral Manifest V3 service
worker. Firefox builds it as an event-page script. The same source must therefore
avoid DOM and `window` assumptions.

Event listeners are registered synchronously at module load. Async work happens
inside their callbacks.

The background context handles:

- `tabs.onActivated`: record MRU time and optionally schedule physical sorting;
- `tabs.onCreated`: record creation, persist state, and apply autoclose;
- `tabs.onUpdated`: apply duplicate-tab policy after a newly created tab loads;
- `tabs.onRemoved`: remove stale persisted state;
- `commands.onCommand`: move current-window tabs to a new window;
- `runtime.onInstalled`: open browser shortcut settings on first install;
- `runtime.onStartup`: apply autoclose independently to every window.

MRU state is stored under `__recentTabsState` in `browser.storage.local`:

```text
__recentTabsState
  tabsUsage: { <tabId>: <timestamp> }
  lastCreated: [<tabId>, ...]
```

`stateReady` loads it when the worker starts. `stateWrite` serializes writes so
activation/creation/removal events do not overwrite one another.

### Popup context

The popup does not call `runtime.getBackgroundPage()` and does not message the
service worker. It queries browser APIs directly through hooks and a popup-local
`TabsStorage` singleton.

The normal flow is:

`TabsPopup` -> `parseDomainSearchQuery` -> `useTabs` / `useBookmarks` /
`useHistory` -> browser APIs and `TabsStorage` -> `clearDublicates` ->
`useSelectedTab` -> `TabsList`.

The popup loads the persisted `tabsUsage` map once, fetches current-window tabs,
and sorts them by MRU. Its history cache exists only for the popup page lifetime:
an initial two-day history search is followed by a 300 ms delayed search up to
1000 days when fewer than 15 cached matches exist.

Results are de-duplicated by URL in priority order: open tabs, bookmarks, then
history. Bookmark folders have no URL and expand to their direct children.

A configured shortcut is recognized only as the exact, case-insensitive first
query token. `st task` searches the remaining `task` text only inside the URL
patterns assigned to `st`; `st` alone returns the available scoped results. One
key may have multiple OR-ed patterns. Matching uses a normalized lowercase
`hostname + pathname`; scheme, query, and fragment are excluded. Unknown first
tokens retain the legacy global-search behaviour. Scoped mode never falls back
to global results and does not open a web search. Apply the URL scope before
bookmark/history limits, not after them.

Selection is one numeric index over all rendered collections. When adding,
removing, filtering, or reordering a collection, update both the displayed list
and the `collections` passed to `useSelectedTab`.

### Settings context

The options page creates its own `SettingsStorage`. The popup's `useSettings`
hook creates another instance and follows `storage.onChanged`. The service worker
calls `refresh()` before applying a policy, so it does not depend on stale values
from a previous worker activation.

Keep WebExtension API methods attached to their receiver. In particular, call
`browser.storage.local.get(...)` / `set(...)` through `storage.local` (or bind
them explicitly); saving these methods as unbound functions throws `Illegal
invocation` in Yandex Browser even when Chrome accepts the same code.

Persisted setting keys are:

- `autoclose`, `autocloseMaxOpened`, `autocloseExclude`;
- `nodublicate`, `nodublicateCloseOlder`, `nodublicateExclude`;
- `sorting`, `sortingReverse`, `sortingTimeout`;
- `showShortcuts`;
- `domainSearchShortcuts` as an array of `{ key, patterns[] }` objects.

`domainSearchShortcuts` defaults to an empty array, is local to the browser
profile, and contains no built-in service definitions. The settings UI validates
the complete draft and writes the array atomically.

The legacy spelling `nodublicate` is part of the stored-data contract. Do not
rename it without an explicit migration.

## Manifest and browser-target rules

The source manifest uses:

- `action`, not `browser_action`;
- `_execute_action`, not `_execute_browser_action`;
- `__chrome|edge|opera__background.service_worker` for Chromium;
- `__firefox__background.scripts` for Firefox;
- no explicit CSP, so the safe MV3 default is used;
- `history`, `tabs`, `storage`, and `bookmarks` permissions.

Do not replace the conditional background keys with a single raw `background`
block unless the build tool is also changed. Chrome and Firefox generated
manifests intentionally differ.

If a feature needs a new browser API:

1. add the narrowest required permission to the source manifest;
2. put imperative calls in `TabsApiWrapper` or a focused service module;
3. keep service-worker listeners registered synchronously;
4. handle rejected Promises;
5. build both targets and inspect both generated manifests;
6. justify the permission in store privacy metadata.

Executable code must remain bundled with the extension. Do not add remote
scripts, dynamic remote-code evaluation, or `'unsafe-eval'`.

## Feature recipes

### New popup source or search rule

1. Keep pure matching and normalization in `src/lib`.
2. Put asynchronous browser access in a hook.
3. Provide stable identity and the `title`, `url`, and optional `favIconUrl`
   fields consumed by `TabsList`.
4. Decide its duplicate priority explicitly.
5. Add the displayed and selection collections together.
6. Test mouse selection, arrows, Enter, query reset, and empty results.

### New setting

1. Add the key to `SETTINGS_KEYS` in `Storage.js`.
2. Add a typed/defaulted getter or stop using property getters and migrate all
   callers together.
3. Add the options control.
4. Read it in the appropriate popup or background consumer.
5. Verify absent-key defaults, live changes, and worker restart.
6. Normalize numeric input instead of relying on implicit coercion.

### New background policy

1. Choose the exact tab/window/runtime event.
2. Query by explicit `windowId` when behaviour is per-window.
3. Await settings and persisted state before making decisions.
4. Preserve pinned and audible tabs for bulk destructive actions unless the
   requirement explicitly says otherwise.
5. Update persisted state when tab IDs are removed or replaced.
6. Test after terminating and waking the service worker, not only after an
   extension reload.

## Known debt and sharp edges

These are baseline facts, not instructions to fix unrelated code opportunistically:

- `autocloseExclude` and `nodublicateExclude` appear in the UI and storage key
  list but are still ignored by background policies. They also lack property
  getters in `Storage`, so their current textarea display path is incomplete.
- `TabsList` supports `__titleHightlights` and `__urlHightlights`, but current
  filtering never creates these properties.
- `lastHistory`, `lastHistorySet`, `bookmarks`, `getBookmarks`, `addTab`, and
  `clearDublicatesTabs` in `TabsStorage` are stale or unused-looking. Verify
  behaviour before deleting them.
- `TabsStorage.sortTabsByLastUsage` mutates the passed array, while the background
  sorter copies it. Avoid relying on accidental mutation.
- MRU state is now written to persistent local storage on every activation. This
  differs from the old in-memory-only behaviour and can cause write amplification
  and indefinite retention of browsing metadata. Decide the desired persistence
  contract before changing storage area or debouncing writes.
- A failed `stateWrite` rejects the shared Promise chain, so subsequent state
  writes can remain poisoned. New persistence work should recover the chain and
  expose failures.
- Physical sorting uses `setTimeout` inside an ephemeral MV3 worker, capped at
  25 seconds. Test suspension behaviour; a successful immediate test does not
  prove the timer is reliable.
- `_execute_action` has no `suggested_key`, while the README claims a default
  `CMD + E` shortcut. New installations may therefore not match the README.
- `@babel/preset-env` currently targets the build-time Node version, not an
  explicit browser compatibility matrix.
- Automated coverage covers `FilterTabs`, domain-shortcut parsing/matching,
  scoped history candidate merging, bulk-close rendered-index selection,
  StorageArea receiver binding, and the source manifest. There is no coverage
  for background policies, state persistence, hooks, full keyboard event
  handling, settings UI, or generated manifests.
- Chrome and Firefox packages compile, but this does not prove runtime behaviour
  in Chrome, Yandex Browser, or Firefox.

## Testing expectations

For every feature, add the smallest useful layer of coverage:

- unit tests for filtering, duplicate selection, MRU ordering, setting parsing,
  and pure policy decisions;
- browser-API mock tests for storage failures and background event handlers;
- generated-manifest assertions for target-specific changes;
- real-browser smoke tests for popup/options/service-worker integration.

Manual checks should cover, when relevant:

- popup open/close and initial selection;
- MRU order across extension reload and browser restart;
- title, URL, and keyboard-layout search;
- delayed history results and duplicate removal;
- bookmark search and folder expansion;
- ArrowUp/ArrowDown, Enter, copy URL, and both closing shortcuts;
- current-window versus multiple-window behaviour;
- pinned, audible, protected, loading, and already-removed tabs;
- every affected setting before and after a service-worker restart;
- `move-tabs-new-window` while the popup is closed.

## Evolution strategy

For product features, prefer evolving this baseline. The difficult MV3 changes
are already present and the current build/test/package loop works.

If the project will receive sustained development, treat a move from
WebExtension Toolbox/Webpack to WXT plus TypeScript as a separate re-platforming
change. Preserve business logic and observable behaviour; do not rewrite search,
MRU, history, settings, and UI simultaneously with the build-tool migration.

A full greenfield rewrite is justified only when product behaviour itself is
being redesigned. Forking the repository for ownership and rebranding is
independent from rewriting the implementation.

## Distribution notes

- Keep `package.json` and manifest versions identical.
- Chrome/Yandex Browser use the generated Chrome ZIP; Firefox uses the XPI.
- The repository declares `ISC` in `package.json` but has no root `LICENSE` and
  no package author. Resolve copyright attribution and add a verified license
  file before publishing a fork.
- A fork published under another account receives a new extension/store ID.
- Rebrand name, icon, listing, privacy policy, and support contacts for an
  independent fork.

## Definition of done

- The change is in the correct extension context.
- Required permissions are minimal and justified.
- Popup display order matches keyboard selection order.
- Existing storage keys remain compatible or have an explicit migration.
- Async browser API and storage failures are handled.
- Focused tests pass.
- both target builds finish without `ERROR` output;
- generated manifests are inspected;
- the affected flow is exercised in real target browsers;
- unrelated reformatting, dependency migration, and spelling cleanup stay out
  of the feature diff.
