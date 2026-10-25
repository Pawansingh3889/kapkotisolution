let preference: string | null = null;
try { preference = localStorage.getItem('kapkoti-theme'); } catch { /* The system preference works without storage. */ }
document.documentElement.dataset.theme = preference === 'dark' || preference === 'light'
  ? preference
  : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
