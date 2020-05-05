import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { getBackgroundPage } from '../lib/TabsApiWrapper';

export function useTabs(query = '', fromCache = false) {
    const [tabs, setTabs] = useState([]);

    const bgWindowPromise = useMemo(() => getBackgroundPage(), [
        getBackgroundPage,
    ]);

    useEffect(() => {
        const getTabs = async () => {
            const bgWindow = await bgWindowPromise;

            const tabs = await bgWindow.tabsStorage.get(query, fromCache);

            setTabs(tabs);
        };
        getTabs();
    }, [query, fromCache]);

    const removeTabs = useCallback((tabsToRemove) => {
        const idsToRemove = tabsToRemove.map((t) => t.id);

        if (idsToRemove.length === 0) return;

        setTabs((tabs) => tabs.filter((t) => !idsToRemove.includes(t.id)));

        bgWindowPromise.then((bgWindow) =>
            bgWindow.tabsStorage.removeTabs(idsToRemove)
        );
    }, []);

    return [tabs, removeTabs];
}
