import { useState, useCallback, useEffect, useRef } from 'react';
import './Calculadora.css';
import { useUIStore } from '../../store/uiStore';
import { useVentasStore } from '../../store/ventasStore';
import { fmt, formatInput, evaluarExpresion, calcularVuelto } from '../../hooks/useCalculadora';
import { showToast } from '../../lib/toast';

export default function Calculadora() {
  const { modo, toggleModo } = useUIStore();
  const { addVenta } = useVentasStore();

  const [totalRaw, setTotalRaw]       = useState('');
  const [recibidoRaw, setRecibidoRaw] = useState('');

  // Animación de modo en dos fases: salida → entrada
  const [displayedModo, setDisplayedModo] = useState(modo);
  const [saliendo, setSaliendo]           = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (modo === displayedModo) return;
    // Fase 1: fade-out del contenido actual (180ms)
    setSaliendo(true);
    timerRef.current = setTimeout(() => {
      // Fase 2: cambia contenido y hace fade-in
      setDisplayedModo(modo);
      setSaliendo(false);
    }, 180);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [modo]);

  const total     = evaluarExpresion(totalRaw);
  const recibido  = evaluarExpresion(recibidoRaw);
  const resultado = calcularVuelto(total, recibido);

  const av = modo === 'avanzado';
  const avDisplay = displayedModo === 'avanzado';

  const canAccion = av
    ? (total > 0 && recibido >= total)
    : total > 0;

  const handleTotalInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalRaw(formatInput(e.target.value));
  }, []);

  const handleRecibidoInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRecibidoRaw(formatInput(e.target.value));
  }, []);

  function addCash(amt: number) {
    const curr = recibidoRaw.trim();
    setRecibidoRaw(curr ? curr + '+' + fmt(amt) : fmt(amt));
  }

  function limpiar() { setTotalRaw(''); setRecibidoRaw(''); }

  function guardarYLimpiar() {
    if (total > 0 && recibido >= total) { addVenta(total, recibido); showToast('Venta registrada'); }
    limpiar();
  }

  function registrar() {
    if (total > 0 && recibido >= total) { addVenta(total, recibido); limpiar(); showToast('Venta registrada'); }
  }

  return (
    <div className="calc-view">
      <div className="calc-card">

        {/* Header */}
        <div className="calc-header">
          <div>
            <p className="eyebrow">Punto de Venta</p>
            <p className="calc-title">{av ? 'Avanzado' : 'Precision'}</p>
          </div>
          <div className={`toggle-switch ${av ? 'av-mode' : ''}`} onClick={toggleModo}>
            <div className="toggle-labels">
              <div className={`toggle-label ${!av ? 'active' : ''}`}>Precision</div>
              <div className={`toggle-label ${av ? 'active' : ''}`}>Avanzado</div>
            </div>
            <div className="toggle-slider" />
          </div>
        </div>

        {/* Total */}
        <p className="field-label">Total Factura</p>
        <div className="input-wrap">
          <span className="cur">$</span>
          <input
            type="text" value={totalRaw} placeholder="0"
            onChange={handleTotalInput}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('inp-recibido')?.focus()}
          />
          <span className="rt-label">{total > 0 ? '$' + fmt(total) : '$0'}</span>
          {totalRaw && (
            <button className="clear-btn visible" onClick={() => setTotalRaw('')} tabIndex={-1}>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle className="cb-circle" cx="8.5" cy="8.5" r="8.5"/><path d="M5.5 11.5L11.5 5.5M5.5 5.5L11.5 11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>

        {/* Zona animada: hint (Precision) o billetes (Avanzado) */}
        <div key={displayedModo} className={`modo-contenido${saliendo ? ' saliendo' : ''}`}>
          {!avDisplay ? (
            <p className="field-hint">Usa &nbsp;+ &nbsp;− &nbsp;* &nbsp;/&nbsp; (ej: 50000-3000)</p>
          ) : (
            <>
              <p className="field-label">Dinero Recibido</p>
              <div className="bills-grid">
                {[2000, 5000, 10000, 20000, 50000, 100000].map(d => (
                  <button key={d} className="bill-btn" onClick={() => addCash(d)}>
                    ${d >= 1000 ? (d / 1000) + 'k' : d}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recibido */}
        {!avDisplay && <p className="field-label">Dinero Recibido</p>}
        <div className="input-wrap">
          <span className="cur">$</span>
          <input
            id="inp-recibido" type="text" value={recibidoRaw} placeholder="0"
            onChange={handleRecibidoInput}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (av) registrar(); else guardarYLimpiar(); } }}
          />
          <span className="rt-label">{recibido > 0 ? '$' + fmt(recibido) : '$0'}</span>
          {recibidoRaw && (
            <button className="clear-btn visible" onClick={() => setRecibidoRaw('')} tabIndex={-1}>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle className="cb-circle" cx="8.5" cy="8.5" r="8.5"/><path d="M5.5 11.5L11.5 5.5M5.5 5.5L11.5 11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>

        {/* Resultado */}
        <div className="vuelto-box">
          <p className="vuelto-label">Vuelto a entregar</p>
          <div className={`resultado ${resultado.estado === 'insuficiente' ? 'insuficiente' : ''}`}>
            {resultado.estado === 'vacio'         && '$0'}
            {resultado.estado === 'insuficiente'  && `Faltan $${fmt(resultado.vuelto)}`}
            {resultado.estado === 'ok'             && `$${fmt(resultado.vuelto)}`}
          </div>
          {resultado.estado === 'ok' && avDisplay && (
            <div className="desglose">
              {resultado.desglose.map(({ denom, cantidad }) => (
                <span key={denom} className="chip">
                  {cantidad}x{denom >= 1000 ? (denom / 1000) + 'k' : denom}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="btn-row">
          <button className="btn-s" onClick={limpiar}>Limpiar</button>
          <button className="btn-p" disabled={!canAccion} onClick={av ? registrar : guardarYLimpiar}>
            {av ? 'Registrar' : 'Nueva Operación'}
          </button>
        </div>

      </div>
    </div>
  );
}
