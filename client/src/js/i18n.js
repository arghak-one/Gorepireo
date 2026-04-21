/**
 * GoRepireo i18n System
 * Handles multi-language support (English and Hindi)
 */

(function () {
    const LANG_STORAGE_KEY = 'GoRepireo_lang';
    const DEFAULT_LANG = 'en';

    // 1. Detection
    function getStoredLanguage() {
        return localStorage.getItem(LANG_STORAGE_KEY);
    }

    function getBrowserLanguage() {
        const lang = navigator.language || navigator.userLanguage;
        if (lang.startsWith('hi')) return 'hi';
        return DEFAULT_LANG;
    }

    function initLanguage() {
        let lang = getStoredLanguage();
        if (!lang) {
            lang = getBrowserLanguage();
            localStorage.setItem(LANG_STORAGE_KEY, lang);
        }
        setLanguage(lang, false);
    }

    // 2. DOM Updates
    function translateElement(el, lang) {
        const key = el.getAttribute('data-i18n');
        if (!window.translations || !window.translations[lang]) return;

        const translation = window.translations[lang][key];
        if (!translation) return;

        // Handle different types of elements
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.hasAttribute('placeholder')) {
                el.setAttribute('placeholder', translation);
            } else {
                el.value = translation;
            }
        } else {
            // Use innerHTML to support <br> tags in translations
            el.innerHTML = translation;
        }
    }

    function updateDOM(lang) {
        document.documentElement.lang = lang;
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => translateElement(el, lang));

        // Update language switcher active state for all switchers
        const switchers = document.querySelectorAll('.lang-switcher-text, #langSwitcherTrigger, #currentLangDisplay');
        switchers.forEach(switcher => {
            if (switcher) switcher.innerText = lang.toUpperCase();
        });

        // Update Premium Icon Toggles (EN/HI buttons)
        const btnEN = document.getElementById('langBtnEN');
        const btnHI = document.getElementById('langBtnHI');
        const langLabel = document.getElementById('currentLangLabel');

        if (btnEN && btnHI) {
            btnEN.classList.toggle('active', lang === 'en');
            btnHI.classList.toggle('active', lang === 'hi');
            
            if (langLabel) {
                langLabel.innerText = lang === 'en' ? 'English' : 'हिंदी (Hindi)';
            }
        }
    }

    // 3. Public API
    window.setLanguage = function (lang, save = true) {
        if (!window.translations[lang]) {
            console.warn(`Language ${lang} not supported, falling back to English`);
            lang = 'en';
        }

        if (save) {
            localStorage.setItem(LANG_STORAGE_KEY, lang);
        }

        updateDOM(lang);

        // Optional: Notify the user using the global toast system if it's a manual change
        if (save && window.alert) {
            const msg = lang === 'hi' ? 'भाषा हिंदी में बदल गई' : 'Language changed to English';
            window.alert(msg);
        }
    };

    window.toggleLanguage = function () {
        const current = getStoredLanguage() || DEFAULT_LANG;
        const next = current === 'en' ? 'hi' : 'en';
        window.setLanguage(next);
    }

    // Export i18n utility for JS scripts
    window.i18n = {
        get: function (key) {
            const lang = getStoredLanguage() || DEFAULT_LANG;
            if (window.translations && window.translations[lang] && window.translations[lang][key]) {
                return window.translations[lang][key];
            }
            return key; // Fallback to the key itself if not found
        },
        updateDOM: updateDOM
    };

    // 4. Initialization
    window.addEventListener('DOMContentLoaded', () => {
        initLanguage();

        // Re-translate if content is dynamically loaded (optional)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.hasAttribute('data-i18n')) {
                            translateElement(node, getStoredLanguage() || DEFAULT_LANG);
                        }
                        node.querySelectorAll('[data-i18n]').forEach(el =>
                            translateElement(el, getStoredLanguage() || DEFAULT_LANG)
                        );
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    });

})();
