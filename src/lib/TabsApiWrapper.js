import browser from 'webextension-polyfill';

const searchInHistory = browser.history.search;
const removeBrowserTab = browser.tabs.remove;

export const getBrowserTabs = browser.tabs.query;
export const moveBrowserTab = browser.tabs.move;

export const getActiveTabIndex = (tabs) => tabs.findIndex((tab) => tab.active);

export const moveTabsToNewWindows = async (tabsToMove) => {
    const ids = tabsToMove.map((t) => t.id);

    if (ids.length === 0) return;

    try {
        const newWindow = await browser.windows.create({
            tabId: ids[0],
            state: 'maximized',
        });

        if (ids.length > 1) {
            await browser.tabs.move(ids.slice(1), {
                windowId: newWindow.id,
                index: -1,
            });
        }
    } catch (e) {
        throw Error(JSON.stringify(e));
    }
};

export const selectTab = ({ windowId, id }) => {
    browser.windows.update(windowId, { focused: true });
    browser.tabs.update(id, { active: true });
};

export const moveTab = (id, options) => {
    return moveBrowserTab(id, options);
};

export const createTab = ({ url }) => {
    browser.tabs.create({ active: true, url });
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
        startTime: Date.now() - 86400000 * days,
    });

export const isTab = (tab) => Boolean(tab && 'windowId' in tab);
