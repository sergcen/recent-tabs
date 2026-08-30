import filterTabs from './FilterTabs';

const generateTabs = (count, urlPrefix = '') =>
    Array.from({ length: count }, (_, index) => ({
        title: `tab ${index}`,
        url: `https://${urlPrefix}sometabs${index}.com`,
    }));

describe('filterTabs', () => {
    test('filters tabs by title', () => {
        expect(filterTabs(generateTabs(11), 'tab 1')).toHaveLength(2);
    });

    test('filters tabs by URL', () => {
        expect(filterTabs(generateTabs(11), 'sometabs1')).toHaveLength(2);
    });

    test('corrects text entered with the Russian keyboard layout', () => {
        const tabs = [
            { title: 'hello world', url: 'https://example.com' },
            { title: 'another tab', url: 'https://another.example' },
        ];

        expect(filterTabs(tabs, 'руддщ')).toEqual([tabs[0]]);
    });

    test('respects the result limit', () => {
        expect(filterTabs(generateTabs(11), 'tab', 3)).toHaveLength(3);
    });
});
