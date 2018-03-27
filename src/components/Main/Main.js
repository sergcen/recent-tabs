import React, { Component } from 'React';
import TabsList from '../TabsList';

import './Main.scss';

import throttle from 'lodash.throttle';
import hotkeys from '../../lib/hotkeys';

import {
    createTab,
    filterByTitle,
    getActiveTabIndex,
    selectTab,
    removeTab,
    removeTabs,
    getBackgroundPage,
    getBrowserTabs,
    isTab
} from '../../lib/tabsApiWrapper';

const updateScrollFn = throttle(elem => elem.scrollIntoViewIfNeeded(), 100);

let bgWindow;

getBackgroundPage().then(bg => (bgWindow = bg));

class Main extends Component {
    state = {
        tabs: [],
        tabsHistory: [],
        tabsHistorySearch: false,
        selectedTab: null,
        text: ''
    };

    cachedTabs = [];
    refineHistoryTimeout = null;
    input = null;

    componentDidMount() {
        this.updateTabsList();

        if (this.input) {
            this.copyToClipboardHandler(this.input);
            this.input.focus();
        }
    }

    copyToClipboardHandler(input) {
        input.addEventListener('copy', e => {
            if (e.target.selectionEnd) return;

            e.clipboardData.setData(
                'text/plain',
                this.state.selectedTab && this.state.selectedTab.url
            );

            e.preventDefault();
        });
    }

    async getTabs(title) {
        if (!title) {
            const tabs = await getBrowserTabs({ currentWindow: true });

            this.cachedTabs = bgWindow.methods.getTabsWithActivations(tabs);
        }

        return filterByTitle(this.cachedTabs, title);
    }

    setTabsState(state) {
        const { tabs = this.state.tabs, tabsHistory } = state;
        const tabsMap = new Map(tabs.map(t => [t.url, t]));
        const tabsHistoryMap =
            tabsHistory && new Map(tabsHistory.map(t => [t.url, t]));

        const tabsState = { tabs };

        if (tabsHistory) {
            tabsState.tabsHistory = [...tabsHistoryMap.values()].filter(
                tab => !tabsMap.has(tab.url)
            );
        }

        this.setState(Object.assign(state, tabsState));
    }

    async updateTabsList(title) {
        clearTimeout(this.refineHistoryTimeout);
        clearTimeout(this.historyTimeout);

        const tabs = await this.getTabs(title);
        // if filter text is empty select previous selected tab
        const selectedTab = !title && tabs[getActiveTabIndex(tabs) + 1] || tabs[0];

        const tryToSearchInHistory = Boolean(title && tabs.length <= 5);

        const state = {
            text: title,
            tabs,
            tabsHistorySearch: tryToSearchInHistory
        };

        if (selectedTab) {
            state.selectedTab = selectedTab;
        }

        if (tryToSearchInHistory) {
            this.refineHistoryTimeout = setTimeout(() => {
                clearTimeout(this.historyTimeout);

                this.searchInHistory(title);
            }, 500);
        }

        this.historyTimeout =
            tryToSearchInHistory &&
            setTimeout(async () => {
                if (title !== this.state.text) return;

                const tabsHistory = await bgWindow.methods.getTabsFromHistoryCache(
                    title
                );

                if (tabsHistory.length > 15) {
                    clearTimeout(this.refineHistoryTimeout);
                }

                const state = { tabsHistory };
                const selectTabHistory = selectedTab || tabs[0] || tabsHistory[0];

                if (selectTabHistory) {
                    state.selectedTab = selectTabHistory;
                }

                this.setTabsState(state);
            }, 100);

        this.setTabsState(state);
    }

