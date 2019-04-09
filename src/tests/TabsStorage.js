import { assert } from 'chai';
import chrome from 'sinon-chrome/extensions';
import TabsStorage from '../lib/TabsStorage';

global.chrome = chrome;

const generateTabs = (count, urlPrefix = '') => {
    const list = new Array(count);

    return list.fill(0).map((_, index) => {
        return {
            title: `tab ${index}`,
            url: `https://${urlPrefix} - sometabs${index}.com`
        }
    });
};


describe('Tabs storage', function() {

    it('init', () => {
        const storage = new TabsStorage();
    });

    it('return tabs list', async () => {
        chrome.tabs.query.withArgs({ currentWindow: true }).yields(generateTabs(12));
        chrome.history.search.yields(generateTabs(3, 'history'));

        const storage = new TabsStorage();
        const res = await storage.get();

        assert.equal(res.tabs.length, 12);
        assert.equal(res.history.length, 3);
        assert.equal(res.totalCount, 15);
    });

    it('return tabs and history without url dublicates', async () => {
        chrome.tabs.query.withArgs({ currentWindow: true }).yields(generateTabs(5));
        chrome.history.search.yields(generateTabs(3, 'history').concat(generateTabs(3)));

        const storage = new TabsStorage();
        const res = await storage.get();

        assert.equal(res.tabs.length, 5);
        assert.equal(res.history.length, 3);
        assert.equal(res.totalCount, 8);
    });

    it('adding tab to history', async () => {
        chrome.tabs.query.withArgs({ currentWindow: true }).yields(generateTabs(5));
        chrome.history.search.yields(generateTabs(3, 'history'));

        const storage = new TabsStorage();
        await storage.get();

        storage.addTab({id: 1});

        assert.equal(storage.history.length, 4);
    });

    it('refine tabs history', async () => {
        chrome.tabs.query.withArgs({ currentWindow: true }).yields(generateTabs(5));
        chrome.history.search.yields(generateTabs(3, 'history'));

        const storage = new TabsStorage();
        const res = await storage.get();

        chrome.history.search.yields(generateTabs(10, 'history'));

        const refinedHistory = await res.refinedHistory;

        assert.equal(refinedHistory.length, 10);
    });

    describe('filter tabs', () => {
        it('by title', () => {

        });

        it('by url', () => {

        });

        it('by convert layout', () => {

        });

        it('returns highlight properties in result', () => {

        })
    });

    afterEach(function() {
        chrome.tabs.query.flush();
        chrome.history.search.flush();
    });
});