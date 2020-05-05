import React, { useState, useCallback } from 'react';

const getByIndex = (index, ...collections) => {
    let start = 0;
    for (let cIndex = 0; cIndex < collections.length; cIndex++) {
        const collection = collections[cIndex];

        if (index >= start && (start + collection.length - 1 >= index)) {
            return collections[cIndex][index - start];
        }
        start += collections[cIndex].length;
    }

    return null;
};

const getIndex = (item, ...collections) => {
    let start = 0;
    for (let cIndex = 0; cIndex < collections.length; cIndex++) {
        const index = collections[cIndex].findIndex(item);
        if (index >= 0) {
            return index + start;
        }

        start += collections[cIndex].length;
    }

    return null;
};

export function useSelectedTab(initIndex, collections) {
    const [index, setIndex] = useState(initIndex);

    const getTabByIndex = useCallback((index) => {
        return getByIndex(index, ...collections);
    }, collections);

    const incSelectedIndex = useCallback(
        (selected) => {
            const newIndex =
                typeof selected === 'string'
                    ? index + Number(selected)
                    : selected

            if (getTabByIndex(newIndex)) {
                setIndex(newIndex);
            }
        },
        [index, collections]
    );

    return [getByIndex(index, ...collections), index, incSelectedIndex];
}
