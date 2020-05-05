import React, { useState, useEffect, useMemo } from 'react';

import { getBackgroundPage } from '../lib/TabsApiWrapper';

export function useSettings(item) {
    const [settingsStorageItem, setSettingsStorageItem] = useState([]);

    const bgWindowPromise = useMemo(() => getBackgroundPage(), [
        getBackgroundPage,
    ]);

    useEffect(() => {
        const getTabs = async () => {
            const bgWindow = await bgWindowPromise;

            setSettingsStorageItem(bgWindow.settingsStorage[item]);
        };
        getTabs();
    }, [item]);

    return settingsStorageItem;
}
