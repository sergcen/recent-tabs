import { assert } from 'chai';

import filterTabs from '../lib/filterTabs';

const generateTabs = (count, urlPrefix = '') => {
    const list = new Array(count);

    return list.fill(0).map((_, index) => {
        return {
            title: `tab ${index}`,
            url: `https://${urlPrefix} - sometabs${index}.com`
        }
    });
};

describe('Filter tabs', function() {

    it('by title', () => {
        assert.equal(filterTabs(generateTabs(11), 'tab 1').length, 2);
    });

    it('by url', () => {
        assert.equal(filterTabs(generateTabs(11), 'sometabs1').length, 2);
    });

    it('by convert layout', () => {

    });

    it('returns highlight properties in result', () => {

    })
});