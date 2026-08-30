import React, {
    useEffect,
    useCallback,
    useRef,
    useState,
    useMemo,
} from 'react';
import TabsList from '../TabsList';

import Hotkeys from '../../lib/Hotkeys';
import '../../polyfills/scrollIntoViewIfNeeded';

import { useTabs } from '../../hooks/tabs';

import { createTab, isTab, selectTab } from '../../lib/TabsApiWrapper';

import './TabsPopup.scss';
import { useHistory } from '../../hooks/history';
import { useSelectedTab } from '../../hooks/selectedTab';
import { clearDublicates } from '../../lib/utils';
import { useSettings } from '../../hooks/settings';
import { useBookmarks } from '../../hooks/bookmarks';
import { parseDomainSearchQuery } from '../../lib/DomainSearchShortcuts';

const TabsPopup = () => {
    const [query, setQuery] = useState('');
    const [bookmarkId, setBookmarkId] = useState(null);
    const domainSearchShortcuts = useSettings('domainSearchShortcuts');

    const search = useMemo(
        () =>
            domainSearchShortcuts === undefined
                ? null
                : parseDomainSearchQuery(query, domainSearchShortcuts),
        [query, domainSearchShortcuts],
    );

    const [tabs = [], removeTabs, tabsLoading] = useTabs(search);
    const { history = [], loading: historyLoading } = useHistory(search);
    const { bookmarks = [], loading: bookmarksLoading } = useBookmarks(
        search,
        bookmarkId,
    );

    const showShortcuts = useSettings('showShortcuts');

    const collections = clearDublicates(tabs, bookmarks, history);
    const [filteredTabs, filteredBookmarks, filteredHistory] = collections;

    const startTabIndex = query ? 0 : 1;
    const [selectedTab, selectedTabIndex, setSelectedTab] = useSelectedTab(
        startTabIndex,
        collections,
    );

    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef) {
            inputRef.current.focus();
        }
    }, []);

    const copyHandler = useCallback(
        (e) => {
            if (e.target !== inputRef.current) return;

            e.clipboardData.setData(
                'text/plain',
                selectedTab && selectedTab.url,
            );

            e.preventDefault();
        },
        [selectedTab],
    );

    const removeTabsHandler = useCallback(
        (tabsToRemove) => {
            if (tabsToRemove.length > 1) {
                // skip tabs with audio and pinned
                tabsToRemove = tabsToRemove.filter(
                    (tab) => !(tab.audible || tab.pinned),
                );
            }

            removeTabs(tabsToRemove);
        },
        [removeTabs],
    );

    const keyDownHandler = useCallback(
        (e) => {
            Hotkeys(e, {
                'shift+ArrowDown': () => {
                    if (selectedTabIndex > tabs.length - 1) return;

                    const tabsToRemove = tabs.slice(selectedTabIndex);

                    removeTabsHandler(tabsToRemove);
                },
                'shift+ArrowRight': () => {
                    if (isTab(selectedTab)) removeTabs([selectedTab]);
                },
                ArrowDown: () => setSelectedTab('+1'),
                ArrowUp: () => setSelectedTab('-1'),
                Enter: () => submitSelectTab(selectedTab),
            });
        },
        [selectedTab, removeTabs, removeTabsHandler, setSelectedTab],
    );

    const submitSelectTab = useCallback(
        (tab) => {
            if (!tab) return;

            if (filteredBookmarks.includes(tab)) {
                tab.url ? createTab(tab) : setBookmarkId(tab.id);
                return;
            }

            if (isTab(tab)) {
                selectTab(tab);
            } else {
                createTab(tab);
            }

            window.close();
        },
        [filteredBookmarks],
    );

    const resultsLoading = tabsLoading || bookmarksLoading || historyLoading;
    const hasResults = collections.some((collection) => collection.length > 0);
    const shortcut = search && search.shortcut;

    const textChangeHandler = useCallback(
        (e) => {
            setQuery(e.target.value);
            setSelectedTab(e.target.value ? 0 : 1, true);
            setBookmarkId(null);
        },
        [setQuery, setSelectedTab],
    );

    return (
        <div className="TabsPopup">
            <input
                ref={inputRef}
                type="text"
                className="filterInput"
                onKeyDown={keyDownHandler}
                onChange={textChangeHandler}
                onCopy={copyHandler}
            />
            {shortcut && (
                <div
                    className="TabsPopup-Scope"
                    title={shortcut.patterns.join('\n')}
                >
                    <b>{shortcut.key}</b>
                    <span>
                        {shortcut.patterns.length} URL pattern
                        {shortcut.patterns.length === 1 ? '' : 's'}:{' '}
                        {shortcut.patterns.slice(0, 2).join(', ')}
                        {shortcut.patterns.length > 2 && ', …'}
                    </span>
                </div>
            )}
            {showShortcuts && (
                <div className="TabsPopup-Keymap">
                    <span>
                        <b>Shift + &rarr;</b> close
                    </span>
                    <span>
                        <b>Shift + &darr;</b> close and all below
                    </span>
                    <span>
                        <b>Ctrl + C</b> copy url
                    </span>
                    <span>
                        <b>Alt + N</b> move to new window
                    </span>
                </div>
            )}
            <TabsList
                tabs={filteredTabs}
                selectedTab={selectedTab}
                onSelect={submitSelectTab}
            />
            <TabsList
                header="Bookmarks"
                tabs={filteredBookmarks}
                selectedTab={selectedTab}
                onSelect={submitSelectTab}
            />
            <TabsList
                header="History"
                tabs={filteredHistory}
                selectedTab={selectedTab}
                onSelect={submitSelectTab}
                isLoading={historyLoading}
            />
            {shortcut && !resultsLoading && !hasResults && (
                <div className="TabsPopup-Empty">
                    No results in “{shortcut.key}”
                </div>
            )}
        </div>
    );
};

export default TabsPopup;
