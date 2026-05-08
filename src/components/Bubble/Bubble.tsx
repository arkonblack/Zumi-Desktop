import { useEffect, useRef } from 'react';
import { getCurrentWindow, getAllWindows, currentMonitor } from '@tauri-apps/api/window';
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';
import './Bubble.css';

const W = 110;
const H = 110;

export default function Bubble() {
  const dragged = useRef(false);

  useEffect(() => {
    if (localStorage.getItem('bubble_enabled') === 'false') return;

    const win = getCurrentWindow();
    let alive = true;

    async function init() {
      try {
        const { sw, sh, offsetX, offsetY } = await getScreenBounds();
        const finalX = offsetX + sw - W;
        const y = offsetY + Math.round(sh / 2 - H / 2);

        await win.setSize(new LogicalSize(W, H));
        await win.setPosition(new LogicalPosition(finalX, y));
        if (!alive) return;
        await win.show();
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
      <button className="bubble-btn" onClick={handleClick}>
        <svg width="28" height="25" viewBox="0 0 88 77" fill="none">
          <path d="M69 61L41.9686 60.8976L88 0H24.2407L8.55556 20.141L47.5761 20L0 77H52L69 61Z" fill="white" />
          <path d="M72.0091 61L55 77H71L88 61H72.0091Z" fill="white" />
        </svg>
      </button>
    </div>
  );
}

async function getScreenBounds() {
  try {
    const m = await currentMonitor();
    if (m) {
      const scale = m.scaleFactor;
      return {
        sw: m.size.width / scale,
        sh: m.size.height / scale,
        offsetX: m.position.x / scale,
        offsetY: m.position.y / scale,
      };
    }
  } catch { /* noop */ }
  return {
    sw: window.screen.availWidth,
    sh: window.screen.availHeight,
    offsetX: 0,
    offsetY: 0,
  };
}
