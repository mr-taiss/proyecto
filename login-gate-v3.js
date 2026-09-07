/* SISGOP - acceso obligatorio */
(function () {
  const SESSION_KEY = "sisgop_current_user";
  const authLogin = window.enterSystem;

  function showLogin() {
    localStorage.removeItem(SESSION_KEY);
    document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });

    // auth.js ya tiene el formulario y la lógica real de acceso.
    // Usamos su función original para evitar dos formularios distintos.
    if (typeof authLogin === "function") {
      authLogin();
      return;
    }

    // Si auth.js todavía está cargando, mostramos un aviso en lugar de dejar
    // el botón sin respuesta.
    let overlay = document.getElementById("sisgopLoginLoading");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "sisgopLoginLoading";
      overlay.style.cssText = "position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:#eef4ff;font-family:Arial,sans-serif";
      overlay.innerHTML = '<div style="background:#fff;padding:30px;border-radius:20px;box-shadow:0 15px 45px rgba(0,0,0,.15);text-align:center"><h2 style="color:#183b68">SISGOP</h2><p>El acceso está cargando...</p></div>';
      document.body.appendChild(overlay);
    }
  }

  function authenticated() {
    return !!localStorage.getItem(SESSION_KEY);
  }

  function protectHome() {
    if (!authenticated()) {
      const home = document.getElementById("homeScreen");
      if (home) home.classList.remove("active");
    }
  }

  window.showSISGOPLogin = showLogin;
  window.enterSystem = showLogin;

  document.addEventListener("click", function (e) {
    const button = e.target.closest && e.target.closest(".backpack-entry");
    if (button) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showLogin();
      return false;
    }
    const home = e.target.closest && e.target.closest("#homeScreen");
    if (home && !authenticated()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showLogin();
      return false;
    }
  }, true);

  function init() {
    protectHome();
    const button = document.querySelector(".backpack-entry");
    if (button) {
      button.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        showLogin();
        return false;
      };
    }
    if (!authenticated()) showLogin();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  setTimeout(init, 50);
  setTimeout(init, 500);
})();
