// The few things on the sheet that need script: the toast buttons.
// Dimension lines (data-measure) and code blocks (data-code) are set up by blueprint-paper.js itself.
(() => {
    if (!window.bp) return;
    document.querySelectorAll('[data-toast]').forEach(b => b.addEventListener('click', () => bp.toast('Rev B2 issued', 'Sheets 3 and 7 affected.')));
    document.querySelectorAll('[data-toast-solid]').forEach(b => b.addEventListener('click', () => bp.toast('Pump B stopped', 'Stopped by operator at 22:08.', { solid: true })));
})();
