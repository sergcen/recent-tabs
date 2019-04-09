const fixKeboardLayoutRu = require('convert-layout/ru');

export default function filterTabs(tabs, query, limit) {
    if (!query) {
        return limit && tabs.length > limit ? tabs.slice(0, limit) : tabs;
    }

    query = query.toLowerCase();

    const titleConverted = /[а-я]/i.test(query)
        ? fixKeboardLayoutRu.toEn(query)
        : fixKeboardLayoutRu.fromEn(query);

    const byTitle = [];
    const byUrl = [];

    let counter = 0;

    for (const tab of tabs) {
        if (counter === limit) break;

        if (findSubstr(tab.title, query, titleConverted)) {
            byTitle.push(tab);
            counter++;

            continue;
        }

        if (findSubstr(tab.url, query, titleConverted)) {
            byUrl.push(tab);
            counter++;
        }
    }

    return byTitle.concat(byUrl);
}

const findSubstr = (text, first, second) => {
    text = text.toLowerCase();

    return text.includes(first) || text.includes(second);
};
