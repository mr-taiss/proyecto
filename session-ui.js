/* Organización de opciones de sesión: contraseña en acceso y salida en ¿Qué deseas hacer? */
(function () {
  function addChangePasswordButton(box) {
    if (!box || box.querySelector('#sisgopChangeFromLogin')) return;
    const form = box.querySelector('#sisgopLoginForm');
    if (!form) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'sisgopChangeFromLogin';
    button.textContent = '🔑 Cambiar contraseña';
    button.style.cssText = 'width:100%;margin-top:10px;padding:12px;border:1px solid #d6e2f2;background:#f4f8ff;color:#245ea8;border-radius:10px;font-weight:700;cursor:pointer';
    button.addEventListener('click', function () {
      const currentUser = typeof window.currentSISGOPUser === 'function' ? window.currentSISGOPUser() : null;
      if (currentUser && typeof window.changePasswordSISGOP === 'function') {
        window.changePasswordSISGOP();
        return;
      }
      const message = box.querySelector('#sisgopLoginMessage');
      if (message) {
        message.textContent = 'Para cambiar tu contraseña, inicia sesión primero con tu usuario y contraseña actual.';
        message.style.color = '#245ea8';
      }
    });
    form.appendChild(button);
  }

  function addLogoutCard() {
    const grid = document.querySelector('.menu-grid');
    if (!grid || grid.querySelector('#sisgopLogoutCard')) return;

    const card = document.createElement('button');
    card.type = 'button';
    card.id = 'sisgopLogoutCard';
    card.className = 'menu-card';
    card.innerHTML = '<div class="menu-card-icon">↪</div><div class="menu-card-content"><span>SESIÓN</span><h2>Salir</h2><p>Cerrar tu sesión del sistema.</p></div><div class="menu-arrow">→</div>';
    card.onclick = function () {
      if (typeof window.logoutSISGOP === 'function') window.logoutSISGOP();
    };
    grid.appendChild(card);
  }

  function removeOldBadge() {
    document.getElementById('sisgopUserBadge')?.remove();
  }

  const observer = new MutationObserver(function () {
    const login = document.getElementById('sisgopLoginOverlay');
    if (login) addChangePasswordButton(login);
    const loginV3 = document.getElementById('sisgopLoginOverlayV3');
    if (loginV3) addChangePasswordButton(loginV3);
    if (document.getElementById('homeScreen')?.classList.contains('active')) addLogoutCard();
    removeOldBadge();
  });

  if (document.body) observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  document.addEventListener('DOMContentLoaded', function () {
    addLogoutCard();
    removeOldBadge();
  });
})();