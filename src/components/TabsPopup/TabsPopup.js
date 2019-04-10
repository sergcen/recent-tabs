import React, { Component } from 'react';
import TabsList from '../TabsList';

import throttle from 'lodash.throttle';
import Hotkeys from '../../lib/Hotkeys';
import "../../polyfills/scrollIntoViewIfNeeded";

import {
    createTab,
    selectTab,
    getBackgroundPage,
    isTab
} from '../../lib/TabsApiWrapper';

import './TabsPopup.scss';

const updateScrollFn = throttle(elem => elem.scrollIntoViewIfNeeded(), 100);

let bgWindow;

class TabsPopup extends Component {
    state = {
        tabs: [],
        tabsHistory: [],
        tabsHistorySearch: false,
        selectedTab: null
    };
    text = '';
    haveRemovedTabs = false;

    input = null;

    componentDidMount() {
        getBackgroundPage().then(async (bg) => {
            bgWindow = bg;
            await this.queryTabs({ fromCache: false });
            this.selectTab(1);
        });

        if (this.input) {
            this.copyToClipboardHandler(this.input);
            this.input.focus();
        }
    }

    async queryTabs({ queryText, fromCache, exclude }) {
        if (this.refinedHistoryQuery) {
            this.refinedHistoryQuery.cancel();
            this.refinedHistoryQuery = null;
        }

        const {
            tabs,
            history,
            refinedHistory
        } = await bgWindow.tabsStorage.get(queryText, fromCache, exclude);

        this.setState({
            text: queryText,
            tabs,
            tabsHistory: history,
            tabsHistorySearch: Boolean(refinedHistory)
        });

        if (refinedHistory) {
            this.refinedHistoryQuery = refinedHistory;

            refinedHistory.promise.then(refinedHistory =>
                this.setState({
                    tabsHistory: refinedHistory,
                    tabsHistorySearch: false
                })
            );
        }
    }

    copyToClipboardHandler(input) {
        input.addEventListener('copy', e => {
            if (e.target !== input) return;

            e.clipboardData.setData(
                'text/plain',
                this.state.selectedTab && this.state.selectedTab.url
            );

            e.preventDefault();
        });
    }

    async updateTabsList(text) {
        this.text = text;
        await this.queryTabs({ queryText: text, fromCache: !this.haveRemovedTabs });
        this.selectTab(0);
    }

    getSelectedTab() {
        const { selectedTab } = this.state;

        return selectedTab;
    }

    onKeyHandler(e) {
        Hotkeys(e, {
            'shift+ArrowDown': () => {
                const tabsToRemove = this.state.tabs.slice(
                    this.getCurrentTabIndex()
                );

                this.removeTabs(tabsToRemove);
            },
            'shift+ArrowRight': () => this.removeTab(this.getSelectedTab()),
            ArrowDown: () => this.incSelectedTabIndex(1),
            ArrowUp: () => this.incSelectedTabIndex(-1),
            Enter: () => this.submitSelectTab(this.getSelectedTab())
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
        const selectedTab = this.getSelectedTab();

        return this.getTabIndex(selectedTab);
    }

    getTabIndex(tab) {
        const { tabs, tabsHistory } = this.state;
        const tabIndex = tabs.findIndex(t => t.id === tab.id);

        return tabIndex !== -1
            ? tabIndex
            : tabsHistory.findIndex(t => t.id === tab.id) + tabs.length;
    }

    incSelectedTabIndex(n) {
        this.selectTab(this.getCurrentTabIndex() + n);
    }

    selectTab(tabIndex = 0) {
        if (tabIndex >= this.getAllTabsCount()) return;
        if (tabIndex < 0) tabIndex = 0;

        let selectedTab = this.getTabByIndex(tabIndex);

        // if (selectedTab.active) {
        //     selectedTab = this.getTabByIndex(tabIndex + 1);
        // }

        this.setState({ selectedTab });
    }

    async removeTabs(tabsToRemove) {
        // skip tabs with audio and pinned
        tabsToRemove = tabsToRemove.filter(tab => !(tab.audible || tab.pinned));

        const idsToRemove = tabsToRemove.map(t => t.id);

        if (idsToRemove.length === 0) return;

        this.incSelectedTabIndex(-1);

        await bgWindow.tabsStorage.removeTabs(idsToRemove);

        await this.queryTabs({
            queryText: this.text,
            fromCache: false,
            exclude: idsToRemove
        });
    }

    async removeTab(tab) {
        const { tabs } = this.state;

        const tabIndex = this.getTabIndex(tab);

        if (tabIndex === -1 || tabIndex >= tabs.length) return;

        const isLastTab = tabIndex === tabs.length - 1;
        this.incSelectedTabIndex(isLastTab ? -1 : 1);

        await bgWindow.tabsStorage.removeTab(tab.id);

        await this.queryTabs({
            queryText: this.text,
            fromCache: false,
            exclude: [tab.id]
        });
    }

    submitSelectTab(tab) {
        // if selected tab from history
        isTab(tab) ? selectTab(tab) : createTab(tab);
        window.close();
    }

    render() {
        const { tabs, tabsHistory } = this.state;
        const selectedTab = this.getSelectedTab();
        const showHistoryHeader =
            this.state.tabsHistorySearch ||
            (tabsHistory && tabsHistory.length > 0);

        return (
        <React.Fragment>
            <input
                ref={input => (this.input = input)}
                type="text"
                className="filterInput"
                onKeyDown={e => this.onKeyHandler(e)}
                onChange={e => this.updateTabsList(e.target.value)}
            />
            <TabsList
                tabs={tabs}
                selectedTab={selectedTab}
                onSelect={tab => this.submitSelectTab(tab)}
                onChangeActiveItem={updateScrollFn}
            />
            <TabsList
                header={showHistoryHeader && 'История'}
                tabs={tabsHistory}
                selectedTab={selectedTab}
                onSelect={tab => this.submitSelectTab(tab)}
                isLoading={this.state.tabsHistorySearch}
                onChangeActiveItem={updateScrollFn}
            />
        </React.Fragment>
        );
    }
}

export default TabsPopup;
