import { useState, useRef, useEffect, useCallback } from 'react';
import './Notas.css';
import { useNotasStore, PALETA_COLORES, type Nota, type NotaPapelera } from '../../store/notasStore';
import { showToast } from '../../lib/toast';

/* ─── Color Picker ─────────────────────────────────────────── */
interface ColorPickerProps {
  anchorRect: DOMRect;
  currentColor: string;
  onSelect: (c: string) => void;
  onClose: () => void;
}
function ColorPicker({ anchorRect, currentColor, onSelect, onClose }: ColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const top  = Math.min(anchorRect.bottom + 6, window.innerHeight - 180);
  const left = Math.min(anchorRect.left, window.innerWidth - 200);

  return (
    <div className="color-picker-popup" ref={ref} style={{ top, left }}>
      <p className="color-picker-title">Color de etiqueta</p>
      <div className="color-picker-grid">
        {PALETA_COLORES.map(c => (
          <div
            key={c}
            className={`color-swatch${c === currentColor ? ' selected' : ''}`}
            style={{ background: c }}
            onClick={() => { onSelect(c); onClose(); }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Confirm Dialog ────────────────────────────────────────── */
export interface ConfirmProps {
  titulo: string;
  sub: string;
  labelOk?: string;
  onOk: () => void;
  onCancel: () => void;
}
export function ConfirmDialog({ titulo, sub, labelOk = 'Eliminar', onOk, onCancel }: ConfirmProps) {
  return (
    <div className="confirm-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="confirm-box">
        <p className="confirm-title">{titulo}</p>
        <p className="confirm-sub">{sub}</p>
        <div className="confirm-btns">
          <button className="confirm-cancel" onClick={onCancel}>Cancelar</button>
          <button className="confirm-ok" onClick={onOk}>{labelOk}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Nota Item ─────────────────────────────────────────────── */
interface NotaItemProps {
  nota: Nota;
  isNew: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEtqClick: (e: React.MouseEvent, nombre: string) => void;
  getColor: (nombre: string) => string;
}
function NotaItem({ nota, isNew, onToggle, onDelete, onEtqClick, getColor }: NotaItemProps) {
  const color = nota.etiqueta ? getColor(nota.etiqueta) : null;
  return (
    <div className={`nota-item${nota.estado === 'resuelto' ? ' done' : ''}${isNew ? ' nota-item-new' : ''}`}>
      <div className="nota-color-bar" style={{ background: color ?? 'transparent' }} />
      <div className="nota-inner">
        <div className={`nota-circle${nota.estado === 'resuelto' ? ' checked' : ''}`} onClick={onToggle}>
          {nota.estado === 'resuelto' && '✓'}
        </div>
        <div className="nota-body">
          <p className="nota-txt">{nota.texto}</p>
          <div className="nota-meta">
            <span className="nota-time">{nota.hora} · {nota.fecha}</span>
            {nota.etiqueta && color && (
              <span
                className="nota-etq"
                style={{ background: color }}
                onClick={e => onEtqClick(e, nota.etiqueta!)}
              >
                <span className="nota-etq-dot" />
                {nota.etiqueta}
              </span>
            )}
          </div>
        </div>
        <span className="nota-del" onClick={onDelete} title="Eliminar">✕</span>
      </div>
    </div>
  );
}

/* ─── Modal nueva nota ──────────────────────────────────────── */
export interface ModalNotaProps {
  onClose: () => void;
  onSave: (texto: string, etq: string | null) => void;
  getColor: (nombre: string) => string;
  etiquetas: string[];
}
export function ModalNota({ onClose, onSave, getColor, etiquetas }: ModalNotaProps) {
  const [texto, setTexto]         = useState('');
  const [etqSel, setEtqSel]       = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [newEtq, setNewEtq]       = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const etqRef = useRef<HTMLInputElement>(null);

  useEffect(() => { taRef.current?.focus(); }, []);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') onClose();
  }

  function handleSave() {
    if (!texto.trim()) return;
    onSave(texto.trim(), etqSel);
    onClose();
  }

  function addEtq() {
    const nombre = newEtq.trim();
    if (!nombre) return;
    setEtqSel(nombre);
    setNewEtq('');
    setShowInput(false);
  }

  return (
    <div className="z-modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="z-modal-overlay" onClick={onClose} />
      <div className="z-modal-box">
        <div className="modal-hdr">
          <div className="modal-hdr-left">
            <h2>Nueva nota</h2>
            <span className="modal-badge">⚡</span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-etq-row">
            {etiquetas.map(e => (
              <button
                key={e}
                className={`etq-chip${etqSel === e ? ' sel' : ''}`}
                style={{ background: getColor(e) }}
                onClick={() => setEtqSel(etqSel === e ? null : e)}
              >
                {e}
              </button>
            ))}
            {showInput ? (
              <input
                ref={etqRef}
                className="inline-etq-input"
                value={newEtq}
                placeholder="Etiqueta…"
                autoFocus
                onChange={e => setNewEtq(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addEtq(); }
                  if (e.key === 'Escape') { setShowInput(false); setNewEtq(''); }
                }}
                onBlur={addEtq}
              />
            ) : (
              <button className="add-chip" onClick={() => setShowInput(true)} title="Nueva etiqueta">+</button>
            )}
          </div>
          <textarea
            ref={taRef}
            className="modal-textarea"
            rows={4}
            placeholder="Escribe tu nota…"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKey}
          />
          <div className="modal-footer">
            <button className="modal-save" disabled={!texto.trim()} onClick={handleSave}>Guardar</button>
          </div>
          <p className="modal-hint">Enter para guardar · Esc para cerrar</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Papelera Modal ────────────────────────────────────────── */
interface PapeleraModalProps {
  items: NotaPapelera[];
  onRestore: (id: number) => void;
  onPermDelete: (id: number) => void;
  onClose: () => void;
  getColor: (nombre: string) => string;
}
function PapeleraModal({ items, onRestore, onPermDelete, onClose, getColor }: PapeleraModalProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);

  return (
    <div className="z-modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="z-modal-overlay" onClick={onClose} />
      <div className="z-modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-hdr">
          <div className="modal-hdr-left">
            <h2>Papelera</h2>
            <span className="modal-badge" style={{ background: '#8E8E93' }}>7 días</span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ maxHeight: 400, overflowY: 'auto', padding: '8px 18px 16px' }}>
          {items.length === 0 ? (
            <p className="empty-msg" style={{ padding: '24px 0' }}>Papelera vacía</p>
          ) : items.map(n => {
            const color = n.etiqueta ? getColor(n.etiqueta) : null;
            const daysLeft = Math.ceil((7 * 24 * 60 * 60 * 1000 - (Date.now() - n.deletedAt)) / (24 * 60 * 60 * 1000));
            return (
              <div key={n.id} style={{ borderBottom: '1px solid var(--divider)', padding: '10px 0', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {color && <div style={{ width: 4, borderRadius: 3, background: color, alignSelf: 'stretch', minHeight: 32, flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>{n.texto}</p>
                  <p style={{ fontSize: 10, color: 'var(--text3)', margin: '4px 0 0', fontWeight: 500 }}>
                    {n.hora} · {n.fecha} · expira en {daysLeft}d
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 2 }}>
                  <button onClick={() => { onRestore(n.id); showToast('Nota restaurada'); }} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Restaurar
                  </button>
                  <button onClick={() => setConfirmId(n.id)} style={{ background: 'rgba(255,59,48,0.1)', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#FF3B30', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Borrar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {confirmId !== null && (
        <ConfirmDialog
          titulo="¿Eliminar nota?"
          sub="Esta acción no se puede deshacer."
          onOk={() => { onPermDelete(confirmId); setConfirmId(null); showToast('Nota eliminada'); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}

/* ─── Componente principal ──────────────────────────────────── */
export default function Notas() {
  const {
    notas, papelera, etqColores, filtroEtq,
    addNota, toggleNota, deleteNota, restoreNota, permDelete,
    setFiltro, getColorEtq, setColorEtq, deleteEtq, setModalOpen,
  } = useNotasStore();

  /* Dashboard inline */
  const [dashTexto, setDashTexto]     = useState('');
  const [dashEtqSel, setDashEtqSel]  = useState<string | null>(null);
  const [dashExpanded, setDashExpanded] = useState(false);
  const [dashNewEtq, setDashNewEtq]   = useState('');
  const [dashShowInput, setDashShowInput] = useState(false);
  const dashTaRef = useRef<HTMLTextAreaElement>(null);

  /* Papelera */
  const [papeleraOpen, setPapeleraOpen] = useState(false);

  /* Confirm delete nota */
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  /* Color picker */
  const [cpEtq, setCpEtq]         = useState<string | null>(null);
  const [cpRect, setCpRect]       = useState<DOMRect | null>(null);

  /* Track newly added nota id for animation */
  const [newNotaId, setNewNotaId] = useState<number | null>(null);

  /* Auto-resize dashboard textarea */
  useEffect(() => {
    const ta = dashTaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }, [dashTexto]);

  /* Keyboard shortcuts */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n') { e.preventDefault(); setModalOpen(true); }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const etiquetas = Object.keys(etqColores);

  const notasFiltradas = filtroEtq
    ? notas.filter(n => n.etiqueta === filtroEtq)
    : notas;

  const pendientes = notasFiltradas.filter(n => n.estado === 'pendiente');
  const resueltas  = notasFiltradas.filter(n => n.estado === 'resuelto');

  /* Dashboard: guardar */
  const dashGuardar = useCallback(() => {
    if (!dashTexto.trim()) return;
    const nota = addNota(dashTexto.trim(), dashEtqSel);
    setNewNotaId(nota.id);
    setTimeout(() => setNewNotaId(null), 600);
    setDashTexto('');
    setDashEtqSel(null);
    setDashExpanded(false);
    setDashShowInput(false);
    showToast('Nota guardada');
  }, [dashTexto, dashEtqSel, addNota]);

  /* Delete nota → papelera */
  function handleDelete(id: number) {
    setConfirmDeleteId(id);
  }
  function confirmDelete() {
    if (confirmDeleteId == null) return;
    deleteNota(confirmDeleteId);
    setConfirmDeleteId(null);
    showToast('Nota eliminada');
  }

  /* Etiqueta chip click → color picker */
  function handleEtqChipClick(e: React.MouseEvent, nombre: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCpEtq(nombre);
    setCpRect(rect);
  }

  /* Dashboard: agregar etiqueta nueva */
  function dashAddEtq() {
    const nombre = dashNewEtq.trim();
    if (!nombre) return;
    setDashEtqSel(nombre);
    setDashNewEtq('');
    setDashShowInput(false);
    getColorEtq(nombre); // ensure color assigned
  }

  /* Delete etiqueta (filter chip x) */
  function handleDeleteEtq(etq: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteEtq(etq);
    if (filtroEtq === etq) setFiltro(null);
  }

  const totalPendientes = notas.filter(n => n.estado === 'pendiente').length;

  return (
    <div className="notas-view">
      <div className="notas-wrap">

        {/* Header */}
        <div className="notas-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Notas
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="notas-count">
              {totalPendientes} {totalPendientes === 1 ? 'pendiente' : 'pendientes'}
            </span>
            {papelera.length > 0 && (
              <button
                onClick={() => setPapeleraOpen(true)}
                title={`Papelera (${papelera.length})`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text3)', padding: '3px 6px', borderRadius: 8, transition: 'color 0.15s', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                {papelera.length}
              </button>
            )}
          </div>
        </div>

        {/* Dashboard inline */}
        <div className={`nota-dashboard${dashExpanded ? ' expanded' : ''}`}>
          <textarea
            ref={dashTaRef}
            className="dash-textarea"
            rows={1}
            placeholder="Escribe una nota rápida…"
            value={dashTexto}
            onFocus={() => setDashExpanded(true)}
            onChange={e => setDashTexto(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); dashGuardar(); }
              if (e.key === 'Escape') { setDashTexto(''); setDashExpanded(false); (e.target as HTMLElement).blur(); }
            }}
          />
          <div className={`dash-bottom${dashExpanded ? '' : ' hidden'}`}>
            <div className="dash-etq-row">
              {etiquetas.map(etq => (
                <button
                  key={etq}
                  className={`etq-chip${dashEtqSel === etq ? ' sel' : ''}`}
                  style={{ background: getColorEtq(etq) }}
                  onClick={() => setDashEtqSel(dashEtqSel === etq ? null : etq)}
                >
                  {etq}
                </button>
              ))}
              {dashShowInput ? (
                <input
                  className="inline-etq-input"
                  value={dashNewEtq}
                  placeholder="Etiqueta…"
                  autoFocus
                  onChange={e => setDashNewEtq(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); dashAddEtq(); }
                    if (e.key === 'Escape') { setDashShowInput(false); setDashNewEtq(''); }
                  }}
                  onBlur={dashAddEtq}
                />
              ) : (
                <button className="add-chip" onClick={() => setDashShowInput(true)} title="Nueva etiqueta">+</button>
              )}
            </div>
            <button
              className="dash-send-btn"
              disabled={!dashTexto.trim()}
              onClick={dashGuardar}
              title="Guardar (Enter)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filtros */}
        {etiquetas.length > 0 && (
          <div className="filtros">
            <button
              className={`f-chip${filtroEtq === null ? ' active' : ''}`}
              onClick={() => setFiltro(null)}
            >
              Todas
            </button>
            {etiquetas.map(etq => (
              <button
                key={etq}
                className={`f-chip${filtroEtq === etq ? ' active' : ''}`}
                onClick={() => setFiltro(filtroEtq === etq ? null : etq)}
              >
                <span className="f-chip-dot" style={{ background: getColorEtq(etq) }} />
                {etq}
                <span
                  className="etq-del"
                  onClick={e => handleDeleteEtq(etq, e)}
                  title="Eliminar etiqueta"
                >×</span>
              </button>
            ))}
          </div>
        )}

        {/* Lista vacía */}
        {notasFiltradas.length === 0 && (
          <div className="empty-msg">
            <p>No hay notas aún.</p>
            <p>Escribe arriba o presiona <strong>N</strong> para añadir una.</p>
          </div>
        )}

        {/* Sección Pendientes */}
        {pendientes.length > 0 && (
          <div className="nota-sec">
            <div className="nota-sec-hdr">
              <span className="nota-sec-title">Pendientes · {pendientes.length}</span>
            </div>
            {pendientes.map(n => (
              <NotaItem
                key={n.id}
                nota={n}
                isNew={n.id === newNotaId}
                onToggle={() => toggleNota(n.id)}
                onDelete={() => handleDelete(n.id)}
                onEtqClick={handleEtqChipClick}
                getColor={getColorEtq}
              />
            ))}
          </div>
        )}

        {/* Sección Resueltas */}
        {resueltas.length > 0 && (
          <div className="nota-sec">
            <div className="nota-sec-hdr">
              <span className="nota-sec-title">Resueltas · {resueltas.length}</span>
            </div>
            {resueltas.map(n => (
              <NotaItem
                key={n.id}
                nota={n}
                isNew={n.id === newNotaId}
                onToggle={() => toggleNota(n.id)}
                onDelete={() => handleDelete(n.id)}
                onEtqClick={handleEtqChipClick}
                getColor={getColorEtq}
              />
            ))}
          </div>
        )}

      </div>

      {/* Papelera modal */}
      {papeleraOpen && (
        <PapeleraModal
          items={papelera}
          onRestore={id => { restoreNota(id); }}
          onPermDelete={id => { permDelete(id); }}
          onClose={() => setPapeleraOpen(false)}
          getColor={getColorEtq}
        />
      )}

      {/* Confirm delete */}
      {confirmDeleteId !== null && (
        <ConfirmDialog
          titulo="¿Mover a la papelera?"
          sub="La nota se eliminará en 7 días si no la restauras."
          labelOk="Mover"
          onOk={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Color picker */}
      {cpEtq && cpRect && (
        <ColorPicker
          anchorRect={cpRect}
          currentColor={getColorEtq(cpEtq)}
          onSelect={c => setColorEtq(cpEtq, c)}
          onClose={() => { setCpEtq(null); setCpRect(null); }}
        />
      )}
    </div>
  );
}
