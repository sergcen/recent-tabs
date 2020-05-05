import {
    searchInHistory,
    getBrowserTabs,
    getTabsFromHistory,
    removeTab,
    removeTabs,
} from './TabsApiWrapper';

import filterTabs from './FilterTabs';

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

        this.updateHistory();
    }

    async getTabs(fromCache, excludeTabsIds) {
        if (!fromCache || this.tabs.length === 0) {
            this.tabs = await getBrowserTabs({ currentWindow: true });

            this.tabs.forEach((tab, index) => {
                tab.url = decodeURI(tab.url);
            });

            if (excludeTabsIds) {
                this.tabs = this.tabs.filter(
                    (t) => !excludeTabsIds.includes(t.id)
                );
            }
        }

        return this.tabs;
    }

    async get(query, fromCache = true, excludeTabsIds) {
        const tabs = await this.getTabs(fromCache, excludeTabsIds);

        let filteredTabs = filterTabs(tabs, query);

        const lruTabs = this.sortTabsByLastUsage(filteredTabs);

        return lruTabs;
    }

    async getHistory(query, count = HISTORY_APPEND_LIMIT) {
        if (this.historyLoading) {
            await this.historyLoading;
        }

        if (this.lastRefinedHistory) {
            this.lastRefinedHistory.cancel();
        }

        let refinedHistory = null;

        const historyTabs = this.lastHistory.concat(this.history);

        let history = filterTabs(historyTabs, query, HISTORY_APPEND_LIMIT);

        if (history.length < HISTORY_APPEND_LIMIT) {
            refinedHistory = this.getTabsFromHistory(query, DUBLICATES_OVERHEAD_COUNT + count);
        }

        this.lastRefinedHistory = refinedHistory;

        return {
            history,
            refinedHistory
        }
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

    getTabsFromHistory(query, count) {
        let timeout = null;
        let reject = null;

        const promise = new Promise((resolve, rej) => {
            reject = rej;

            timeout = setTimeout(() => {
                resolve(getTabsFromHistory(query, count, 1000));
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

    getBookmarks() {
        return browser.bookmarks.getTree();
    }

    addTab(tabId) {
        this.tabsUsageMap.set(tabId, Date.now());

        this.lastHistory = this.lastHistory.filter((t) => t.id !== tabId);
    }

    async updateHistory() {
        this.historyLoading = getTabsFromHistory(
            '',
            COUNT_HISTORY_RESULT_IN_CACHE,
            2
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
