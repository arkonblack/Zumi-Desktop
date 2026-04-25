import { create } from 'zustand';

export interface Venta {
  id:       number;
  total:    number;
  recibido: number;
  vuelto:   number;
  fecha:    string;
  hora:     string;
}

interface VentasStore {
  ventas:      Venta[];
  addVenta:    (total: number, recibido: number) => void;
  clearVentas: () => void;
}

export const useVentasStore = create<VentasStore>((set) => ({
  ventas: JSON.parse(localStorage.getItem('historial_avanzado') || '[]'),

  addVenta: (total, recibido) => set((s) => {
    const nueva: Venta = {
      id:       Date.now(),
      total,
      recibido,
      vuelto:   recibido - total,
      fecha:    new Date().toLocaleDateString('es-CO'),
      hora:     new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const ventas = [nueva, ...s.ventas];
    localStorage.setItem('historial_avanzado', JSON.stringify(ventas));
    return { ventas };
  }),

  clearVentas: () => {
    localStorage.removeItem('historial_avanzado');
    set({ ventas: [] });
  },
}));
