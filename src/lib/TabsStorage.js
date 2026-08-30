import browser from 'webextension-polyfill';
import { RECENT_TABS_STATE_KEY } from './constants';

import {
    getBrowserTabs,
    getTabsFromHistory as searchBrowserHistory,
    removeTab,
    removeTabs,
} from './TabsApiWrapper';

import {
    filterItemsBySearch,
    normalizeSearchDescriptor,
} from './DomainSearchShortcuts';

const SEARCH_IN_HISTORY_TIMEOUT = 300;
const COUNT_HISTORY_RESULT_IN_CACHE = 1000;
const HISTORY_APPEND_LIMIT = 15;
// need some extra count for query from history
// clearDuplicates can removes some history items
const DUBLICATES_OVERHEAD_COUNT = 10;

class TabsStorage {
    constructor() {
        // map for saving time of last using time
        this.tabsUsageMap = new Map();
        this.lastHistorySet = new Set();

        this.tabs = [];
        this.history = [];
        this.lastHistory = [];
        this.bookmarks = [];

        this.ready = this.loadTabsUsage();
        this.updateHistory();
    }

    async loadTabsUsage() {
        const result = await browser.storage.local.get(RECENT_TABS_STATE_KEY);
        const state = result[RECENT_TABS_STATE_KEY] || {};
        const usage = state.tabsUsage || {};

        this.tabsUsageMap = new Map(
            Object.entries(usage).map(([tabId, lastUsed]) => [
                Number(tabId),
                lastUsed,
            ]),
        );
    }

    async getTabs(fromCache, excludeTabsIds) {
        await this.ready;

        if (!fromCache || this.tabs.length === 0) {
            this.tabs = await getBrowserTabs({ currentWindow: true });

            this.tabs.forEach((tab, index) => {
                tab.url = decodeURI(tab.url);
            });

            if (excludeTabsIds) {
                this.tabs = this.tabs.filter(
                    (t) => !excludeTabsIds.includes(t.id),
                );
            }
        }

        return this.tabs;
    }

    async get(search, fromCache = true, excludeTabsIds) {
        const tabs = await this.getTabs(fromCache, excludeTabsIds);

        const filteredTabs = filterItemsBySearch(tabs, search);

        const lruTabs = this.sortTabsByLastUsage(filteredTabs);

        return lruTabs;
    }

    async getHistory(search, count = HISTORY_APPEND_LIMIT) {
        if (this.historyLoading) {
            await this.historyLoading;
        }

        if (this.lastRefinedHistory) {
            this.lastRefinedHistory.cancel();
        }

        let refinedHistory = null;

        const historyTabs = this.lastHistory.concat(this.history);

        const history = filterItemsBySearch(
            historyTabs,
            search,
            HISTORY_APPEND_LIMIT,
        );

        if (history.length < HISTORY_APPEND_LIMIT) {
            refinedHistory = this.getTabsFromHistory(
                search,
                DUBLICATES_OVERHEAD_COUNT + count,
            );
        }

        this.lastRefinedHistory = refinedHistory;

        return {
            history,
            refinedHistory,
        };
    }

    sortTabsByLastUsage(tabs, reverse = false) {
        tabs = tabs.sort((a, b) => {
            return (
                (this.tabsUsageMap.get(b.id) || b.id) -
                (this.tabsUsageMap.get(a.id) || a.id)
            );
        });

        return reverse ? tabs.reverse() : tabs;
    }

    getTabsFromHistory(search, count) {
        let timeout = null;
        let reject = null;

        const promise = new Promise((resolve, rej) => {
            reject = rej;

            timeout = setTimeout(() => {
                resolve(this.searchHistory(search, count));
            }, SEARCH_IN_HISTORY_TIMEOUT);
        });

        return {
            cancel: () => {
                clearTimeout(timeout);
                reject();
            },
            promise,
        };
    }

    async searchHistory(search, count) {
        const descriptor = normalizeSearchDescriptor(search);

        if (!descriptor.shortcut) {
            return searchBrowserHistory(descriptor.text, count, 1000);
        }

        const searchTerms = [
            descriptor.text,
            ...descriptor.shortcut.patterns,
        ].filter(Boolean);
        const historyCollections = await Promise.all(
            [...new Set(searchTerms)].map((term) =>
                searchBrowserHistory(term, count, 1000),
            ),
        );
        const seenUrls = new Set();
        const candidates = historyCollections
            .flat()
            .sort(
                (a, b) =>
                    (b.lastVisitTime || 0) - (a.lastVisitTime || 0),
            )
            .filter((item) => {
                const key = item.url || item.id;
                if (seenUrls.has(key)) return false;

                seenUrls.add(key);
                return true;
            });

        return filterItemsBySearch(candidates, descriptor, count);
    }

    getBookmarks() {
        return browser.bookmarks.getTree();
    }

    addTab(tabId) {
        this.tabsUsageMap.set(tabId, Date.now());

        this.lastHistory = this.lastHistory.filter((t) => t.id !== tabId);
    }

    async updateHistory() {
        this.historyLoading = searchBrowserHistory(
            '',
            COUNT_HISTORY_RESULT_IN_CACHE,
            2,
        );

        const items = await this.historyLoading;

        this.history = items;
        this.lastHistory = [];
        this.lastHistorySet.clear();
    }

    removeTab(id) {
        this.tabsUsageMap.delete(id);

        return removeTab({ id });
    }

    removeTabs(ids) {
        ids.forEach((id) => this.tabsUsageMap.delete(id));

        return removeTabs(ids);
    }

    clearDublicatesTabs(tabs, existsTabs) {
        const existsUrls = new Set(existsTabs.map((t) => t.url));

        return tabs.filter((t) => !existsUrls.has(t.url));
    }
}

export default TabsStorage;
