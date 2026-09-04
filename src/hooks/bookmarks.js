import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';

import { filterItemsBySearch } from '../lib/DomainSearchShortcuts';

const flatBookmarks = (...list) => {
    const res = [];
    const stack = [...list];

    while (stack.length) {
        const item = stack.pop();
        res.push(item);
        item.children && stack.push(...item.children);
    }

    return res;
};

export function useBookmarks(search, bookmarkId = null, limit = 5) {
    const [result, setResult] = useState({ bookmarks: [], search: null });
    const [allBookmarks, setAllBookmarks] = useState(null);

    useEffect(() => {
        browser.bookmarks
            .getTree()
            .then((allBookmarks) => {
                if (allBookmarks.length > 0) {
                    const flattenBookmarks = flatBookmarks(allBookmarks[0]);

                    setAllBookmarks(flattenBookmarks.filter((b) => b.title));
                } else {
                    setAllBookmarks([]);
                }
            })
            .catch(() => setAllBookmarks([]));
    }, []);

    useEffect(() => {
        if (!search) return;

        let active = true;

        const getBookmarks = async () => {
            if (!bookmarkId && allBookmarks === null) return;

            if (bookmarkId) {
                const bookmarksSubtree =
                    await browser.bookmarks.getSubTree(bookmarkId);

                if (!active) return;

                setResult((current) => {
                    let newBookmarks = [...current.bookmarks];
                    const index = current.bookmarks.findIndex(
                        (b) => b.id === bookmarkId,
                    );

                    newBookmarks.splice(
                        index,
                        1,
                        ...bookmarksSubtree[0].children,
                    );
                    return { bookmarks: newBookmarks, search };
                });
            } else {
                let newBookmarks = [];
                if (allBookmarks) {
                    newBookmarks = filterItemsBySearch(
                        allBookmarks,
                        search,
                        limit,
                    );
                }
                if (newBookmarks.length === 0 && search.text) {
                    const searchedBookmarks = await browser.bookmarks.search(
                        search.text,
                    );
                    newBookmarks = search.shortcut
                        ? filterItemsBySearch(
                              searchedBookmarks,
                              search,
                              limit,
                          )
                        : searchedBookmarks;
                }

                if (active) {
                    setResult({ bookmarks: newBookmarks, search });
                }
            }
        };

        getBookmarks().catch(() => {
            if (active) setResult({ bookmarks: [], search });
        });
        return () => {
            active = false;
        };
    }, [search, bookmarkId, limit, allBookmarks]);

    const isCurrentSearch = result.search === search;

    return {
        bookmarks: isCurrentSearch ? result.bookmarks : [],
        loading: Boolean(search) && !isCurrentSearch,
    };
}
