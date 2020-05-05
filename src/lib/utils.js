export function clearDublicates(...collections) {
    const result = [];
    const exists = new Set();
    const prepareCollections = collections.map(c => c ? c : []);

    for (let item of prepareCollections) {
        const filtered = item.filter(t => {
            const key = t.url || t.id;
            const result = !exists.has(key);

            exists.add(key);

            return result;
        });

        result.push(filtered);
    }

    return result;
}
