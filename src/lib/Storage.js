const storageSet = browser.storage.local.set;
const storageGet = browser.storage.local.get;

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