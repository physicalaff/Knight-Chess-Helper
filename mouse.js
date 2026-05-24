window.chessHelperMouse = {
    speed: 1.0,
    wobble: 3.5,
    bulletMode: false
};

const sleep  = ms => new Promise(r => setTimeout(r, ms));
const clamp  = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd    = (a, b) => a + Math.random() * (b - a);
const rndInt = (a, b) => Math.floor(rnd(a, b));

function bezier(t, p0, p1, p2, p3) {
    const m = 1 - t;
    return m*m*m*p0 + 3*m*m*t*p1 + 3*m*t*t*p2 + t*t*t*p3;
}

async function moveTo(x0, y0, x1, y1, held = 0) {
    const dist  = Math.hypot(x1-x0, y1-y0);
    
    let speedFactor = window.chessHelperMouse.speed;
    if (window.chessHelperMouse.bulletMode) {
        speedFactor = 2.8;
    }

    const baseSteps = clamp(Math.floor(dist / (7 * speedFactor)), 3, 38);
    const steps = Math.max(2, baseSteps);
    const drift = dist * rnd(0.06, 0.18);
    const ang   = Math.atan2(y1-y0, x1-x0) + rnd(-0.45, 0.45);
    const cx1   = x0 + (x1-x0)*rnd(0.2, 0.4) + Math.cos(ang)*drift;
    const cy1   = y0 + (y1-y0)*rnd(0.2, 0.4) + Math.sin(ang)*drift;
    const cx2   = x0 + (x1-x0)*rnd(0.6, 0.8) - Math.cos(ang)*drift*0.5;
    const cy2   = y0 + (y1-y0)*rnd(0.6, 0.8) - Math.sin(ang)*drift*0.5;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const e = t < 0.5 ? 2*t*t : -1 + (4-2*t)*t;
        
        const tremorX = Math.sin(t * 80) * 0.45;
        const tremorY = Math.cos(t * 90) * 0.45;

        const x = bezier(e, x0, cx1, cx2, x1) + (Math.random()-0.5)*window.chessHelperMouse.wobble + tremorX;
        const y = bezier(e, y0, cy1, cy2, y1) + (Math.random()-0.5)*window.chessHelperMouse.wobble + tremorY;
        const el = document.elementFromPoint(x, y) || document.body;
        el.dispatchEvent(new PointerEvent('pointermove', {
            bubbles: true, cancelable: true, view: window,
            clientX: x, clientY: y, buttons: held, pointerId: 1, isPrimary: true,
            pressure: held ? 0.5 : 0,
        }));
        await sleep(clamp(Math.floor(rnd(5, 12) / (1 - Math.abs(t-0.5)*0.5)), 4, 18));
    }
}

function tap(type, el, x, y) {
    if (!el) return;
    const clientX = x + (Math.random()-0.5)*1.5;
    const clientY = y + (Math.random()-0.5)*1.5;
    
    // Dispatch PointerEvent
    el.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, view: window,
        clientX, clientY,
        buttons: type.includes('down') ? 1 : 0,
        pointerId: 1, isPrimary: true,
        width: rnd(1,3), height: rnd(1,3), pressure: type.includes('down') ? rnd(0.4, 0.7) : 0,
    }));
    
    // Dispatch corresponding MouseEvent
    const mouseType = type === 'pointerdown' ? 'mousedown' : (type === 'pointerup' ? 'mouseup' : null);
    if (mouseType) {
        el.dispatchEvent(new MouseEvent(mouseType, {
            bubbles: true, cancelable: true, view: window,
            clientX, clientY,
            buttons: mouseType === 'mousedown' ? 1 : 0,
        }));
    }
    
    // If it's a pointerup/mouseup, also dispatch a click event to guarantee action registration
    if (type === 'pointerup') {
        el.dispatchEvent(new MouseEvent('click', {
            bubbles: true, cancelable: true, view: window,
            clientX, clientY,
            buttons: 0
        }));
    }
}