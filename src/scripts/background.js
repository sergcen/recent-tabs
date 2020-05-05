import TabsStorage from '../lib/TabsStorage';
import SettingsStorage from '../lib/Storage';
import {
    selectTab,
    moveTab,
    moveTabsToNewWindows,
} from '../lib/TabsApiWrapper';

const tabsStorage = new TabsStorage();
const settingsStorage = new SettingsStorage();

setInterval(() => tabsStorage.updateHistory(), 60000);

const cleanTabs = async () => {
    const { autoclose, autocloseMaxOpened } = settingsStorage;

    if (!autoclose || !autocloseMaxOpened) return;

    const tabs = await tabsStorage.getTabs();
    const diffCount = autocloseMaxOpened - tabs.length;

    if (diffCount < 0) {
        const ids = tabsStorage
            .sortTabsByLastUsage(tabs)
            .slice(diffCount)
            .filter((tab) => !tab.audible && !tab.pinned)
            .map((t) => t.id);

        ids.forEach((id) => tabsStorage.removeTab(id));
    }
};

const noDublicate = async (tabId) => {
    const { nodublicate, nodublicateCloseOlder } = settingsStorage;

    if (!nodublicate) return;

    const tabs = await tabsStorage.getTabs();
    const tab = tabs.find((t) => t.id === tabId);
    const existsTab = tabs.find((t) => t.id !== tab.id && t.url === tab.url);

    if (!existsTab) return;

    if (nodublicateCloseOlder) {
        tabsStorage.removeTab(existsTab.id);
    } else {
        await tabsStorage.removeTab(tab.id);
        selectTab(existsTab);
    }
};

let sortTimeout = null;

const sortTabsWithTimeout = () => {
    const { sorting, sortingTimeout } = settingsStorage;
    if (!sorting) return;

    clearInterval(sortTimeout);

    sortTimeout = setTimeout(sortTabs, sortingTimeout);
};

const sortTabs = async () => {
    const { sorting, sortingReverse } = settingsStorage;

    if (!sorting) return;

    const tabs = await tabsStorage.getTabs();
    const tabsMap = new Map(tabs.map((t, index) => [t.id, index]));

    const sortedTabs = tabsStorage.sortTabsByLastUsage(tabs, sortingReverse);

    const positions = sortedTabs
        .map((tab, index) => {
            return {
                id: tab.id,
                sortedIndex: index,
                browserIndex: tabsMap.get(tab.id),
            };
        })
        .filter((t) => t.sortedIndex !== t.browserIndex);

    for (const pos of positions) {
        await moveTab(pos.id, { index: pos.sortedIndex });
    }
};

browser.tabs.onActivated.addListener((info) => {
    tabsStorage.addTab(info.tabId);
    sortTabsWithTimeout();
});

let lastCreated = new Set();

browser.tabs.onUpdated.addListener((id, { status }) => {
    if (lastCreated.has(id) && status === 'complete') {
        noDublicate(id);
        lastCreated.delete(id);
    }
});

browser.tabs.onCreated.addListener((tab) => {
    tabsStorage.addTab(tab.id);

    cleanTabs();
    lastCreated.add(tab.id);
});

browser.runtime.onInstalled.addListener(function (details) {
    if (details.reason == 'install') {
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    }
});

window.tabsStorage = tabsStorage;
window.settingsStorage = settingsStorage;

(async () => {
    await settingsStorage.ready;

    cleanTabs();
})();
