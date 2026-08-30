import browser from 'webextension-polyfill';

import { RECENT_TABS_STATE_KEY } from '../lib/constants';
import SettingsStorage from '../lib/Storage';
import {
    moveTab,
    moveTabsToNewWindows,
    selectTab,
} from '../lib/TabsApiWrapper';

const settingsStorage = new SettingsStorage();

let tabsUsageMap = new Map();
let lastCreated = new Set();
let stateWrite = Promise.resolve();
const sortTimeouts = new Map();

const stateReady = browser.storage.local
    .get(RECENT_TABS_STATE_KEY)
    .then((result) => {
        const state = result[RECENT_TABS_STATE_KEY] || {};
        const usage = state.tabsUsage || {};

        tabsUsageMap = new Map(
            Object.entries(usage).map(([tabId, lastUsed]) => [
                Number(tabId),
                lastUsed,
            ])
        );
        lastCreated = new Set(state.lastCreated || []);
    });

const persistState = () => {
    const state = {
        tabsUsage: Object.fromEntries(tabsUsageMap),
        lastCreated: Array.from(lastCreated),
    };

    stateWrite = stateWrite.then(() =>
        browser.storage.local.set({ [RECENT_TABS_STATE_KEY]: state })
    );

    return stateWrite;
};

const getWindowTabs = (windowId) => browser.tabs.query({ windowId });

const sortTabsByLastUsage = (tabs, reverse = false) => {
    const sortedTabs = [...tabs].sort((a, b) => {
        return (
            (tabsUsageMap.get(b.id) || b.id) - (tabsUsageMap.get(a.id) || a.id)
        );
    });

    return reverse ? sortedTabs.reverse() : sortedTabs;
};

const addTabUsage = async (tabId) => {
    await stateReady;

    tabsUsageMap.set(tabId, Date.now());
    await persistState();
};

const cleanTabs = async (windowId) => {
    await Promise.all([stateReady, settingsStorage.refresh()]);

    const { autoclose, autocloseMaxOpened } = settingsStorage;

    if (!autoclose || !autocloseMaxOpened) return;

    const tabs = await getWindowTabs(windowId);
    const excessTabsCount = tabs.length - autocloseMaxOpened;

    if (excessTabsCount <= 0) return;

    const ids = sortTabsByLastUsage(tabs)
        .reverse()
        .filter((tab) => !tab.audible && !tab.pinned)
        .slice(0, excessTabsCount)
        .map((tab) => tab.id);

    if (ids.length > 0) {
        await browser.tabs.remove(ids);
    }
};

const noDublicate = async (tabId) => {
    await settingsStorage.refresh();

    const { nodublicate, nodublicateCloseOlder } = settingsStorage;

    if (!nodublicate) return;

    let tab;

    try {
        tab = await browser.tabs.get(tabId);
    } catch (error) {
        return;
    }

    const tabs = await getWindowTabs(tab.windowId);
    const existsTab = tabs.find(
        (candidate) => candidate.id !== tab.id && candidate.url === tab.url
    );

    if (!existsTab) return;

    if (nodublicateCloseOlder) {
        await browser.tabs.remove(existsTab.id);
    } else {
        await browser.tabs.remove(tab.id);
        selectTab(existsTab);
    }
};

const sortTabs = async (windowId) => {
    await Promise.all([stateReady, settingsStorage.refresh()]);

    const { sorting, sortingReverse } = settingsStorage;

    if (!sorting) return;

    const tabs = await getWindowTabs(windowId);
    const sortedTabs = sortTabsByLastUsage(tabs, sortingReverse);

    for (const [index, tab] of sortedTabs.entries()) {
        if (tab.index !== index) {
            await moveTab(tab.id, { index });
        }
    }
};

const sortTabsWithTimeout = async (windowId) => {
    await settingsStorage.refresh();

    const { sorting, sortingTimeout } = settingsStorage;

    if (!sorting) return;

    clearTimeout(sortTimeouts.get(windowId));

    const timeout = Math.min(Number(sortingTimeout) || 500, 25000);
    const timeoutId = setTimeout(() => {
        sortTimeouts.delete(windowId);
        sortTabs(windowId);
    }, timeout);

    sortTimeouts.set(windowId, timeoutId);
};

browser.tabs.onActivated.addListener((info) => {
    addTabUsage(info.tabId);
    sortTabsWithTimeout(info.windowId);
});

browser.tabs.onUpdated.addListener(async (tabId, { status }) => {
    await stateReady;

    if (!lastCreated.has(tabId) || status !== 'complete') return;

    lastCreated.delete(tabId);
    await persistState();
    await noDublicate(tabId);
});

browser.tabs.onCreated.addListener(async (tab) => {
    await stateReady;

    tabsUsageMap.set(tab.id, Date.now());
    lastCreated.add(tab.id);
    await persistState();
    await cleanTabs(tab.windowId);
});

browser.tabs.onRemoved.addListener(async (tabId) => {
    await stateReady;

    const usageDeleted = tabsUsageMap.delete(tabId);
    const createdDeleted = lastCreated.delete(tabId);

    if (usageDeleted || createdDeleted) {
        await persistState();
    }
});

browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'move-tabs-new-window') return;

    const tabs = await browser.tabs.query({ currentWindow: true });
    await moveTabsToNewWindows(tabs);
});

browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        if (typeof browser.commands.openShortcutSettings === 'function') {
            await browser.commands.openShortcutSettings();
        } else {
            await browser.tabs.create({
                url: 'chrome://extensions/shortcuts',
            });
        }
    }
});

browser.runtime.onStartup.addListener(async () => {
    const windows = await browser.windows.getAll();

    await Promise.all(windows.map((window) => cleanTabs(window.id)));
});
