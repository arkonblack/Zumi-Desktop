import { getCurrentWindow } from '@tauri-apps/api/window';
import './TitleBar.css';

export default function TitleBar() {
  const appWindow = getCurrentWindow();

  return (
    <div
      className="titlebar"
      data-tauri-drag-region
      onDoubleClick={() => appWindow.toggleMaximize()}
    >
      <div className="titlebar-controls">
        <button
          className="titlebar-btn minimize"
          onClick={() => appWindow.minimize()}
          title="Minimizar"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="none">
            <line x1="0" y1="0.5" x2="10" y2="0.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
        <button
          className="titlebar-btn maximize"
          onClick={() => appWindow.toggleMaximize()}
          title="Maximizar"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="0.75" y="0.75" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
        <button
          className="titlebar-btn close"
          onClick={() => appWindow.hide()}
          title="Cerrar"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
