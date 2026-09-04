import { useState, useEffect, useCallback } from 'react';

import tabsStorage from '../lib/tabsStore';

export function useTabs(search, fromCache = false) {
    const [result, setResult] = useState({ tabs: [], search: null });

    useEffect(() => {
        if (!search) return;

        let active = true;

        const getTabs = async () => {
            const tabs = await tabsStorage.get(search, fromCache);

            if (active) setResult({ tabs, search });
        };
        getTabs().catch(() => {
            if (active) setResult({ tabs: [], search });
        });

        return () => {
            active = false;
        };
    }, [search, fromCache]);

    const removeTabs = useCallback((tabsToRemove) => {
        const idsToRemove = tabsToRemove.map((t) => t.id);

        if (idsToRemove.length === 0) return;

        setResult((current) => ({
            ...current,
            tabs: current.tabs.filter((t) => !idsToRemove.includes(t.id)),
        }));

        tabsStorage.removeTabs(idsToRemove);
    }, []);

    const isCurrentSearch = result.search === search;

    return [
        isCurrentSearch ? result.tabs : [],
        removeTabs,
        Boolean(search) && !isCurrentSearch,
    ];
}
