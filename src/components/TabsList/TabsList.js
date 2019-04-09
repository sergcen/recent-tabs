import React, { Component } from 'React';
import Spinner from '../Spinner';

import './TabsList.scss';

class TabsList extends Component {
    componentWillMount() {
        this.domMap = new WeakMap();
    }

    componentWillUnmount() {
        this.domMap = null;
    }

    item(tab, selectedTab, onSelect, onChangeActiveItem, index) {
        const isActive = tab.id === (selectedTab && selectedTab.id);
        const activeClassName = isActive ? 'tabs-list__item_selected' : '';
        const currentClassName = tab.active ? 'tabs-list__item_current' : '';
        const faviconUrl = tab.favIconUrl;

        if (isActive && index !== 0) {
            const domElem = this.domMap.get(tab);
            domElem && onChangeActiveItem(domElem, tab);
        }

        const title = this.hightlightText(tab.title, tab.__titleHightlights);
        const url = this.hightlightText(tab.url, tab.__urlHightlights);

        return (
            <div
                onClick={() => onSelect(tab)}
                ref={item => item && this.domMap.set(tab, item)}
                className={`tabs-list__item ${activeClassName} ${currentClassName}`}
            >
                {tab.windowId && (
                    <div className="tabs-list__favicon">
                        {faviconUrl && <img src={faviconUrl} />}
                    </div>
                )}
                <div>
                    {title || url}
                    <div className="tabs-list__item-host">{url}</div>
                </div>
            </div>
        );
    }

    hightlightText(text, bounds) {
        if (!bounds) return text;

        return [
            text.slice(0, bounds[0]),
            <b>{text.slice(bounds[0], bounds[1])}</b>,
            text.slice(bounds[1])
        ];
    }

    render() {
        const {
            tabs,
            selectedTab,
            onSelect,
            header,
            isLoading,
            onChangeActiveItem
        } = this.props;

        const hasTabs = tabs && tabs.length > 0;

        return (
            <div className="tabs-list">
                {header && <h6 className="tabs-list__header">{header}</h6>}
                {hasTabs && (
                    <div className="tabs-list__items">
                        {tabs.map((tab, index) =>
                            this.item(
                                tab,
                                selectedTab,
                                onSelect,
                                onChangeActiveItem,
                                index
                            )
                        )}
                    </div>
                )}
                {isLoading && <Spinner />}
            </div>
        );
    }
}

export default TabsList;
