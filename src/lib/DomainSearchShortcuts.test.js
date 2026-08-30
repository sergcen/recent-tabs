import {
    filterByUrlPatterns,
    filterItemsBySearch,
    normalizeDomainSearchShortcuts,
    normalizeUrlPattern,
    parseDomainSearchQuery,
    validateDomainSearchShortcuts,
} from './DomainSearchShortcuts';

const shortcuts = [
    {
        key: 'st',
        patterns: ['github.com', 'gitlab.com'],
    },
    { key: 'ст', patterns: ['пример.рф/Задачи'] },
    { key: 'g', patterns: ['google.com'] },
    { key: 'git', patterns: ['github.com'] },
];

const matches = (url, patterns) =>
    filterByUrlPatterns([{ url }], patterns).length === 1;

describe('domain search shortcuts', () => {
    test('recognizes an exact first token and returns the remaining query', () => {
        expect(parseDomainSearchQuery('st task', shortcuts)).toEqual({
            text: 'task',
            shortcut: {
                key: 'st',
                patterns: ['github.com', 'gitlab.com'],
            },
        });
    });

    test('activates a shortcut without a text query', () => {
        expect(parseDomainSearchQuery('ST', shortcuts)).toEqual({
            text: '',
            shortcut: {
                key: 'st',
                patterns: ['github.com', 'gitlab.com'],
            },
        });
    });

    test('accepts leading and repeated whitespace for a known shortcut', () => {
        expect(parseDomainSearchQuery('  st   task', shortcuts).text).toBe(
            'task',
        );
        expect(parseDomainSearchQuery('st\ttask', shortcuts).text).toBe('task');
    });

    test('supports Unicode shortcut keys', () => {
        expect(
            parseDomainSearchQuery('СТ задача', shortcuts).shortcut.key,
        ).toBe('ст');
    });

    test('does not confuse overlapping shortcut keys', () => {
        expect(parseDomainSearchQuery('g query', shortcuts).shortcut.key).toBe(
            'g',
        );
        expect(
            parseDomainSearchQuery('git query', shortcuts).shortcut.key,
        ).toBe('git');
    });

    test('leaves an unknown shortcut as a global query', () => {
        expect(parseDomainSearchQuery('startrack task', shortcuts)).toEqual({
            text: 'startrack task',
            shortcut: null,
        });
    });

    test('normalizes scheme, query, fragment, case, and encoded paths', () => {
        expect(
            normalizeUrlPattern(
                'HTTPS://GITHUB.COM/%D0%97%D0%B0%D0%B4%D0%B0%D1%87%D0%B8?q=1#part',
            ),
        ).toBe('github.com/задачи');
        expect(
            matches(
                'https://github.com/%D0%97%D0%B0%D0%B4%D0%B0%D1%87%D0%B8?redirect=wiki#part',
                ['github.com/задачи'],
            ),
        ).toBe(true);
    });

    test('matches domain and path patterns case-insensitively', () => {
        expect(
            matches('https://github.com/Example/Issue-123', [
                'github.com/example',
            ]),
        ).toBe(true);
    });

    test('keeps a short pattern as a plain hostname substring', () => {
        expect(
            matches('https://github.com/example/repository', [
                'github',
            ]),
        ).toBe(true);
    });

    test('normalizes international domain names before matching', () => {
        expect(
            matches('https://пример.рф/Задачи/1', [
                'пример.рф/задачи',
            ]),
        ).toBe(true);
    });

    test('combines multiple patterns with OR', () => {
        expect(
            matches('https://gitlab.com/example/repository', [
                'github.com',
                'gitlab.com',
            ]),
        ).toBe(true);
    });

    test('does not match a pattern found only in query or fragment', () => {
        expect(
            matches(
                'https://example.com/page?redirect=github.com#repository',
                ['github.com'],
            ),
        ).toBe(false);
    });

    test('filters out items without a usable URL', () => {
        const matching = { url: 'https://github.com/example/repository' };

        expect(
            filterByUrlPatterns(
                [matching, { title: 'Folder' }, { url: 'not a URL' }],
                ['github.com'],
            ),
        ).toEqual([matching]);
    });

    test('applies URL scope before text filtering and the result limit', () => {
        const items = [
            { title: 'task outside', url: 'https://example.com/1' },
            { title: 'task outside', url: 'https://example.com/2' },
            { title: 'task inside', url: 'https://github.com/example/issue' },
        ];

        expect(
            filterItemsBySearch(
                items,
                {
                    text: 'task',
                    shortcut: { key: 'st', patterns: ['github.com'] },
                },
                1,
            ),
        ).toEqual([items[2]]);
    });

    test('normalizes keys and removes duplicate patterns', () => {
        expect(
            normalizeDomainSearchShortcuts([
                {
                    key: ' ST ',
                    patterns: [
                        'HTTPS://GITHUB.COM',
                        'github.com/',
                    ],
                },
            ]),
        ).toEqual([
            {
                key: 'st',
                patterns: ['github.com'],
            },
        ]);
    });

    test('rejects empty, duplicate, and multi-token keys', () => {
        const result = validateDomainSearchShortcuts([
            { key: '', patterns: ['example.com'] },
            { key: 'two words', patterns: ['example.com'] },
            { key: 'ST', patterns: ['github.com'] },
            { key: 'st', patterns: [] },
        ]);

        expect(result.valid).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ index: 0, field: 'key' }),
                expect.objectContaining({ index: 1, field: 'key' }),
                expect.objectContaining({ index: 3, field: 'key' }),
                expect.objectContaining({ index: 3, field: 'patterns' }),
            ]),
        );
    });
});
