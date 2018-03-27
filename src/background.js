const promisify = method => arg => new Promise(resolve => method(arg, resolve));

const storage = chrome.storage.local;
const storageSet = promisify(storage.Set);

import { getTabsFromHistory, filterByTitle } from './lib/tabsApiWrapper';

const tabsActivationMap = {};

let cachedHistory = [];

const updateHistoryCache = () =>
    getTabsFromHistory('', 1000, 60).then(history => (cachedHistory = history));

updateHistoryCache();

setInterval(() => updateHistoryCache(), 60000 * 30);

const methods = {
    getTabsWithActivations(tabs) {
        return tabs
            .map(tab => {
                return Object.assign({}, tab, {
                    lastActiveTime: tabsActivationMap[tab.id] || 0
                });
            })
            .sort((tab1, tab2) => tab2.lastActiveTime - tab1.lastActiveTime);
    },

    async getTabsFromHistory(title) {
        return getTabsFromHistory(title, 15, 365 * 5);
    },

    getTabsFromHistoryCache: function(title) {
        return filterByTitle(cachedHistory, title);
    }
};

chrome.tabs.onActivated.addListener(info => {
    tabsActivationMap[info.tabId] = Date.now();

    storageSet({ 'tabs-activation-map': tabsActivationMap });
});

window.methods = methods;
