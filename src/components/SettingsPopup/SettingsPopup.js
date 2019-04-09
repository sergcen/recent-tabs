import React, { Component } from 'React';
import { getBackgroundPage } from '../../lib/tabsApiWrapper';

import './SettingsPopup.scss';

class SettingsPopup extends Component {
    state = {};

    storage = null;

    componentDidMount() {
        getBackgroundPage().then(bg => {
            const storage = bg.settingsStorage;

            this.storage = storage;
            this.setState(storage.get());
        });
    }

    handleChange(event) {
        const target = event.target;
        const value =
            target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.storage.set(name, value);
        this.setState({ [name]: value });
    }

    option(label, propName, type, placeholder) {
        const { state } = this;
        const value = state[propName];
        const handleChange = e => this.handleChange(e);

        let control;

        switch (type) {
            case 'number':
                control = (
                    <input
                        name={propName}
                        type="number"
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                    />
                );
                break;
            case 'textarea':
                control = (
                    <textarea
                        placeholder={placeholder}
                        name={propName}
                        onChange={handleChange}
                    >
                        {value}
                    </textarea>
                );
                break;
            case 'checkbox':
                control = (
                    <input
                        name={propName}
                        type="checkbox"
                        checked={value}
                        onChange={handleChange}
                    />
                );
        }

        if (!control) return;

        return (
            <div className="settings-popup__contol">
                <label>
                    <span className="settings-popup__label-text">{label}</span>
                    {control}
                </label>
            </div>
        );
    }

    render() {
        const { sorting, autoclose, nodublicate } = this.state;

        return (
            <form className="settings-popup">
                <div className="settings-popup__group">
                    <h3>Autoclosing tabs</h3>
                    {this.option('Enabled', 'autoclose', 'checkbox')}
                    {autoclose && [
                        this.option(
                            'Max opened tabs',
                            'autocloseMaxOpened',
                            'number',
                            '10'
                        ),
                        this.option(
                            'Exclude urls patterns (separated by new line)',
                            'autocloseExclude',
                            'textarea',
                            'github/**'
                        )
                    ]}
                </div>
                <div className="settings-popup__group">
                    <h3>Sort tabs by recent used</h3>
                    {this.option('Enabled', 'sorting', 'checkbox')}
                    {sorting && [
                        this.option(
                            'Reverse sorting',
                            'sortingReverse',
                            'checkbox'
                        ),
                        this.option(
                            'Sort apply timeout (ms)',
                            'sortingTimeout',
                            'number',
                            '500'
                        )
                    ]}
                </div>
                <div className="settings-popup__group">
                    <h3>No dublicate tabs</h3>
                    {this.option(
                        'Enabled (existing tab activate)',
                        'nodublicate',
                        'checkbox'
                    )}
                    {nodublicate && [
                        this.option(
                            'Close older tab',
                            'nodublicateCloseOlder',
                            'checkbox'
                        ),
                        this.option(
                            'Exclude urls patterns (separated by new line)',
                            'nodublicateExclude',
                            'textarea',
                            'github/**'
                        )
                    ]}
                </div>
            </form>
        );
    }
}

export default SettingsPopup;
