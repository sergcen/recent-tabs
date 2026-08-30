import React, { useState, useEffect } from 'react';

import tabsStorage from '../lib/tabsStore';
import { clearDublicates } from '../lib/utils';

export function useHistory(query = '', count) {
    const [historyStorage, setHistory] = useState([]);

    useEffect(() => {
        let active = true;

        const getHistory = async () => {
            const { history, refinedHistory } = await tabsStorage.getHistory(
                query,
                count
            );

            if (!active) return;

            setHistory({ history, loading: Boolean(refinedHistory) });

            try {
                const rHistory = await refinedHistory.promise;
                const [h1, h2] = clearDublicates(history, rHistory);

                if (active) {
                    setHistory({ history: h1.concat(h2), loading: false });
                }
            } catch (e) {}
        };

        getHistory();

        return () => {
            active = false;
        };
    }, [query, count]);

    return historyStorage;
}
