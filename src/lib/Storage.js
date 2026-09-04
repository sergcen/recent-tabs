import browser from 'webextension-polyfill';

const storageLocal = browser.storage.local;

const SETTINGS_KEYS = [
    'autoclose',
    'autocloseMaxOpened',
    'autocloseExclude',
    'nodublicate',
    'nodublicateCloseOlder',
    'nodublicateExclude',
    'sorting',
    'sortingReverse',
    'sortingTimeout',
    'showShortcuts',
    'domainSearchShortcuts',
];

class Storage {
    constructor() {
        this.storage = {};
        this.ready = this.init();
    }

    async init() {
        const data = await storageLocal.get(SETTINGS_KEYS);

        this.storage = data || {};
    }

    refresh() {
        this.ready = this.init();

        return this.ready;
    }

    get(key) {
        return key ? this.storage[key] : this.storage;
    }

    set(key, value) {
        this.storage[key] = value;

        return storageLocal.set({ [key]: value });
    }

    get autoclose() {
        return this.storage.autoclose;
    }

    get autocloseMaxOpened() {
        return this.storage.autocloseMaxOpened || 10;
    }

    get nodublicate() {
        return this.storage.nodublicate;
    }

    get nodublicateCloseOlder() {
        return this.storage.nodublicateCloseOlder;
    }

    get sorting() {
        return this.storage.sorting;
    }

    get sortingReverse() {
        return this.storage.sortingReverse;
    }

    get sortingTimeout() {
        return this.storage.sortingTimeout || 500;
    }

    get showShortcuts() {
        return this.storage.showShortcuts === false ? false : true;
    }

    get domainSearchShortcuts() {
        return Array.isArray(this.storage.domainSearchShortcuts)
            ? this.storage.domainSearchShortcuts
            : [];
    }
}

export default Storage;
