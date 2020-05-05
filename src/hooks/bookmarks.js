import React, { useState, useEffect, useMemo } from 'react';

import filterTabs from '../lib/FilterTabs';

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

export function useBookmarks(query = '', bookmarkId = null, limit = 5) {
    const [bookmarks, setBookmarks] = useState([]);
    const [allBookmarks, setAllBookmarks] = useState(null);

    useEffect(() => {
        browser.bookmarks
            .getTree()
            .then((allBookmarks) => {
                if (allBookmarks.length > 0) {
                    const flattenBookmarks = flatBookmarks(allBookmarks[0]);

                    setAllBookmarks(flattenBookmarks.filter(b => b.title))
                }
            });
    }, []);

    useEffect(() => {
        const getBookmarks = async () => {
            if (bookmarkId) {
                const bookmarksSubtree = await browser.bookmarks.getSubTree(
                    bookmarkId
                );

                setBookmarks((bookmarks) => {
                    let newBookmarks = [...bookmarks];
                    const index = bookmarks.findIndex(
                        (b) => b.id === bookmarkId
                    );

                    newBookmarks.splice(
                        index,
                        1,
                        ...bookmarksSubtree[0].children
                    );
                    return newBookmarks;
                });
            } else {
                let newBookmarks = [];
                if (allBookmarks) {
                    newBookmarks = filterTabs(allBookmarks, query, limit);
                }
                if (newBookmarks.length === 0 && query) {
                    newBookmarks = await browser.bookmarks.search(query);
                }

                setBookmarks(newBookmarks);
            }
        };

        getBookmarks();
    }, [query, bookmarkId, limit, allBookmarks]);

    return bookmarks;
}
