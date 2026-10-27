/**
 * I18n - Simple internationalization module for Fuel Panic.
 *
 * Loads translation JSON files and provides a global `t()` helper
 * that resolves dot-separated keys with optional interpolation.
 *
 * Usage:
 *   await I18n.init('it');        // load Italian (default)
 *   t('menu.play_button');        // "▶ GIOCA!"
 *   t('game.difficulty_label', { level: 3 }); // "Livello: 3"
 *   t('menu.instructions_touch'); // returns the full array
 */
const I18n = (() => {
    let _locale = 'it';
    let _translations = {};
    const _supportedLocales = ['it', 'en'];

    /**
     * Detect the best matching locale from the browser language.
     * Falls back to 'it' if no match is found.
     */
    function detectLocale() {
        const lang = (navigator.language || navigator.userLanguage || 'it').toLowerCase();
        // Check exact match first (e.g. "en-US" -> "en")
        const short = lang.split('-')[0];
        if (_supportedLocales.includes(short)) return short;
        return 'it'; // default
    }

    /**
     * Load a locale JSON file and set it as the active translation.
     * @param {string} [locale] - Locale code ('it', 'en'). Auto-detected if omitted.
     * @returns {Promise<void>}
     */
    async function init(locale) {
        _locale = locale || detectLocale();
        if (typeof document !== 'undefined' && document.documentElement) {
            document.documentElement.lang = _locale;
        }
        const url = `src/i18n/${_locale}.json`;
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            _translations = await resp.json();
        } catch (err) {
            console.warn(`[I18n] Could not load "${url}", falling back to "it".`, err);
            if (_locale !== 'it') {
                _locale = 'it';
                const fallback = await fetch('src/i18n/it.json');
                _translations = await fallback.json();
            }
        }
        updateHTMLTexts();
    }

    /**
     * Resolve a dot-separated key against the loaded translations.
     * Supports `{{placeholder}}` interpolation.
     *
     * @param {string} key   - e.g. "menu.play_button"
     * @param {Object} [params] - e.g. { level: 3 }
     * @returns {string|Array|undefined}
     */
    function translate(key, params) {
        const parts = key.split('.');
        let value = _translations;
        for (const part of parts) {
            if (value == null) return key; // key not found, return key itself
            value = value[part];
        }
        if (value == null) return key;

        // If the value is an array, return it as-is (e.g. instructions list)
        if (Array.isArray(value)) return value;

        // Interpolate {{placeholders}}
        if (typeof value === 'string' && params) {
            return value.replace(/\{\{(\w+)\}\}/g, (_, name) =>
                params[name] !== undefined ? params[name] : `{{${name}}}`
            );
        }
        return value;
    }

    /** Returns the current locale code. */
    function getLocale() {
        return _locale;
    }

    /** Returns the list of supported locale codes. */
    function getSupportedLocales() {
        return [..._supportedLocales];
    }

    /**
     * Switch locale at runtime. Reloads the JSON and updates
     * the HTML overlay text.
     * @param {string} locale
     * @returns {Promise<void>}
     */
    async function setLocale(locale) {
        await init(locale);
        updateHTMLTexts();
    }

    /**
     * Helper to retrieve a translated string or null if key does not exist.
     */
    function resolveKey(key) {
        const val = translate(key);
        return (val && val !== key) ? val : null;
    }

    /**
     * Update the HTML rotate-overlay texts from the loaded translations.
     * Called once after init and whenever the locale changes.
     */
    function updateHTMLTexts() {
        if (typeof document === 'undefined') return;

        // Update elements with data-i18n (plain text)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = resolveKey(key);
            if (val && typeof val === 'string') {
                el.textContent = val;
            }
        });

        // Update elements with data-i18n-html (HTML markup)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            const val = resolveKey(key);
            if (val && typeof val === 'string') {
                el.innerHTML = val;
            }
        });

        // Specific rotate-overlay elements fallback
        const rotateTitle = document.querySelector('#rotate-overlay h2');
        const rotateMsg = document.querySelector('#rotate-overlay p');
        if (rotateTitle && !rotateTitle.hasAttribute('data-i18n') && !rotateTitle.hasAttribute('data-i18n-html')) {
            const titleVal = resolveKey('rotate_overlay.title') || resolveKey('html.rotate_title');
            if (titleVal) rotateTitle.innerHTML = titleVal;
        }
        if (rotateMsg && !rotateMsg.hasAttribute('data-i18n') && !rotateMsg.hasAttribute('data-i18n-html')) {
            const msgVal = resolveKey('rotate_overlay.message') || resolveKey('html.rotate_message');
            if (msgVal) rotateMsg.innerHTML = msgVal;
        }
    }

    return {
        init,
        translate,
        getLocale,
        getSupportedLocales,
        setLocale,
        updateHTMLTexts
    };
})();

/** Global shortcut */
function t(key, params) {
    return I18n.translate(key, params);
}
