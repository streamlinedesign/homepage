// The endless sheet: drag with the mouse or a finger, scroll in any direction,
// or hold the arrow keys. Zoom with the − / + buttons, the - and + keys,
// ctrl + wheel, a trackpad pinch or two fingers. The grid has no edges;
// Home, 0 or "Projekti" brings you back to the start at full size.
// On phones (`phone` below, same width as suite.css) the sheet roams too, until
// the lock button is pressed: then the view eases back and stays put as one screen.
(() => {
    const canvas = document.querySelector('[data-canvas]');
    const board = document.querySelector('[data-board]');
    if (!canvas || !board) return;

    const phone = matchMedia('(max-width: 720px)');
    const lockButton = document.querySelector('[data-lock]');
    let locked = false;  // phones start unlocked
    const frozen = () => phone.matches && locked;

    const KEY_SPEED = 900;   // px per second while an arrow is held
    const FRICTION = 4;      // how fast a flick slows down (higher = shorter glide)
    const ZOOM_MIN = .25;
    const ZOOM_MAX = 1.5;
    const ZOOM_STEP = 1.25;  // one button press or key press
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    const pos = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    let zoom = 1;
    const keys = new Set();
    const pointers = new Map();
    let drag = null;
    let pinch = null;
    let moved = false;
    let ease = null;     // eased move to { x, y, zoom }
    let last = 0;
    let running = false;

    const clamp = z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

    function apply() {
        if (frozen()) {
            board.style.transform = canvas.style.backgroundPosition = '';
            canvas.style.removeProperty('--zoom');
            return;
        }
        board.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${zoom})`;
        canvas.style.setProperty('--zoom', zoom);
        canvas.style.backgroundPosition = `${pos.x - 1}px ${pos.y - 1}px`;
    }

    // zoom to z while the sheet point under (sx, sy) stays where it is
    function zoomAt(z, sx, sy) {
        z = clamp(z);
        pos.x = sx - (sx - pos.x) * z / zoom;
        pos.y = sy - (sy - pos.y) * z / zoom;
        zoom = z;
    }

    function tick(now) {
        const dt = Math.min(now - (last || now), 50) / 1000;
        last = now;

        if (ease) {
            const k = 1 - Math.exp(-dt * 10);
            if (ease.anchor) {
                zoomAt(zoom + (ease.zoom - zoom) * k, ease.anchor.x, ease.anchor.y);
                if (Math.abs(ease.zoom - zoom) < .002) { zoomAt(ease.zoom, ease.anchor.x, ease.anchor.y); ease = null; }
            } else {
                pos.x += (ease.x - pos.x) * k;
                pos.y += (ease.y - pos.y) * k;
                zoom += (ease.zoom - zoom) * k;
                if (Math.abs(ease.x - pos.x) + Math.abs(ease.y - pos.y) < .5 && Math.abs(ease.zoom - zoom) < .002) {
                    pos.x = ease.x; pos.y = ease.y; zoom = ease.zoom; ease = null;
                }
            }
        } else if (keys.size) {
            const dx = (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0);
            const dy = (keys.has('ArrowUp') ? 1 : 0) - (keys.has('ArrowDown') ? 1 : 0);
            vel.x = dx * KEY_SPEED;
            vel.y = dy * KEY_SPEED;
            pos.x += vel.x * dt;
            pos.y += vel.y * dt;
        } else if (!drag && !pinch) {
            const k = Math.exp(-dt * FRICTION);
            vel.x *= k;
            vel.y *= k;
            pos.x += vel.x * dt;
            pos.y += vel.y * dt;
        }
        apply();

        const still = !ease && !keys.size && !drag && !pinch && Math.hypot(vel.x, vel.y) < 5;
        if (still) { running = false; last = 0; return; }
        requestAnimationFrame(tick);
    }

    function run() {
        if (running) return;
        running = true;
        requestAnimationFrame(tick);
    }

    function zoomBy(factor) {
        const target = clamp((ease && ease.anchor ? ease.zoom : zoom) * factor);
        const anchor = { x: innerWidth / 2, y: innerHeight / 2 };
        vel.x = vel.y = 0;
        if (reduced.matches) { zoomAt(target, anchor.x, anchor.y); apply(); return; }
        ease = { zoom: target, anchor };
        run();
    }

    function recenter() {
        vel.x = vel.y = 0;
        if (reduced.matches) { pos.x = pos.y = 0; zoom = 1; apply(); return; }
        ease = { x: 0, y: 0, zoom: 1 };
        run();
    }

    // ---------- mouse and touch ----------

    function pinchState() {
        const [a, b] = [...pointers.values()];
        return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    canvas.addEventListener('pointerdown', e => {
        if (e.button !== 0 || frozen()) return;
        ease = null;
        vel.x = vel.y = 0;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2) {
            // second finger: switch from dragging to pinching
            drag = null;
            moved = true;
            pinch = pinchState();
            for (const id of pointers.keys()) canvas.setPointerCapture(id);
            run();
            return;
        }
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
        moved = false;
    });

    canvas.addEventListener('pointermove', e => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pinch && pointers.size === 2) {
            const now = pinchState();
            zoomAt(zoom * now.d / pinch.d, now.x, now.y);
            pos.x += now.x - pinch.x;
            pos.y += now.y - pinch.y;
            pinch = now;
            apply();
            return;
        }

        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (!moved && Math.hypot(dx, dy) < 5) return;
        if (!moved) {
            moved = true;
            canvas.setPointerCapture(e.pointerId);
            canvas.classList.add('is-dragging');
        }
        const now = performance.now();
        const dt = Math.max(now - drag.t, 1) / 1000;
        vel.x = dx / dt;
        vel.y = dy / dt;
        pos.x += dx;
        pos.y += dy;
        drag.x = e.clientX;
        drag.y = e.clientY;
        drag.t = now;
        apply();
    });

    function release(e) {
        pointers.delete(e.pointerId);
        if (pinch) {
            if (pointers.size < 2) pinch = null;
            return;
        }
        if (!drag || e.pointerId !== drag.id) return;
        // a pause before letting go means no glide
        if (performance.now() - drag.t > 80 || reduced.matches) vel.x = vel.y = 0;
        drag = null;
        canvas.classList.remove('is-dragging');
        run();
    }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);

    // links and text would otherwise start the browser's own drag
    canvas.addEventListener('dragstart', e => e.preventDefault());

    // a drag that ends on a card is not a click on it
    canvas.addEventListener('click', e => {
        if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    // ---------- wheel and trackpad ----------

    canvas.addEventListener('wheel', e => {
        if (frozen()) return;
        e.preventDefault();
        ease = null;
        vel.x = vel.y = 0;
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
        if (e.ctrlKey || e.metaKey) {
            // ctrl + wheel, and a trackpad pinch, which browsers report the same way
            const d = Math.max(-25, Math.min(25, e.deltaY * unit));  // one mouse notch = one gentle step
            zoomAt(zoom * Math.exp(-d * .01), e.clientX, e.clientY);
        } else {
            const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
            const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
            pos.x -= dx * unit;
            pos.y -= dy * unit;
        }
        apply();
    }, { passive: false });

    // ---------- keyboard ----------

    const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

    addEventListener('keydown', e => {
        if (e.target.closest('input, textarea, select, [contenteditable]')) return;
        if (e.ctrlKey || e.metaKey || e.altKey || frozen()) return;  // leave browser shortcuts alone
        if (ARROWS.includes(e.key)) {
            e.preventDefault();
            ease = null;
            keys.add(e.key);
            run();
        } else if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            zoomBy(1 / ZOOM_STEP);
        } else if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            zoomBy(ZOOM_STEP);
        } else if (e.key === 'Home' || e.key === '0') {
            e.preventDefault();
            recenter();
        }
    });
    addEventListener('keyup', e => keys.delete(e.key));
    addEventListener('blur', () => keys.clear());

    // ---------- buttons ----------

    document.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => {
        zoomBy(b.dataset.zoom === 'in' ? ZOOM_STEP : 1 / ZOOM_STEP);
    }));

    document.querySelectorAll('[data-recenter]').forEach(a => a.addEventListener('click', e => {
        e.preventDefault();
        recenter();
    }));

    // ---------- phone lock ----------

    function setLocked(next) {
        locked = next;
        canvas.classList.toggle('is-locked', locked);
        if (lockButton) {
            lockButton.setAttribute('aria-pressed', String(locked));
            lockButton.classList.toggle('is-locked', locked);
        }
        if (locked) {
            // ease back to the start, then hold still
            vel.x = vel.y = 0;
            pos.x = pos.y = 0;
            zoom = 1;
            ease = null;
            canvas.scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
            canvas.classList.add('is-settling');
            setTimeout(() => canvas.classList.remove('is-settling'), 600);
        }
        apply();
    }

    if (lockButton) lockButton.addEventListener('click', () => setLocked(!locked));

    // rotating or resizing across the phone width starts from the beginning again
    phone.addEventListener('change', () => {
        pos.x = pos.y = vel.x = vel.y = 0;
        zoom = 1;
        ease = null;
        apply();
    });

    apply();
})();
