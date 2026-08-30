# Recent-tabs
Fast switch between tabs, see [chrome web store](https://chrome.google.com/webstore/detail/aamlejepmlabpimifejjnmkjcolooifi)

features:
* show all opened tabs in popup, sorted by last usage
* 2-step search in browser history
* limit tab, bookmark, and history search to configured URL scopes

## Domain search shortcuts

Open the extension settings and add a shortcut key with one or more URL
patterns. For example, configure the key `gh` with the pattern `github.com`,
then type `gh issue` in the popup. Only matching tabs, bookmarks, and history
entries are searched. Type `gh` without a query to see
all currently available results in that scope.

Patterns are case-insensitive substrings of the URL hostname and path. Multiple
patterns under the same key are combined with OR. Shortcuts are stored locally
in the current browser profile.

Browsers: Chrome, Yandex Browser, Firefox

The extension uses Manifest V3.

## Build

```sh
npm install
npm run build:chrome
npm run build:firefox
```

Node.js 22.11 through 25 is supported. The Chrome Web Store ZIP and Firefox
XPI archives are created in `packages/`.

## Hotkeys
* CMD + E - open popup (default for MAC, for Windows users set it manually: `chrome://extensions/shortcuts`)
* SHIFT + arrowRight - close selected tab
* SHIFT + arrowDown - close everything tabs to the bottom, including selected
* CMD + C - copy URL of selected tab (CTRL + C for windows users)
