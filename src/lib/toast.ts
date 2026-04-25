export function showToast(msg: string) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const isDark = document.documentElement.classList.contains('dark');
  const bg    = isDark ? '#FFFFFF' : '#1D1D1F';
  const color = isDark ? '#1D1D1F' : '#FFFFFF';
  const toast = document.createElement('div');
  toast.style.cssText = `background:${bg};color:${color};padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;font-family:Inter,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.2);transform:translateY(-20px);opacity:0;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);display:flex;align-items:center;gap:8px;pointer-events:none;`;
  toast.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span>${msg}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.transform = 'translateY(-20px)'; toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
