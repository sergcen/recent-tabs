const checkKey = (e, key) => {
    if (key === 'shift' && e.shiftKey) return true;
    if (key === 'cmd' && e.metaKey) return true;
    if (key === 'CTRL' && e.ctrlKey) return true;
    if (key === 'ALT' && e.altKey) return true;

    return e.key === key;
};

const Hotkeys = (event, actions) => {
    const hotkeys = Object.keys(actions);

    const hasAction = hotkeys.some(hotkey => {
        const isMatch = hotkey.split('+').every(key => checkKey(event, key));

        if (isMatch) {
            actions[hotkey]();

            return true;
        }
    });

    if (hasAction) {
        event.preventDefault();
    }
};

export default Hotkeys;
