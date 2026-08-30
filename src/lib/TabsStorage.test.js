jest.mock('webextension-polyfill', () => ({
    __esModule: true,
    default: {
        storage: {
            local: {
                get: jest.fn(),
            },
        },
        history: {
            search: jest.fn(),
        },
        tabs: {
            query: jest.fn(),
            move: jest.fn(),
            remove: jest.fn(),
        },
    },
}));

import browser from 'webextension-polyfill';
import TabsStorage from './TabsStorage';

const mockHistorySearch = browser.history.search;
const mockStorageGet = browser.storage.local.get;

describe('TabsStorage scoped history search', () => {
    let tabsStorage;

    beforeEach(async () => {
        mockStorageGet.mockReset().mockResolvedValue({});
        mockHistorySearch.mockReset().mockResolvedValue([]);

        tabsStorage = new TabsStorage();
        await Promise.all([tabsStorage.ready, tabsStorage.historyLoading]);

        mockHistorySearch.mockClear();
    });

    test('preserves the single browser query for global history search', async () => {
        const history = [
            {
                id: 'global',
                title: 'task',
                url: 'https://example.com/task',
            },
        ];
        mockHistorySearch.mockResolvedValue(history);

        await expect(tabsStorage.searchHistory('task', 25)).resolves.toEqual(
            history,
        );
        expect(mockHistorySearch).toHaveBeenCalledTimes(1);
        expect(mockHistorySearch).toHaveBeenCalledWith(
            expect.objectContaining({ text: 'task', maxResults: 25 }),
        );
    });

    test('merges scoped candidates and applies exact URL and text filters', async () => {
        const scopedUrl = 'https://example.com/tasks/1';
        const outside = {
            id: 'outside',
            title: 'task outside scope',
            url: 'https://outside.test/task',
            lastVisitTime: 50,
        };
        const scopedOlder = {
            id: 'scoped-old',
            title: 'task inside scope',
            url: scopedUrl,
            lastVisitTime: 10,
        };
        const scopedNewer = {
            ...scopedOlder,
            id: 'scoped-new',
            lastVisitTime: 100,
        };
        const wrongText = {
            id: 'wrong-text',
            title: 'unrelated page',
            url: 'https://example.com/other',
            lastVisitTime: 200,
        };

        mockHistorySearch.mockImplementation(({ text }) => {
            if (text === 'task') return Promise.resolve([outside, scopedOlder]);
            if (text === 'example.com') {
                return Promise.resolve([wrongText, scopedNewer]);
            }
            return Promise.resolve([]);
        });

        const result = await tabsStorage.searchHistory(
            {
                text: 'task',
                shortcut: { key: 'ex', patterns: ['example.com'] },
            },
            25,
        );

        expect(mockHistorySearch).toHaveBeenCalledTimes(2);
        expect(result).toEqual([scopedNewer]);
    });

    test('uses every shortcut pattern as an OR history candidate query', async () => {
        mockHistorySearch.mockImplementation(({ text }) =>
            Promise.resolve([
                {
                    id: text,
                    title: text,
                    url: `https://${text}/page`,
                    lastVisitTime: text === 'second.test' ? 20 : 10,
                },
            ]),
        );

        const result = await tabsStorage.searchHistory(
            {
                text: '',
                shortcut: {
                    key: 'sites',
                    patterns: ['first.test', 'second.test'],
                },
            },
            25,
        );

        expect(mockHistorySearch).toHaveBeenCalledTimes(2);
        expect(result.map((item) => item.id)).toEqual([
            'second.test',
            'first.test',
        ]);
    });
});
