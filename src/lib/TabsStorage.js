import {
    searchInHistory,
    getBrowserTabs,
    getTabsFromHistory,
    removeTab,
    removeTabs
} from './TabsApiWrapper';

import filterTabs from './FilterTabs';

const SEARCH_IN_HISTORY_TIMEOUT = 300;
const COUNT_HISTORY_RESULT_IN_CACHE = 1000;
const HISTORY_APPEND_LIMIT = 15;

class TabsStorage {
    constructor() {
        // map for saving time of last using time
        this.tabsUsageMap = new Map();
        this.lastHistorySet = new Set();

        this.tabs = [];
        this.history = [];
        this.lastHistory = [];

        this.updateHistory();
    }

    async getTabs(fromCache, excludeTabsIds) {
        if (!fromCache || this.tabs.length === 0) {
            this.tabs = await getBrowserTabs({ currentWindow: true });

            this.tabs.forEach(tab => {
                tab.url = decodeURI(tab.url);
            });

            if (excludeTabsIds) {
                this.tabs = this.tabs.filter(
                    t => !excludeTabsIds.includes(t.id)
                );
            }
        }

        return this.tabs;
    }

    async get(query, fromCache = true, excludeTabsIds) {
        await this.historyLoading;

        const tabs = await this.getTabs(fromCache, excludeTabsIds);

        let filteredTabs = filterTabs(tabs, query);

        let history = null;
        let refinedHistory = null;

        if (filteredTabs.length < HISTORY_APPEND_LIMIT) {
            const historyTabs = this.lastHistory.concat(this.history);
            history = filterTabs(historyTabs, query, HISTORY_APPEND_LIMIT);
            history = this.clearDublicatesTabs(history, filteredTabs);
        }

        const totalCount =
            filteredTabs.length + ((history && history.length) || 0);

        if (totalCount < HISTORY_APPEND_LIMIT) {
            // we need some extra count for query from history
            // clearDuplicates can removes some history items
            const dublicatesOverheadCount = 10;
            const searchCount =
                HISTORY_APPEND_LIMIT - totalCount + dublicatesOverheadCount;

            refinedHistory = this.getTabsFromHistory(query, searchCount);

            refinedHistory.promise = refinedHistory.promise.then(
                refinedTabs => {
                    if (refinedTabs && refinedTabs.length) {
                        refinedTabs = this.clearDublicatesTabs(
                            refinedTabs,
                            filteredTabs.concat(history)
                        );
                    }
                    return history.concat(refinedTabs);
                }
            );
        }

        const lruTabs = this.sortTabsByLastUsage(filteredTabs);

        return {
            tabs: lruTabs,
            history,
            totalCount,
            refinedHistory
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
            promise
        };
    }

    addTab(tabId) {
        this.tabsUsageMap.set(tabId, Date.now());

        this.lastHistory = this.lastHistory.filter(t => t.id !== tabId);
        // this.lastHistory.unshift(tab);
    }

    updateHistory() {
        this.historyLoading = getTabsFromHistory(
            '',
            COUNT_HISTORY_RESULT_IN_CACHE,
            2
        ).then(items => {
            this.history = items;
            this.lastHistory = [];
            this.lastHistorySet.clear();
        });
    }

    removeTab(id) {
        this.tabsUsageMap.delete(id);

        return removeTab({ id });
    }

    removeTabs(ids) {
        ids.forEach(id => this.tabsUsageMap.delete(id));

        return removeTabs(ids);
    }

    clearDublicatesTabs(tabs, existsTabs) {
        const existsUrls = new Set(existsTabs.map(t => t.url));

        return tabs.filter(t => !existsUrls.has(t.url));
    }
}

export default TabsStorage;
