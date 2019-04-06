import React from 'react';
import SettingsPopup from './TabsPopup';
import renderer from 'react-test-renderer';

test('Main test', () => {
    const component = renderer.create(
        <SettingsPopup page="http://www.facebook.com">Facebook</SettingsPopup>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();

    // manually trigger the callback
    tree.props.onMouseEnter();
    // re-rendering
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();

    // manually trigger the callback
    tree.props.onMouseLeave();
    // re-rendering
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
