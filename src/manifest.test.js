const manifest = require('./manifest.json');

describe('Manifest V3', () => {
    test('uses an extension service worker and action in Chromium', () => {
        expect(manifest.manifest_version).toBe(3);
        expect(manifest['__chrome|edge|opera__background']).toEqual({
            service_worker: 'scripts/background.js',
        });
        expect(manifest.action.default_popup).toBe('pages/popup.html');
        expect(manifest.browser_action).toBeUndefined();
    });

    test('uses an event page in Firefox', () => {
        expect(manifest.__firefox__background).toEqual({
            scripts: ['scripts/background.js'],
        });
    });

    test('uses the Manifest V3 action command', () => {
        expect(manifest.commands._execute_action).toBeDefined();
        expect(manifest.commands._execute_browser_action).toBeUndefined();
    });

    test('does not request an unsafe extension CSP', () => {
        expect(manifest.content_security_policy).toBeUndefined();
    });
});
