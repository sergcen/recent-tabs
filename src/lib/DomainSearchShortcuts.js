import filterTabs from './FilterTabs';

const SHORTCUT_KEY_WITH_SPACES = /\s/;
const URL_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;

const normalizeUrlPart = (value) => {
    try {
        value = decodeURI(value);
    } catch (error) {
        // Keep malformed percent-escapes as typed.
    }

    return value.replace(/\/+$/, '').toLowerCase();
};

const normalizeShortcutKey = (key) =>
    typeof key === 'string' ? key.trim().toLowerCase() : '';

export const normalizeUrlPattern = (pattern) => {
    if (typeof pattern !== 'string') return '';

    const value = pattern.trim();
    if (!value) return '';

    try {
        const parsed = new URL(
            URL_SCHEME.test(value)
                ? value
                : `https://${value.replace(/^\/+/, '')}`,
        );

        return normalizeUrlPart(`${parsed.hostname}${parsed.pathname}`);
    } catch (error) {
        return normalizeUrlPart(
            value.replace(URL_SCHEME, '').split(/[?#]/, 1)[0],
        );
    }
};

const getSearchableUrl = (url) => {
    if (typeof url !== 'string' || !url) return '';

    try {
        const parsed = new URL(url);

        return normalizeUrlPart(`${parsed.hostname}${parsed.pathname}`);
    } catch (error) {
        return '';
    }
};

const normalizePatterns = (patterns) => {
    return Array.isArray(patterns)
        ? [...new Set(patterns.map(normalizeUrlPattern).filter(Boolean))]
        : [];
};

const normalizeShortcut = (shortcut) => ({
    key: normalizeShortcutKey(shortcut && shortcut.key),
    patterns: normalizePatterns(shortcut && shortcut.patterns),
});

export const normalizeDomainSearchShortcuts = (shortcuts) => {
    if (!Array.isArray(shortcuts)) return [];

    const seenKeys = new Set();
    const normalized = [];

    shortcuts.forEach((shortcut) => {
        const { key, patterns } = normalizeShortcut(shortcut);

        if (
            !key ||
            SHORTCUT_KEY_WITH_SPACES.test(key) ||
            patterns.length === 0 ||
            seenKeys.has(key)
        ) {
            return;
        }

        seenKeys.add(key);
        normalized.push({ key, patterns });
    });

    return normalized;
};

export const validateDomainSearchShortcuts = (shortcuts) => {
    if (!Array.isArray(shortcuts)) {
        return {
            valid: false,
            value: [],
            errors: [
                { index: null, field: null, message: 'Invalid shortcuts list' },
            ],
        };
    }

    const errors = [];
    const keys = new Set();
    const addError = (index, field, message) =>
        errors.push({ index, field, message });

    shortcuts.forEach((shortcut, index) => {
        const { key, patterns } = normalizeShortcut(shortcut);

        if (!key) {
            addError(index, 'key', 'Key is required');
        } else if (SHORTCUT_KEY_WITH_SPACES.test(key)) {
            addError(index, 'key', 'Key must be a single token without spaces');
        } else if (keys.has(key)) {
            addError(index, 'key', `Key “${key}” is already used`);
        } else {
            keys.add(key);
        }

        if (patterns.length === 0) {
            addError(index, 'patterns', 'Add at least one URL pattern');
        }
    });

    return {
        valid: !errors.length,
        value: normalizeDomainSearchShortcuts(shortcuts),
        errors,
    };
};

export const parseDomainSearchQuery = (rawQuery, shortcuts) => {
    const query = typeof rawQuery === 'string' ? rawQuery : '';
    const queryWithoutLeadingSpaces = query.trimStart();
    const firstTokenMatch = queryWithoutLeadingSpaces.match(/^(\S+)([\s\S]*)$/);

    if (!firstTokenMatch) {
        return { text: query, shortcut: null };
    }

    const key = normalizeShortcutKey(firstTokenMatch[1]);
    const shortcut = normalizeDomainSearchShortcuts(shortcuts).find(
        (item) => item.key === key,
    );

    return shortcut
        ? { text: firstTokenMatch[2].trimStart(), shortcut }
        : { text: query, shortcut: null };
};

export const filterByUrlPatterns = (items, patterns) => {
    if (!Array.isArray(items)) return [];

    const normalizedPatterns = normalizePatterns(patterns);

    return items.filter((item) => {
        const url = getSearchableUrl(item && item.url);

        return normalizedPatterns.some((pattern) => url.includes(pattern));
    });
};

export const normalizeSearchDescriptor = (search) =>
    typeof search === 'string'
        ? { text: search, shortcut: null }
        : {
              text:
                  search && typeof search.text === 'string' ? search.text : '',
              shortcut: search && search.shortcut ? search.shortcut : null,
          };

export const filterItemsBySearch = (items, search, limit) => {
    const descriptor = normalizeSearchDescriptor(search);
    const scopedItems = descriptor.shortcut
        ? filterByUrlPatterns(items, descriptor.shortcut.patterns)
        : items;

    return filterTabs(scopedItems || [], descriptor.text, limit);
};
