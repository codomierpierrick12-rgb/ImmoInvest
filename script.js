// Année dynamique
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Menu mobile
  const btn = document.querySelector('.nav-toggle');
  const menu = document.querySelector('[data-menu]');
  if (btn && menu) {
    btn.addEventListener('click', () => {
      const open = menu.style.display === 'flex';
      menu.style.display = open ? 'none' : 'flex';
      btn.setAttribute('aria-expanded', String(!open));
    });
  }
});