    async searchInHistory(title) {
        this.setState({ tabsHistorySearch: true });

        const tabsHistoryRefined = await bgWindow.methods.getTabsFromHistory(
            title
        );

        if (title !== this.state.text) return;

        const { tabsHistory, selectedTab } = this.state;

        const newState = {
            tabsHistory: [...tabsHistory.slice(0, 15), ...tabsHistoryRefined],
            tabsHistorySearch: false
        };

        if (this.state.tabs.length === 0 && tabsHistory.length === 0) {
            newState.selectedTab = newState.tabsHistory[0];
        } else {
            newState.selectedTab = selectedTab;
        }

        this.setTabsState(newState);
    }

    onKeyHandler(e) {
        hotkeys(e, {
            'shift+ArrowDown': () => {
                const tabsToRemove = this.state.tabs.slice(
                    this.getCurrentTabIndex()
                );

                this.removeTabs(tabsToRemove);
            },
            'shift+ArrowRight': () => this.removeTab(this.state.selectedTab),
            ArrowDown: () => this.selectTab(this.getCurrentTabIndex() + 1),
            ArrowUp: () => this.selectTab(this.getCurrentTabIndex() - 1),
            Enter: () => this.submitSelectTab(this.state.selectedTab)
        });
    }

    getAllTabsCount() {
        return (
            this.state.tabs.length +
            (this.state.tabsHistory ? this.state.tabsHistory.length : 0)
        );
    }

    getTabByIndex(index) {
        return index < this.state.tabs.length
            ? this.state.tabs[index]
            : this.state.tabsHistory[index - this.state.tabs.length];
    }

    getCurrentTabIndex() {
        const tabIndex = this.state.tabs.indexOf(this.state.selectedTab);

        return tabIndex !== -1
            ? tabIndex
            : this.state.tabsHistory.indexOf(this.state.selectedTab) +
                  this.state.tabs.length;
    }

    selectTab(tabIndex) {
        if (tabIndex < 0 || tabIndex >= this.getAllTabsCount()) return;

        this.setState({ selectedTab: this.getTabByIndex(tabIndex) });
    }

    removeTabs(tabs) {
        const idsToRemove = new Set(removeTabs(tabs));

        if (idsToRemove.size === 0) return;

        const resultTabs = this.state.tabs.filter(
            tab => !idsToRemove.has(tab.id)
        );

        const { tabsHistory } = this.state;

        this.setState({
            tabs: resultTabs,
            selectedTab:
                resultTabs[resultTabs.length - 1] ||
                (tabsHistory && tabsHistory[0])
        });
    }

    removeTab(tab) {
        const tabIndex = this.state.tabs.indexOf(tab);

        if (tabIndex === -1) return;

        const id = removeTab(tab);
        // after removing selecting next tab by index
        const selectedTabIndex = tabIndex + 1;
        const resultTabs = this.state.tabs.filter(tab => tab.id !== id);
        const selectedTab =
            this.state.tabs[selectedTabIndex] ||
            resultTabs[resultTabs.length - 1];

        this.setState({ tabs: resultTabs, selectedTab });
    }

    submitSelectTab(tab) {
        if (!tab) return;

        // if selected tab from history
        isTab(tab) ? selectTab(tab) : createTab(tab);
    }

    render() {
        const { tabs, selectedTab, tabsHistory } = this.state;
        const showHistoryHeader =
            this.state.tabsHistorySearch ||
            (tabsHistory && tabsHistory.length > 0);

        return [
            <input
                ref={input => (this.input = input)}
                type="text"
                className="filterInput"
                onKeyDown={e => this.onKeyHandler(e)}
                onChange={e => this.updateTabsList(e.target.value)}
            />,
            <TabsList
                tabs={tabs}
                selectedTab={selectedTab}
                onSelect={tab => this.submitSelectTab(tab)}
                onChangeActiveItem={updateScrollFn}
            />,
            <TabsList
                header={showHistoryHeader && 'История'}
                tabs={tabsHistory}
                selectedTab={selectedTab}
                onSelect={tab => this.submitSelectTab(tab)}
                isLoading={this.state.tabsHistorySearch}
                onChangeActiveItem={updateScrollFn}
            />
        ];
    }
}

export default Main;
