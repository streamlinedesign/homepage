// Blueprint / whiteprint. The header switch is on for whiteprint ("light").
// Switches instantly, no transition animation.
(() => {
    const root = document.documentElement;
    const sw = document.getElementById('theme');
    sw.checked = root.dataset.theme === 'light';
    sw.addEventListener('change', () => {
        const next = sw.checked ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.theme = next; } catch { }
    });
})();
