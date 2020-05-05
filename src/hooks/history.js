import React, { useState, useEffect, useMemo } from 'react';

import { getBackgroundPage } from '../lib/TabsApiWrapper';
import { clearDublicates } from '../lib/utils';

export function useHistory(query = '', count) {
    const [historyStorage, setHistory] = useState([]);

    const bgWindowPromise = useMemo(() => getBackgroundPage(), [getBackgroundPage]);

    useEffect(() => {
        const getHistory = async () => {
            const bgWindow = await bgWindowPromise;

            const { history, refinedHistory } = await bgWindow.tabsStorage.getHistory(
                query,
                count
            );

            setHistory({ history, loading: Boolean(refinedHistory) });

            try {
                const rHistory = await refinedHistory.promise;
                const [h1, h2] = clearDublicates(history, rHistory);

                setHistory({ history: h1.concat(h2), loading: false });
            } catch(e) {

            }
        };

        getHistory();
    }, [query, count]);

    return historyStorage;
}
