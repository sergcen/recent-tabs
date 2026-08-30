import React, { useState, useEffect, useCallback } from 'react';

import tabsStorage from '../lib/tabsStore';

export function useTabs(query = '', fromCache = false) {
    const [tabs, setTabs] = useState([]);

    useEffect(() => {
        let active = true;

        const getTabs = async () => {
            const tabs = await tabsStorage.get(query, fromCache);

            if (active) setTabs(tabs);
        };
        getTabs();

        return () => {
            active = false;
        };
    }, [query, fromCache]);

    const removeTabs = useCallback((tabsToRemove) => {
        const idsToRemove = tabsToRemove.map((t) => t.id);

        if (idsToRemove.length === 0) return;

        setTabs((tabs) => tabs.filter((t) => !idsToRemove.includes(t.id)));

        tabsStorage.removeTabs(idsToRemove);
    }, []);

    return [tabs, removeTabs];
}
