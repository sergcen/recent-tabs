import React, {
    useEffect,
    useCallback,
    useRef,
    useState,
    useMemo,
} from 'react';
import TabsList from '../TabsList';

import throttle from 'lodash.throttle';
import Hotkeys from '../../lib/Hotkeys';
import '../../polyfills/scrollIntoViewIfNeeded';

import { useTabs } from '../../hooks/tabs';

import {
    createTab,
    isTab,
    moveTabsToNewWindows,
    selectTab,
} from '../../lib/TabsApiWrapper';

import './TabsPopup.scss';
import { useHistory } from '../../hooks/history';
import { useSelectedTab } from '../../hooks/selectedTab';
import { clearDublicates } from '../../lib/utils';
import { useSettings } from '../../hooks/getBackgroundPage';
import { useBookmarks } from '../../hooks/bookmarks';

const TabsPopup = () => {
    const [query, setQuery] = useState('');
    const [bookmarkId, setBookmarkId] = useState(null);

    const [tabs = [], removeTabs] = useTabs(query);
    const { history = [], loading: historyLoading } = useHistory(query);
    const bookmarks = useBookmarks(query, bookmarkId);

    const showShortcuts = useSettings('showShortcuts');

    const [filteredTabs, filteredBookmarks, filteredHistory] = clearDublicates(
        tabs,
        bookmarks,
        history
    );

    const collections = useMemo(
        () => [tabs, filteredBookmarks, filteredHistory],
        [tabs, bookmarks, history]
    );

    const startTabIndex = query ? 0 : 1;
    const [selectedTab, selectedTabIndex, setSelectedTab] = useSelectedTab(
        startTabIndex,
        collections
    );

    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        const listener = (command) => {
            if (command === 'move-tabs-new-window') {
                moveTabsToNewWindows(tabs);
            }
        };

        browser.commands.onCommand.addListener(listener);

        return () => {
            browser.commands.onCommand.removeListener(listener);
        };
    }, [tabs]);

    const copyHandler = useCallback(
        (e) => {
            if (e.target !== inputRef.current) return;

            e.clipboardData.setData(
                'text/plain',
                selectedTab && selectedTab.url
            );

            e.preventDefault();
        },
        [selectedTab]
    );

    const removeTabsHandler = useCallback(
        (tabsToRemove) => {
            if (tabsToRemove.length > 1) {
                // skip tabs with audio and pinned
                tabsToRemove = tabsToRemove.filter(
                    (tab) => !(tab.audible || tab.pinned)
                );
            }

            removeTabs(tabsToRemove);
        },
        [removeTabs]
    );

    const keyDownHandler = useCallback(
        (e) => {
            Hotkeys(e, {
                'shift+ArrowDown': () => {
                    if (selectedTabIndex > tabs.length - 1) return;

                    const tabsToRemove = tabs.slice(selectedTabIndex);

                    removeTabsHandler(tabsToRemove);
                },
                'shift+ArrowRight': () => removeTabs([selectedTab]),
                ArrowDown: () => setSelectedTab('+1'),
                ArrowUp: () => setSelectedTab('-1'),
                Enter: () => submitSelectTab(selectedTab),
            });
        },
        [selectedTab, removeTabs, removeTabsHandler, setSelectedTab]
    );

    const submitSelectTab = useCallback(
        (tab) => {
            if (filteredBookmarks.includes(tab)) {
                tab.url ?
                    createTab(tab) :
                    setBookmarkId(tab.id);
                return;
            }

            if (isTab(tab)) {
                selectTab(tab);
            } else {
                createTab(tab);
            }

            window.close();
        },
        [filteredBookmarks]
    );

    const textChangeHandler = useCallback(
        (e) => {
            setQuery(e.target.value);
            setSelectedTab(e.target.value ? 0 : 1, true);
            setBookmarkId(null);
        },
        [setQuery, setSelectedTab]
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
                tabs={tabs}
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
        </div>
    );
};

export default TabsPopup;
