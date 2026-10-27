// HR / EN switch. Every translated text is here; the page marks them with
// data-i18n (text), data-i18n-aria-label and data-i18n-content (attributes).
// Project names stay the same in both languages, so they are not in here.
(() => {
    const TEXT = {
        hr: {
            meta: 'Streamline: skup digitalnih alata za lokalne biznise i medije.',
            language: 'Jezik',
            zoom: 'Zumiranje',
            zoomOut: 'Umanji',
            zoomIn: 'Uvećaj',
            theme: 'Promijeni temu',
            projects: 'Projekti',
            menuDesc: 'Digitalni i fizički paketi brendiranja za ugostiteljstvo.',
            pressDesc: 'Opis stiže uskoro.',
            chessDesc: 'Šah s maglom rata. U ranoj fazi.',
            contact: 'Kontakt',
        },
        en: {
            meta: 'Streamline: a suite of digital tools for local businesses and media.',
            language: 'Language',
            zoom: 'Zoom',
            zoomOut: 'Zoom out',
            zoomIn: 'Zoom in',
            theme: 'Toggle theme',
            projects: 'Projects',
            menuDesc: 'Digital and physical branding packages for hospitality.',
            pressDesc: 'Description coming soon.',
            chessDesc: 'Fog of war chess. Early stage.',
            contact: 'Contact',
        },
    };

    const radios = document.querySelectorAll('input[name="lang"]');

    function set(lang) {
        const t = TEXT[lang] || TEXT.hr;
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t[el.dataset.i18n]; });
        document.querySelectorAll('[data-i18n-aria-label]').forEach(el => el.setAttribute('aria-label', t[el.dataset.i18nAriaLabel]));
        document.querySelectorAll('[data-i18n-content]').forEach(el => el.setAttribute('content', t[el.dataset.i18nContent]));
        radios.forEach(r => { r.checked = r.value === lang; });
    }

    radios.forEach(r => r.addEventListener('change', () => {
        set(r.value);
        try { localStorage.lang = r.value; } catch { }
    }));

    let saved = null;
    try { saved = localStorage.lang; } catch { }
    set(TEXT[saved] ? saved : 'hr');
})();
