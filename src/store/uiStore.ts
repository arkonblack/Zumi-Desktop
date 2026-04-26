import { create } from 'zustand';

export type View  = 'calc' | 'notas' | 'ajustes';
export type Theme = 'light' | 'dark' | 'zumi';
export type Modo  = 'precision' | 'avanzado';

interface UIStore {
  activeView:    View;
  sidebarOpen:   boolean;
  theme:         Theme;
  modo:          Modo;
  userName:      string;
  bubbleEnabled: boolean;

  setView:          (v: View)    => void;
  toggleSidebar:    ()           => void;
  setSidebarOpen:   (o: boolean) => void;
  setTheme:         (t: Theme)   => void;
  setModo:          (m: Modo)    => void;
  toggleModo:       ()           => void;
  setUserName:      (n: string)  => void;
  setBubbleEnabled: (v: boolean) => void;
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark');
  document.documentElement.classList.toggle('theme-zumi', t === 'zumi');
}

const savedTheme = (localStorage.getItem('theme_app') as Theme) || 'light';
applyTheme(savedTheme);

export const useUIStore = create<UIStore>((set, get) => ({
  activeView:    'calc',
  sidebarOpen:   localStorage.getItem('sidebar_open') !== 'false',
  theme:         savedTheme,
  modo:          (localStorage.getItem('modo_app') as Modo) || 'precision',
  userName:      localStorage.getItem('user_nombre') || '',
  bubbleEnabled: localStorage.getItem('bubble_enabled') !== 'false',

  setView: (v) => set({ activeView: v }),

  toggleSidebar: () => set((s) => {
    const open = !s.sidebarOpen;
    localStorage.setItem('sidebar_open', String(open));
    return { sidebarOpen: open };
  }),

  setSidebarOpen: (open) => {
    localStorage.setItem('sidebar_open', String(open));
    set({ sidebarOpen: open });
  },

  setTheme: (t) => {
    const apply = () => {
      localStorage.setItem('theme_app', t);
      applyTheme(t);
      set({ theme: t });
    };
    if (!(document as any).startViewTransition) { apply(); return; }
    (document as any).startViewTransition(apply);
  },

  setModo: (m) => {
    localStorage.setItem('modo_app', m);
    set({ modo: m });
  },

  toggleModo: () => {
    const m = get().modo === 'precision' ? 'avanzado' : 'precision';
    localStorage.setItem('modo_app', m);
    set({ modo: m });
  },

  setUserName: (n) => {
    localStorage.setItem('user_nombre', n);
    set({ userName: n });
  },

  setBubbleEnabled: (v) => {
    localStorage.setItem('bubble_enabled', String(v));
    set({ bubbleEnabled: v });
  },
}));
