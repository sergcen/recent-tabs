import React, { useEffect, useRef } from 'react';
import Spinner from '../Spinner';

import './TabsList.scss';

const hightlightText = (text, bounds) => {
    if (!bounds) return text;

    return [
        text.slice(0, bounds[0]),
        <b>{text.slice(bounds[0], bounds[1])}</b>,
        text.slice(bounds[1]),
    ];
};

const TabItem = ({ tab, selectedTab, onSelect }) => {
    const isActive = tab.id === (selectedTab && selectedTab.id);
    const activeClassName = isActive ? 'tabs-list__item_selected' : '';
    const currentClassName = tab.active ? 'tabs-list__item_current' : '';
    const faviconUrl = tab.favIconUrl;

    const title = hightlightText(tab.title, tab.__titleHightlights);
    const url =
        tab.url !== 'undefined'
            ? hightlightText(tab.url, tab.__urlHightlights)
            : undefined;

    const itemRef = useRef(null);

    useEffect(() => {
        if (!isActive) return;

        itemRef.current.scrollIntoViewIfNeeded();
    }, [isActive]);

    return (
        <li
            key={tab.id.toString()}
            onClick={() => onSelect(tab)}
            ref={itemRef}
            className={`tabs-list__item ${activeClassName} ${currentClassName}`}
        >
            {tab.windowId && (
                <div className="tabs-list__favicon">
                    {faviconUrl && <img src={faviconUrl} />}
                </div>
            )}
            {!tab.url && tab.title && (
                <div className="tabs-list__favicon">&#128193;</div>
            )}
            <div>
                <p className="tabs-list__item-title">
                    {title || url || 'PROTECTED'}
                </p>
                {url && <div className="tabs-list__item-host">{url}</div>}
            </div>
        </li>
    );
};

export function TabsList(props) {
    const { tabs, selectedTab, onSelect, header, isLoading } = props;

    const hasTabs = tabs && tabs.length > 0;

    return (
        <div className="tabs-list">
            {(isLoading || hasTabs) && (
                <h6 className="tabs-list__header">{header}</h6>
            )}
            {hasTabs && (
                <ul className="tabs-list__items">
                    {tabs.map((tab) => (
                        <TabItem
                            key={header + (String(tab.id) || tab.url)}
                            tab={tab}
                            selectedTab={selectedTab}
                            onSelect={onSelect}
                        />
                    ))}
                </ul>
            )}
            {isLoading && <Spinner />}
        </div>
    );
}

export default TabsList;
