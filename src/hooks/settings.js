import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

import SettingsStorage from '../lib/Storage';

const settingsStorage = new SettingsStorage();

export function useSettings(item) {
    const [value, setValue] = useState();

    useEffect(() => {
        let active = true;

        settingsStorage.ready.then(() => {
            if (active) setValue(settingsStorage[item]);
        });

        const handleStorageChange = (changes, areaName) => {
            if (areaName === 'local' && changes[item]) {
                setValue(changes[item].newValue);
            }
        };

        browser.storage.onChanged.addListener(handleStorageChange);

        return () => {
            active = false;
            browser.storage.onChanged.removeListener(handleStorageChange);
        };
    }, [item]);

    return value;
}
