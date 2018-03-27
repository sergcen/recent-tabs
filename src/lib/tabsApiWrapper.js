import fixKeboardLayoutRu from 'convert-layout/ru';

const promisify = method => (...args) =>
    new Promise(resolve => method(...args, resolve));

const searchInHistory = promisify(chrome.history.search);
const removeBrowserTab = promisify(chrome.tabs.remove);

export const getBrowserTabs = promisify(chrome.tabs.query);

export const getBackgroundPage = promisify(chrome.runtime.getBackgroundPage);

export const filterByTitle = (tabs, title) => {
    if (!title) return tabs;

    title = title.toLowerCase().slice(0, 256);

    const titleConverted = /[а-я]/i.test(title)
        ? fixKeboardLayoutRu.toEn(title)
        : fixKeboardLayoutRu.fromEn(title);

    const byTitle = [];
    const byUrl = [];

    tabs.forEach(tab => {
        const tabTitle = tab.title.toLowerCase();

        if (tabTitle.indexOf(title) !== -1 || tabTitle.indexOf(titleConverted) !== -1) {
            byTitle.push(tab);
            return;
        }
        if (tab.url.indexOf(title) !== -1 || tab.url.indexOf(titleConverted) !== -1) {
            byUrl.push(tab);
        }
    });

    return byTitle.concat(byUrl);
};

export const getActiveTabIndex = tabs => tabs.findIndex(tab => tab.active);

export const selectTab = ({ windowId, id }) => {
    chrome.windows.update(windowId, { focused: true });
    chrome.tabs.update(id, { active: true });
};

export const createTab = ({ url }) => {
    chrome.tabs.create({ active: true, url }, () => {});
};

export const removeTab = ({ id }) => {
    setTimeout(() => removeBrowserTab(id), 0);

    return id;
};

export const removeTabs = (tabs, ignoreMediaAndPinned = true) => {
    const removedIds = tabs
        .filter(tab => !(ignoreMediaAndPinned && (tab.audible || tab.pinned)))
        .map(tab => tab.id);

    // async removing tabs
    (async () => {
        for (const id of removedIds) await removeBrowserTab(id);
    })();

    return removedIds;
};

export const getTabsFromHistory = (title = '', maxResults, days = 1) =>
    searchInHistory({
        text: title,
        maxResults,
        startTime: Date.now() - 86400000 * days
    });

export const isTab = (tab) => 'windowId' in tab;
