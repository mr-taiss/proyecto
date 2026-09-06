/* SISGOP - acceso obligatorio v3 */
(function () {
  const SESSION_KEY = "sisgop_current_user";

  function showLogin() {
    localStorage.removeItem(SESSION_KEY);
    document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });

    let overlay = document.getElementById("sisgopLoginOverlayV3");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "sisgopLoginOverlayV3";
      overlay.style.cssText = "position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;padding:24px;background:#eef4ff;font-family:Arial,sans-serif";
      overlay.innerHTML = '<div style="width:min(440px,100%);background:#fff;border-radius:22px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,.18)"><div style="text-align:center"><div style="font-size:42px">🔐</div><h1 style="margin:8px 0;color:#183b68">SISGOP</h1><p style="color:#667085">Acceso personal · 6to B</p></div><form id="sisgopLoginFormV3"><label style="display:block;font-weight:700;margin-top:16px">Estudiante</label><input id="sisgopLoginUserV3" required autocomplete="username" placeholder="Escribe tu nombre" style="width:100%;padding:13px;margin-top:7px;box-sizing:border-box;border:1px solid #ccd5e1;border-radius:10px"><label style="display:block;font-weight:700;margin-top:16px">Contraseña</label><input id="sisgopLoginPasswordV3" required type="password" autocomplete="current-password" placeholder="Tu contraseña" style="width:100%;padding:13px;margin-top:7px;box-sizing:border-box;border:1px solid #ccd5e1;border-radius:10px"><div id="sisgopLoginMessageV3" style="min-height:22px;margin:12px 0"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:10px;background:#245ea8;color:#fff;font-weight:700;cursor:pointer">ENTRAR</button></form></div>';
      document.body.appendChild(overlay);
      overlay.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();
        if (typeof window.loginSISGOP === "function") {
          window.loginSISGOP();
        } else {
          document.getElementById("sisgopLoginMessageV3").textContent = "El acceso todavía está cargando. Recarga la página.";
        }
      });
    }
    overlay.style.display = "flex";
    document.getElementById("sisgopLoginUserV3").value = "";
    document.getElementById("sisgopLoginPasswordV3").value = "";
    document.getElementById("sisgopLoginMessageV3").textContent = "";
    document.getElementById("sisgopLoginUserV3").focus();
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
