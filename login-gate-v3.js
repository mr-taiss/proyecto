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
      overlay.innerHTML = '<div style="width:min(440px,100%);background:#fff;border-radius:22px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,.18)"><div style="text-align:center"><div style="font-size:42px">🔐</div><h1 style="margin:8px 0;color:#183b68">SISGOP</h1><p style="color:#667085">Acceso personal · 6to B</p></div><form id="sisgopLoginFormV3"><label style="display:block;font-weight:700;margin-top:16px">Estudiante</label><input id="sisgopLoginUserV3" required autocomplete="username" placeholder="Escribe tu nombre" style="width:100%;padding:13px;margin-top:7px;box-sizing:border-box;border:1px solid #ccd5e1;border-radius:10px"><label style="display:block;font-weight:700;margin-top:16px">Contraseña</label><div style="position:relative;margin-top:7px"><input id="sisgopLoginPasswordV3" required type="password" autocomplete="current-password" placeholder="Tu contraseña" style="width:100%;padding:13px 46px 13px 13px;box-sizing:border-box;border:1px solid #ccd5e1;border-radius:10px"><button type="button" id="sisgopTogglePasswordV3" aria-label="Mostrar contraseña" title="Mostrar contraseña" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:transparent;cursor:pointer;font-size:20px;padding:6px">👁️</button></div><div id="sisgopLoginMessageV3" style="min-height:22px;margin:12px 0"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:10px;background:#245ea8;color:#fff;font-weight:700;cursor:pointer">ENTRAR</button></form></div>';
      document.body.appendChild(overlay);

      overlay.querySelector("#sisgopTogglePasswordV3").addEventListener("click", function () {
        const password = document.getElementById("sisgopLoginPasswordV3");
        const visible = password.type === "text";
        password.type = visible ? "password" : "text";
        this.textContent = "👁️";
        this.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
        this.setAttribute("title", visible ? "Mostrar contraseña" : "Ocultar contraseña");
      });

      overlay.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();
        const user = document.getElementById("sisgopLoginUserV3");
        const password = document.getElementById("sisgopLoginPasswordV3");
        const message = document.getElementById("sisgopLoginMessageV3");
        const authUser = document.getElementById("sisgopLoginUser");
        const authPassword = document.getElementById("sisgopLoginPassword");
        if (authUser && authPassword && typeof window.loginSISGOP === "function") {
          authUser.value = user.value;
          authPassword.value = password.value;
          window.loginSISGOP();
        } else if (typeof window.loginSISGOP === "function") {
          window.loginSISGOP();
        } else {
          message.textContent = "El acceso todavía está cargando. Recarga la página.";
          message.style.color = "#b44b4b";
        }
      });
    }
    overlay.style.display = "flex";
    document.getElementById("sisgopLoginUserV3").value = "";
    document.getElementById("sisgopLoginPasswordV3").value = "";
    document.getElementById("sisgopLoginPasswordV3").type = "password";
    document.getElementById("sisgopTogglePasswordV3").textContent = "👁️";
    document.getElementById("sisgopTogglePasswordV3").setAttribute("aria-label", "Mostrar contraseña");
    document.getElementById("sisgopTogglePasswordV3").setAttribute("title", "Mostrar contraseña");
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
