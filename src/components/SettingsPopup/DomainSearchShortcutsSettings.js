import React, { useState } from 'react';
import { validateDomainSearchShortcuts } from '../../lib/DomainSearchShortcuts';

const toDraft = (shortcuts) =>
    (Array.isArray(shortcuts) ? shortcuts : []).map((shortcut) => ({
        key: shortcut && typeof shortcut.key === 'string' ? shortcut.key : '',
        patterns:
            shortcut && Array.isArray(shortcut.patterns)
                ? shortcut.patterns.join('\n')
                : '',
    }));

const toValue = (draft) =>
    draft.map(({ key, patterns }) => ({
        key,
        patterns: patterns.split('\n'),
    }));

const getError = (errors, index, field) =>
    errors.find((error) => error.index === index && error.field === field);

const DomainSearchShortcutsSettings = ({ shortcuts, onSave }) => {
    const [draft, setDraft] = useState(() => toDraft(shortcuts));
    const [errors, setErrors] = useState([]);
    const [saveState, setSaveState] = useState('');

    const changeDraft = (change) => {
        setDraft(change);
        setErrors([]);
        setSaveState('');
    };

    const updateShortcut = (index, field, value) =>
        changeDraft((current) =>
            current.map((shortcut, shortcutIndex) =>
                shortcutIndex === index
                    ? { ...shortcut, [field]: value }
                    : shortcut,
            ),
        );

    const addShortcut = () =>
        changeDraft((current) => [...current, { key: '', patterns: '' }]);

    const deleteShortcut = (index) =>
        changeDraft((current) =>
            current.filter(
                (shortcut, shortcutIndex) => shortcutIndex !== index,
            ),
        );

    const saveShortcuts = async () => {
        const validation = validateDomainSearchShortcuts(toValue(draft));
        setErrors(validation.errors);

        if (!validation.valid) {
            setSaveState('');
            return;
        }

        try {
            await onSave(validation.value);
            setSaveState('Saved');
        } catch (error) {
            setSaveState('Could not save shortcuts');
        }
    };

    return (
        <div className="settings-popup__group domain-search-shortcuts">
            <h3>Domain search shortcuts</h3>
            <p className="domain-search-shortcuts__description">
                Add a key and one or more URL fragments. In the popup, type the
                key before your query to search only matching sites.
            </p>

            {draft.length === 0 && (
                <p className="domain-search-shortcuts__empty">
                    Example: key <code>gh</code> with pattern{' '}
                    <code>github.com</code>, then type <code>gh issue</code> in
                    the popup.
                </p>
            )}

            {draft.map((shortcut, index) => {
                const keyError = getError(errors, index, 'key');
                const patternsError = getError(errors, index, 'patterns');
                const exampleKey = shortcut.key.trim() || 'gh';

                return (
                    <div className="domain-search-shortcuts__card" key={index}>
                        <label>
                            Key
                            <input
                                type="text"
                                value={shortcut.key}
                                onChange={(event) =>
                                    updateShortcut(index, 'key', event.target.value)
                                }
                                placeholder="gh"
                            />
                        </label>
                        {keyError && (
                            <div className="domain-search-shortcuts__error">
                                {keyError.message}
                            </div>
                        )}

                        <label>
                            URL patterns — one per line
                            <textarea
                                value={shortcut.patterns}
                                onChange={(event) =>
                                    updateShortcut(
                                        index,
                                        'patterns',
                                        event.target.value,
                                    )
                                }
                                placeholder={'github.com\ngitlab.com'}
                            />
                        </label>
                        {patternsError && (
                            <div className="domain-search-shortcuts__error">
                                {patternsError.message}
                            </div>
                        )}

                        <p className="domain-search-shortcuts__hint">
                            Type <code>{exampleKey} issue</code> to search only
                            these sites.
                        </p>
                        <button
                            type="button"
                            className="domain-search-shortcuts__delete"
                            onClick={() => deleteShortcut(index)}
                        >
                            Delete shortcut
                        </button>
                    </div>
                );
            })}

            <div className="domain-search-shortcuts__actions">
                <button type="button" onClick={addShortcut}>
                    Add shortcut
                </button>
                <button type="button" onClick={saveShortcuts}>
                    Save shortcuts
                </button>
                {saveState && (
                    <span className="domain-search-shortcuts__save-state">
                        {saveState}
                    </span>
                )}
            </div>
        </div>
    );
};

export default DomainSearchShortcutsSettings;
