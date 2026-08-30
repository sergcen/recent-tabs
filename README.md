# Recent-tabs
Fast switch between tabs, see [chrome web store](https://chrome.google.com/webstore/detail/aamlejepmlabpimifejjnmkjcolooifi)

features:
* show all opened tabs in popup, sorted by last usage
* 2-step search in browser history

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
