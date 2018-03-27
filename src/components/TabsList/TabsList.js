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
        const faviconUrl = tab.favIconUrl;

        if (isActive && index !== 0) {
            const domElem = this.domMap.get(tab);
            domElem && onChangeActiveItem(domElem, tab);
        }

        return (
            <div
                onClick={() => onSelect(tab)}
                ref={item => item && this.domMap.set(tab, item)}
                className={`tabs-list__item ${activeClassName}`}
            >
                {tab.windowId && (
                    <div className="tabs-list__favicon">
                        {faviconUrl && <img src={faviconUrl} />}
                    </div>
                )}
                <div>
                    {tab.title || tab.url}
                    {!faviconUrl && (
                        <div className="tabs-list__item-host">{tab.url}</div>
                    )}
                </div>
            </div>
        );
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
            <div>
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
