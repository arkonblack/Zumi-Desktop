import { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import Calculadora from './components/Calculadora/Calculadora';
import Notas, { ModalNota } from './components/Notas/Notas';
import Ajustes from './components/Ajustes/Ajustes';
import { useUIStore } from './store/uiStore';
import { useNotasStore } from './store/notasStore';
import { showToast } from './lib/toast';

function App() {
  const { activeView } = useUIStore();
  const { addNota, getColorEtq, etqColores } = useNotasStore();
  const [fabModalOpen, setFabModalOpen] = useState(false);

  function handleFabSave(texto: string, etq: string | null) {
    addNota(texto, etq);
    showToast('Nota guardada');
  }

  return (
    <>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
        {activeView === 'calc'    && <Calculadora />}
        {activeView === 'notas'   && <Notas />}
        {activeView === 'ajustes' && <Ajustes />}
      </main>

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

      <div id="toast-container" style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 9999, pointerEvents: 'none' }} />
    </>
  );
}


export default App;
