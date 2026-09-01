import { clearDublicates, removeTabsFromIndex } from './utils';

test('shift+ArrowDown uses rendered tab indexes after duplicate removal', () => {
    const first = { id: 1, url: 'https://example.com/first' };
    const duplicate = { id: 2, url: first.url };
    const second = { id: 3, url: 'https://example.com/second' };
    const bookmark = { id: 'bookmark', url: 'https://example.com/bookmark' };
    const [filteredTabs] = clearDublicates(
        [first, duplicate, second],
        [bookmark],
    );
    const removeTabs = jest.fn();

    removeTabsFromIndex(filteredTabs, 1, removeTabs);
    expect(removeTabs).toHaveBeenCalledWith([second]);

    removeTabs.mockClear();
    removeTabsFromIndex(filteredTabs, filteredTabs.length, removeTabs);
    expect(removeTabs).not.toHaveBeenCalled();
});
