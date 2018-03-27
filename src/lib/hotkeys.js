const checkKey = (e, key) => {
    if (key === 'shift' && e.shiftKey) return true;
    if (key === 'cmd' && e.metaKey) return true;

    return e.key === key;
};

const hotkeys = (event, actions) => {
    const hotkeys = Object.keys(actions);

    const hasAction = hotkeys.some(hotkey => {
        const isMatch = hotkey.split('+').every((key) => checkKey(event, key));

        if (isMatch) {
            actions[hotkey]();

            return true;
        }
    });

    hasAction && event.preventDefault();
};

export default hotkeys;
