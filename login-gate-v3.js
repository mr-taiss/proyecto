/* SISGOP - acceso obligatorio */
(function () {
  const SESSION_KEY = "sisgop_current_user";
  const authLogin = window.enterSystem;

  function fixNamePlaceholder() {
    const input = document.getElementById("sisgopLoginUser");
    if (input) input.placeholder = "Escribe tu nombre completo";
    document.querySelectorAll('input[placeholder*="ej. tais"], input[placeholder*="ej tais"], input[placeholder*="Ej. tais"], input[placeholder*="Tais"]').forEach(function (el) {
      el.placeholder = "Escribe tu nombre completo";
    });
  }

  function showLogin() {
    localStorage.removeItem(SESSION_KEY);
    document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });

    if (typeof authLogin === "function") {
      authLogin();
      fixNamePlaceholder();
      setTimeout(fixNamePlaceholder, 0);
      setTimeout(fixNamePlaceholder, 50);
      setTimeout(fixNamePlaceholder, 300);
      return;
    }

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
    fixNamePlaceholder();
    if (!authenticated()) showLogin();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  setTimeout(init, 50);
  setTimeout(init, 500);
})();
