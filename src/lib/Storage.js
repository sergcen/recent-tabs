import browser from 'webextension-polyfill';

const storageSet = browser.storage.local.set;
const storageGet = browser.storage.local.get;

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
];

class Storage {
    constructor() {
        this.storage = {};
        this.ready = this.init();
    }

    async init() {
        const data = await storageGet(SETTINGS_KEYS);

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

        return storageSet({ [key]: value });
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
}

export default Storage;
