import { create } from 'zustand';

export interface Nota {
  id:        number;
  texto:     string;
  etiqueta:  string | null;
  estado:    'pendiente' | 'resuelto';
  hora:      string;
  fecha:     string;
}

export interface NotaPapelera extends Nota {
  deletedAt: number;
}

const PALETA = [
  '#FF6B6B','#FF9500','#FFCC00','#34C759','#00C7BE',
  '#0071E3','#5856D6','#AF52DE','#FF2D55','#8E8E93',
];
const PAPELERA_TTL = 7 * 24 * 60 * 60 * 1000;

function loadPapelera(): NotaPapelera[] {
  const raw = JSON.parse(localStorage.getItem('papelera_db') || '[]') as NotaPapelera[];
  return raw.filter(n => Date.now() - n.deletedAt < PAPELERA_TTL);
}

interface NotasStore {
  notas:         Nota[];
  papelera:      NotaPapelera[];
  etqColores:    Record<string, string>;
  filtroEtq:     string | null;
  modalOpen:     boolean;

  addNota:       (texto: string, etiqueta: string | null) => Nota;
  toggleNota:    (id: number) => void;
  deleteNota:    (id: number) => void;
  restoreNota:   (id: number) => void;
  permDelete:    (id: number) => void;
  setFiltro:     (etq: string | null) => void;
  getColorEtq:   (nombre: string) => string;
  setColorEtq:   (nombre: string, color: string) => void;
  deleteEtq:     (nombre: string) => void;
  setModalOpen:  (open: boolean) => void;
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

const initPapelera = loadPapelera();
save('papelera_db', initPapelera);

export const useNotasStore = create<NotasStore>((set, get) => ({
  notas:      JSON.parse(localStorage.getItem('notas_db')    || '[]'),
  papelera:   initPapelera,
  etqColores: JSON.parse(localStorage.getItem('etq_colores') || '{}'),
  filtroEtq:  null,
  modalOpen:  false,

  addNota: (texto, etiqueta) => {
    const ahora = new Date();
    const nota: Nota = {
      id:       Date.now(),
      texto,
      etiqueta,
      estado:   'pendiente',
      hora:     ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fecha:    ahora.toLocaleDateString('es-CO'),
    };
    set(s => {
      const notas = [nota, ...s.notas];
      save('notas_db', notas);
      return { notas };
    });
    return nota;
  },

  toggleNota: (id) => set(s => {
    const notas = s.notas.map(n =>
      n.id === id ? { ...n, estado: n.estado === 'pendiente' ? 'resuelto' : 'pendiente' } as Nota : n
    );
    save('notas_db', notas);
    return { notas };
  }),

  deleteNota: (id) => set(s => {
    const nota = s.notas.find(n => n.id === id);
    if (!nota) return {};
    const notas    = s.notas.filter(n => n.id !== id);
    const papelera = [{ ...nota, deletedAt: Date.now() }, ...s.papelera];
    save('notas_db', notas);
    save('papelera_db', papelera);
    return { notas, papelera };
  }),

  restoreNota: (id) => set(s => {
    const item = s.papelera.find(n => n.id === id);
    if (!item) return {};
    const { deletedAt: _d, ...nota } = item;
    const papelera = s.papelera.filter(n => n.id !== id);
    const notas    = [nota, ...s.notas];
    save('notas_db', notas);
    save('papelera_db', papelera);
    return { notas, papelera };
  }),

  permDelete: (id) => set(s => {
    const papelera = s.papelera.filter(n => n.id !== id);
    save('papelera_db', papelera);
    return { papelera };
  }),

  setFiltro: (etq) => set({ filtroEtq: etq }),

  getColorEtq: (nombre) => {
    const { etqColores } = get();
    if (etqColores[nombre]) return etqColores[nombre];
    const usados = Object.values(etqColores);
    const libres = PALETA.filter(c => !usados.includes(c));
    const color  = libres.length > 0
      ? libres[Math.floor(Math.random() * libres.length)]
      : PALETA[Math.floor(Math.random() * PALETA.length)];
    const next = { ...etqColores, [nombre]: color };
    save('etq_colores', next);
    set({ etqColores: next });
    return color;
  },

  setColorEtq: (nombre, color) => set(s => {
    const etqColores = { ...s.etqColores, [nombre]: color };
    save('etq_colores', etqColores);
    return { etqColores };
  }),

  deleteEtq: (nombre) => set(s => {
    const etqColores = { ...s.etqColores };
    delete etqColores[nombre];
    const notas = s.notas.map(n => n.etiqueta === nombre ? { ...n, etiqueta: null } : n);
    save('etq_colores', etqColores);
    save('notas_db', notas);
    return { etqColores, notas, filtroEtq: s.filtroEtq === nombre ? null : s.filtroEtq };
  }),

  setModalOpen: (open) => set({ modalOpen: open }),
}));

export const PALETA_COLORES = PALETA;
