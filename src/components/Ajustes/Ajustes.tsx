import { useState, useRef } from 'react';
import { getAllWindows } from '@tauri-apps/api/window';
import './Ajustes.css';
import { useUIStore, type Theme, type Modo } from '../../store/uiStore';
import { useVentasStore } from '../../store/ventasStore';
import { useNotasStore } from '../../store/notasStore';
import { showToast } from '../../lib/toast';
import { ConfirmDialog } from '../Notas/Notas';

/* ─── Previews de tema ──────────────────────────────────────── */
const THEME_PREVIEWS: Record<Theme, { bg: string; lines: string[] }> = {
  light: { bg: '#F5F5F7', lines: ['#1D1D1F', '#6E6E73', '#AEAEB2'] },
  dark:  { bg: '#1C1C1E', lines: ['#FFFFFF', '#8E8E93', '#3A3A3C'] },
  zumi:  { bg: '#0A1628', lines: ['#ADCFF7', '#64B5F6', '#1E3A5F'] },
};
const THEME_LABELS: Record<Theme, string> = { light: 'Claro', dark: 'Oscuro', zumi: 'Zumi' };

function ThemeCard({ id, current, onSelect }: { id: Theme; current: Theme; onSelect: (t: Theme) => void }) {
  const { bg, lines } = THEME_PREVIEWS[id];
  const selected = id === current;
  return (
    <div className={`aj-theme-card${selected ? ' selected' : ''}`} onClick={() => onSelect(id)}>
      <div className="aj-theme-preview" style={{ background: bg }}>
        <div className="aj-preview-line wide"  style={{ background: lines[0] + 'CC' }} />
        <div className="aj-preview-line short" style={{ background: lines[1] + '99' }} />
        <div className="aj-preview-line med"   style={{ background: lines[2] + '77' }} />
      </div>
      <span className="aj-theme-label">{THEME_LABELS[id]}</span>
    </div>
  );
}

/* ─── Componente principal ──────────────────────────────────── */
export default function Ajustes() {
  const { theme, modo, userName, bubbleEnabled, setTheme, setModo, setUserName, setBubbleEnabled } = useUIStore();
  const { clearVentas } = useVentasStore();
  const { notas, papelera } = useNotasStore();

  const [nameVal, setNameVal] = useState(userName);
  const [confirm, setConfirm] = useState<null | 'ventas' | 'notas'>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function saveName() {
    const n = nameVal.trim();
    setUserName(n);
    if (n) showToast('Nombre actualizado');
  }

  function handleClearVentas() {
    clearVentas();
    setConfirm(null);
    showToast('Historial eliminado');
  }

  function handleClearNotas() {
    // clear via store direct state update — use localStorage directly for simplicity
    localStorage.removeItem('notas_db');
    localStorage.removeItem('papelera_db');
    localStorage.removeItem('etq_colores');
    window.location.reload();
  }

  const initial = (nameVal.trim() || userName || 'U').charAt(0).toUpperCase();
  const totalNotas = notas.length + papelera.length;

  const shortcuts: { keys: string[]; desc: string }[] = [
    { keys: ['N'],     desc: 'Nueva nota rápida' },
    { keys: ['Enter'], desc: 'Guardar nota / operación' },
    { keys: ['Esc'],   desc: 'Cerrar modal / limpiar campo' },
  ];

  return (
    <div className="ajustes-view">
      <div className="ajustes-wrap">
        <h2 className="ajustes-title">Ajustes</h2>

        {/* ── Perfil ── */}
        <div className="aj-card">
          <p className="aj-card-title">Perfil</p>
          <div className="aj-profile-row">
            <div className="aj-avatar">{initial}</div>
            <input
              ref={inputRef}
              className="aj-name-input"
              placeholder="Tu nombre…"
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter') { saveName(); inputRef.current?.blur(); } }}
              maxLength={32}
            />
          </div>
        </div>

        {/* ── Apariencia ── */}
        <div className="aj-card">
          <p className="aj-card-title">Apariencia</p>
          <div className="aj-theme-row">
            {(['light', 'dark', 'zumi'] as Theme[]).map(t => (
              <ThemeCard key={t} id={t} current={theme} onSelect={setTheme} />
            ))}
          </div>
        </div>

        {/* ── Calculadora ── */}
        <div className="aj-card">
          <p className="aj-card-title">Calculadora</p>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Modo predeterminado al abrir la app</p>
          <div className="aj-toggle">
            {(['precision', 'avanzado'] as Modo[]).map(m => (
              <button
                key={m}
                className={`aj-toggle-opt${modo === m ? ' active' : ''}`}
                onClick={() => setModo(m)}
              >
                {m === 'precision' ? 'Precisión' : 'Avanzado'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Burbuja flotante ── */}
        <div className="aj-card">
          <p className="aj-card-title">Acceso rápido</p>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
            Burbuja flotante que abre Zumi desde cualquier ventana
          </p>
          <div className="aj-toggle">
            <button
              className={`aj-toggle-opt${bubbleEnabled ? ' active' : ''}`}
              onClick={() => setBubbleEnabled(true)}
            >
              Activa
            </button>
            <button
              className={`aj-toggle-opt${!bubbleEnabled ? ' active' : ''}`}
              onClick={() => setBubbleEnabled(false)}
            >
              Desactivada
            </button>
          </div>
        </div>

        {/* ── Atajos ── */}
        <div className="aj-card">
          <p className="aj-card-title">Atajos de teclado</p>
          {shortcuts.map(({ keys, desc }) => (
            <div key={desc} className="aj-shortcut-row">
              <span className="aj-shortcut-desc">{desc}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {keys.map(k => <kbd key={k} className="aj-key">{k}</kbd>)}
              </div>
            </div>
          ))}
        </div>

        {/* ── Datos ── */}
        <div className="aj-card">
          <p className="aj-card-title">Datos</p>
          <button className="aj-danger-btn" onClick={() => setConfirm('ventas')}>
            Limpiar historial de ventas
          </button>
          {totalNotas > 0 && (
            <button className="aj-danger-btn" onClick={() => setConfirm('notas')} style={{ marginTop: 8 }}>
              Limpiar todas las notas y etiquetas
            </button>
          )}
        </div>

        <p className="aj-version">Zumi v1.0 · Punto de Venta</p>

        <button
          className="aj-danger-btn"
          style={{ marginTop: 8 }}
          onClick={async () => {
            const wins = await getAllWindows();
            for (const w of wins) { try { await w.close(); } catch { /* noop */ } }
          }}
        >
          Salir de Zumi
        </button>
      </div>

      {confirm === 'ventas' && (
        <ConfirmDialog
          titulo="¿Limpiar historial?"
          sub="Se eliminarán todas las ventas registradas. Esta acción no se puede deshacer."
          labelOk="Limpiar"
          onOk={handleClearVentas}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'notas' && (
        <ConfirmDialog
          titulo="¿Eliminar todas las notas?"
          sub="Se borrarán las notas, papelera y etiquetas permanentemente."
          labelOk="Eliminar todo"
          onOk={handleClearNotas}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
