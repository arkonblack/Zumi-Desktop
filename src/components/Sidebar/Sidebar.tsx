import './Sidebar.css';
import { useUIStore } from '../../store/uiStore';
import { useVentasStore } from '../../store/ventasStore';
import { fmt } from '../../hooks/useCalculadora';

export default function Sidebar() {
  const { activeView, sidebarOpen, theme, userName, toggleSidebar, setView, setTheme } = useUIStore();
  const { ventas } = useVentasStore();

  const hoy = new Date().toLocaleDateString('es-CO');

  // Agrupar ventas por fecha
  const grupos: Record<string, typeof ventas> = {};
  ventas.forEach(v => {
    grupos[v.fecha] = grupos[v.fecha] || [];
    grupos[v.fecha].push(v);
  });
  const balHoy = (grupos[hoy] || []).reduce((s, v) => s + v.total, 0);

  const isDark = theme === 'dark' || theme === 'zumi';
  const initial = (userName || 'U').charAt(0).toUpperCase();

  function handleToggleTheme() {
    setTheme(isDark ? 'light' : 'dark');
  }

  return (
    <aside id="sidebar" className={sidebarOpen ? '' : 'collapsed'}>
      <div className="s-inner">

        {/* Header */}
        <div className="s-header">
          <div className="s-logo">
            <div className="s-logo-icon">
              <svg width="16" height="14" viewBox="0 0 88 77" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M69 61L41.9686 60.8976L88 0H24.2407L8.55556 20.141L47.5761 20L0 77H52L69 61Z" fill="#0071E3"/>
                <path d="M72.0091 61L55 77H71L88 61H72.0091Z" fill="#0071E3"/>
              </svg>
            </div>
            <span className="s-logo-text">Zumi</span>
          </div>
          <button className="s-toggle-btn" onClick={toggleSidebar} title="Alternar panel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2.5"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        </div>

        <div className="s-divider" />

        {/* Nueva Operación */}
        <div className="s-top">
          <button className="s-btn primary" onClick={() => setView('calc')} title="Nueva Operación">
            <span className="s-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </span>
            <span className="s-label primary-lbl">Nueva Operación</span>
          </button>
        </div>

        <div className="s-divider" />

        {/* Navegación */}
        <div className="s-nav">
          <button className={`s-btn ${activeView === 'calc' ? 'active' : ''}`} onClick={() => setView('calc')} title="Ventas">
            <span className="s-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </span>
            <span className="s-label">Ventas</span>
          </button>
          <button className={`s-btn ${activeView === 'notas' ? 'active' : ''}`} onClick={() => setView('notas')} title="Notas">
            <span className="s-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </span>
            <span className="s-label">Notas</span>
          </button>
        </div>

        <div className="s-divider" />

        {/* Historial scrollable */}
        <div className="s-scroll">
          {Object.keys(grupos).length === 0
            ? <p className="s-empty">Sin ventas registradas</p>
            : Object.entries(grupos).map(([fecha, ops]) => (
              <div key={fecha}>
                <div className="s-group-title">{fecha === hoy ? 'Hoy' : fecha}</div>
                {ops.map(op => (
                  <div key={op.id} className="s-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>${fmt(op.total)}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{op.hora}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Vuelto ${fmt(op.vuelto)}</div>
                  </div>
                ))}
              </div>
            ))
          }
        </div>

        {/* Footer */}
        <div className="s-footer">
          <div className="s-balance">
            <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>Balance hoy</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>${fmt(balHoy)}</span>
          </div>
          <div className="footer-user-row">
            <button className="s-btn s-user-btn" onClick={() => setView('ajustes')}>
              <div className="s-avatar">{initial}</div>
              <div className="s-user-info">
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                  {userName || 'Usuario'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.2 }}>Ajustes</span>
              </div>
            </button>
            <button className="s-btn s-darkmode-btn" onClick={handleToggleTheme} title="Cambiar tema">
              <span className="s-icon">
                {isDark
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="6.34" y1="17.66" x2="4.93" y2="19.07"/><line x1="19.07" y1="4.93" x2="17.66" y2="6.34"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                }
              </span>
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}
