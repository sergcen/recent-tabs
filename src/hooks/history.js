import { useState, useEffect } from 'react';

import tabsStorage from '../lib/tabsStore';
import { clearDublicates } from '../lib/utils';

export function useHistory(search, count) {
    const [historyStorage, setHistory] = useState({
        history: [],
        loading: false,
        search: null,
    });

    useEffect(() => {
        if (!search) return;

        let active = true;

        const getHistory = async () => {
            const { history, refinedHistory } = await tabsStorage.getHistory(
                search,
                count,
            );

            if (!active) return;

            setHistory({
                history,
                loading: Boolean(refinedHistory),
                search,
            });

            if (!refinedHistory) return;

            try {
                const rHistory = await refinedHistory.promise;
                const [h1, h2] = clearDublicates(history, rHistory);

                if (active) {
                    setHistory({
                        history: h1.concat(h2),
                        loading: false,
                        search,
                    });
                }
            } catch (e) {
                if (active) {
                    setHistory({ history, loading: false, search });
                }
            }
        };

        getHistory().catch(() => {
            if (active) {
                setHistory({ history: [], loading: false, search });
            }
        });

        return () => {
            active = false;
        };
    }, [search, count]);

    return search && historyStorage.search === search
        ? historyStorage
        : { history: [], loading: Boolean(search) };
}
