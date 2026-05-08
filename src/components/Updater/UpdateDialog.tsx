import { useState, useEffect } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export default function UpdateDialog() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    check().then(u => { if (u) setUpdate(u); }).catch(() => {});
  }, []);

  if (!update || dismissed) return null;

  async function handleInstall() {
    if (!update) return;
    setStatus('downloading');
    try {
      await update.downloadAndInstall();
      setStatus('done');
      await relaunch();
    } catch {
      setStatus('idle');
    }
  }

  const downloading = status === 'downloading';
  const done = status === 'done';

  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <p className="confirm-title">Nueva versión disponible</p>
        <p className="confirm-sub">
          {done
            ? 'Actualización instalada. Reiniciando Zumi...'
            : downloading
            ? 'Descargando actualización, por favor espera...'
            : `Zumi ${update.version} está disponible. ¿Quieres instalarla ahora?`}
        </p>
        {!downloading && !done && (
          <div className="confirm-btns">
            <button className="confirm-cancel" onClick={() => setDismissed(true)}>
              Después
            </button>
            <button
              className="confirm-ok"
              style={{ background: '#34C759' }}
              onClick={handleInstall}
            >
              Actualizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
