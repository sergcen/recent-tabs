import promisify from './promisify'

const storage = chrome.storage.local;
const storageSet = promisify(storage.set);
const storageGet = promisify(storage.get);

class Storage {
    constructor() {
        this.storage = {};
        this.ready = this.init();
    }

    async init() {
        const data = await storageGet();

        this.storage = data || {};
    }

    get(key) {
        return key ? this.storage[key] : this.storage;
    }

    set(key, value) {
        this.storage[key] = value;
        storageSet(this.storage);
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
}

export default Storage;