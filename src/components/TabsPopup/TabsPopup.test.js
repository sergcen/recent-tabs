import React from 'react';
import TabsPopup from './TabsPopup';
import renderer from 'react-test-renderer';

test('Main test', () => {
    const component = renderer.create(
        <TabsPopup page="http://www.facebook.com">Facebook</TabsPopup>,
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