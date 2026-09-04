jest.mock('webextension-polyfill', () => {
    const local = {
        get: jest.fn(function () {
            if (this !== local) throw new TypeError('Illegal invocation');
            return Promise.resolve({ domainSearchShortcuts: [] });
        }),
        set: jest.fn(function () {
            if (this !== local) throw new TypeError('Illegal invocation');
            return Promise.resolve();
        }),
    };

    return {
        __esModule: true,
        default: { storage: { local } },
    };
});

import browser from 'webextension-polyfill';
import Storage from './Storage';

describe('Storage browser API binding', () => {
    test('calls StorageArea methods with their receiver', async () => {
        const storage = new Storage();

        await storage.ready;
        await storage.set('showShortcuts', false);

        expect(browser.storage.local.get).toHaveBeenCalledTimes(1);
        expect(browser.storage.local.set).toHaveBeenCalledWith({
            showShortcuts: false,
        });
    });
});
