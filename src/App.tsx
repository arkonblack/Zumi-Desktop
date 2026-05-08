import { useState, useEffect, useRef } from 'react';
import { getAllWindows } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import './App.css';
import TitleBar from './components/TitleBar/TitleBar';
import Sidebar from './components/Sidebar/Sidebar';
import Calculadora from './components/Calculadora/Calculadora';
import Notas, { ModalNota, ConfirmDialog } from './components/Notas/Notas';
import Ajustes from './components/Ajustes/Ajustes';
import { useUIStore } from './store/uiStore';
import { useNotasStore } from './store/notasStore';
import { showToast } from './lib/toast';
import UpdateDialog from './components/Updater/UpdateDialog';

const GLOBAL_SHORTCUT = 'CommandOrControl+Shift+Z';

function App() {
  const { activeView, bubbleEnabled, autostartAsked, setAutostart, setAutostartAsked } = useUIStore();
  const { addNota, getColorEtq, etqColores } = useNotasStore();
  const [fabModalOpen, setFabModalOpen] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    async function syncBubble() {
      try {
        const windows = await getAllWindows();
        const bubble = windows.find(w => w.label === 'bubble');
        if (!bubble) return;
        if (bubbleEnabled) await bubble.show();
        else await bubble.hide();
      } catch { /* noop */ }
    }
    syncBubble();
  }, [bubbleEnabled]);

  useEffect(() => {
    let registered = false;
    register(GLOBAL_SHORTCUT, (event) => {
      if (event.state === 'Pressed') {
        invoke('toggle_main_window').catch(() => { /* noop */ });
      }
    })
      .then(() => { registered = true; })
      .catch(() => { /* atajo ya registrado por otra instancia o sin permisos */ });

    return () => {
      if (registered) unregister(GLOBAL_SHORTCUT).catch(() => { /* noop */ });
    };
  }, []);

  function handleFabSave(texto: string, etq: string | null) {
    addNota(texto, etq);
    showToast('Nota guardada');
  }

  return (
    <>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
          {activeView === 'calc'    && <Calculadora />}
          {activeView === 'notas'   && <Notas />}
          {activeView === 'ajustes' && <Ajustes />}
        </main>
      </div>

      {/* FAB relámpago — visible en todas las vistas excepto Notas */}
      {activeView !== 'notas' && (
        <button className="fab-relampago" onClick={() => setFabModalOpen(true)} title="Nueva nota">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </button>
      )}

      {fabModalOpen && (
        <ModalNota
          onClose={() => setFabModalOpen(false)}
          onSave={handleFabSave}
          getColor={getColorEtq}
          etiquetas={Object.keys(etqColores)}
        />
      )}

      {!autostartAsked && (
        <ConfirmDialog
          titulo="¿Abrir Zumi al iniciar Windows?"
          sub="Zumi se abrirá automáticamente al encender el PC, minimizado en la bandeja del sistema. Puedes cambiar esta opción en cualquier momento desde Ajustes."
          labelOk="Sí, activar"
          onOk={() => { setAutostart(true); setAutostartAsked(true); }}
          onCancel={() => setAutostartAsked(true)}
        />
      )}

      <UpdateDialog />

      <div id="toast-container" style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 9999, pointerEvents: 'none' }} />
    </>
  );
}


export default App;
