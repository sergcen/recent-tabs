import promisify from './promisify'

const searchInHistory = promisify(chrome.history.search);
const removeBrowserTab = promisify(chrome.tabs.remove);

export const getBrowserTabs = promisify(chrome.tabs.query);
export const getBackgroundPage = promisify(chrome.runtime.getBackgroundPage);
export const moveBrowserTab = promisify(chrome.tabs.move);

export const getActiveTabIndex = tabs => tabs.findIndex(tab => tab.active);

export const selectTab = ({ windowId, id }) => {
    chrome.windows.update(windowId, { focused: true });
    chrome.tabs.update(id, { active: true });
};

export const moveTab = (id, options) => {
    return moveBrowserTab(id, options);
};

export const createTab = ({ url }) => {
    chrome.tabs.create({ active: true, url }, () => {});
};

export const removeTab = async ({ id }) => {
    await removeBrowserTab(id);

    return id;
};

export const removeTabs = async (ids) => {
    await removeBrowserTab(ids);

    return ids;
};

export const getTabsFromHistory = (title = '', maxResults, days = 1) =>
    searchInHistory({
        text: title,
        maxResults,
        startTime: Date.now() - 86400000 * days
    });

export const isTab = (tab) => 'windowId' in tab;
