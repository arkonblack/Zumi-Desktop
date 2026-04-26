import { useEffect, useRef, useState } from 'react';
import { getCurrentWindow, getAllWindows } from '@tauri-apps/api/window';
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';
import './Bubble.css';

const W = 110;
const H = 110;
const EW = 326;

export default function Bubble() {
  const today = new Date().toDateString();
  const lastShown = localStorage.getItem('bubble_msg_date');
  const shouldShowMsg = lastShown !== today;

  const [showMsg, setShowMsg] = useState(shouldShowMsg);
  const dragged = useRef(false);

  useEffect(() => {
    if (localStorage.getItem('bubble_enabled') === 'false') return;

    const win = getCurrentWindow();
    let alive = true;

    async function init() {
      try {
        const sw = window.screen.availWidth;
        const sh = window.screen.availHeight;
        const finalX = sw - W; // window fully on screen, button 25px from screen edge
        const y = Math.round(sh / 2 - H / 2);

        if (shouldShowMsg) {
          const startX = sw - EW; // expanded window also fully on screen
          await win.setPosition(new LogicalPosition(startX, y));
          await win.setSize(new LogicalSize(EW, H));
          await win.show();

          localStorage.setItem('bubble_msg_date', today);

          await delay(3500);
          if (!alive) return;
          setShowMsg(false);

          await delay(400); // wait for exit animation
          if (!alive) return;

          await win.setSize(new LogicalSize(W, H));
          await win.setPosition(new LogicalPosition(finalX, y));
        } else {
          await win.setPosition(new LogicalPosition(finalX, y));
          await win.setSize(new LogicalSize(W, H));
          await win.show();
        }
      } catch { /* noop */ }
    }

    init();
    return () => { alive = false; };
  }, []);

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    dragged.current = false;

    const startMouseX = e.screenX;
    const startMouseY = e.screenY;
    const win = getCurrentWindow();

    let winStartX = 0;
    let winStartY = 0;
    let ready = false;
    let targetX = 0;
    let targetY = 0;
    let raf = 0;

    // Leer posición inicial antes de que empiece el drag
    Promise.all([win.outerPosition(), win.scaleFactor()])
      .then(([pos, scale]) => {
        winStartX = pos.x / scale;
        winStartY = pos.y / scale;
        targetX = winStartX;
        targetY = winStartY;
        ready = true;
      }).catch(() => { });

    const onMove = (me: MouseEvent) => {
      const dx = me.screenX - startMouseX;
      const dy = me.screenY - startMouseY;

      if (!dragged.current) {
        if (Math.abs(dx) <= 4 && Math.abs(dy) <= 4) return;
        dragged.current = true;
      }
      if (!ready) return;

      const sw = window.screen.availWidth;
      const sh = window.screen.availHeight;
      const maxTargetX = sw - W + 40;
      const maxTargetY = sh - H + 40;

      // Clamp: ventana siempre completamente dentro de la pantalla
      targetX = Math.max(0, Math.min(Math.round(winStartX + dx), maxTargetX));
      targetY = Math.max(0, Math.min(Math.round(winStartY + dy), maxTargetY));

      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          win.setPosition(new LogicalPosition(targetX, targetY)).catch(() => { });
        });
      }
    };

    const onUp = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (ready && dragged.current) {
        win.setPosition(new LogicalPosition(targetX, targetY)).catch(() => { });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  async function handleClick() {
    if (dragged.current) return;
    try {
      const windows = await getAllWindows();
      const main = windows.find(w => w.label === 'main');
      if (!main) return;
      await main.show();
      await main.unminimize();
      await main.setFocus();
    } catch { /* noop */ }
  }

  return (
    <div className="bubble-root" onMouseDown={handleMouseDown}>
      <div className={`bubble-msg${showMsg ? '' : ' hidden'}`}>
        <span className="bubble-msg-text">Punto de Venta · siempre listo</span>
      </div>
      <button className="bubble-btn" onClick={handleClick}>
        <svg width="28" height="25" viewBox="0 0 88 77" fill="none">
          <path d="M69 61L41.9686 60.8976L88 0H24.2407L8.55556 20.141L47.5761 20L0 77H52L69 61Z" fill="white" />
          <path d="M72.0091 61L55 77H71L88 61H72.0091Z" fill="white" />
        </svg>
      </button>
    </div>
  );
}

function delay(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}
