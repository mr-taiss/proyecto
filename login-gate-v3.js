/* SISGOP - acceso obligatorio */
(function () {
  const SESSION_KEY = "sisgop_current_user";

  function showLogin() {
    localStorage.removeItem(SESSION_KEY);
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const old = document.getElementById("sisgopLoginOverlay");
    if (old) old.remove();

    const box = document.createElement("div");
    box.id = "sisgopLoginOverlay");
    box.style.cssText = "position:fixed;inset:0;z-index:999999;background:#eef4ff;overflow:auto;font-family:Arial,sans-serif";
    box.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box"><div style="width:min(440px,100%);background:white;border-radius:22px;padding:32px;box-shadow:0 18px 50px rgba(20,40,80,.16);box-sizing:border-box"><div style="text-align:center;margin-bottom:24px"><div style="font-size:42px">🔐</div><h1 style="margin:8px 0 4px;color:#183b68">SISGOP</h1><p style="margin:0;color:#667085">Acceso personal · 6to B</p></div><form id="sisgopLoginForm"><label style="display:block;margin:14px 0 7px;font-weight:700;color:#334155">Estudiante</label><input id="sisgopLoginUser" autocomplete="username" placeholder="Escribe tu nombre completo" style="width:100%;padding:13px;border:1px solid #ccd5e1;border-radius:10px;box-sizing:border-box;font-size:15px"><label style="display:block;margin:14px 0 7px;font-weight:700;color:#334155">Contraseña</label><div style="position:relative"><input id="sisgopLoginPassword" type="password" autocomplete="current-password" placeholder="Tu contraseña" style="width:100%;padding:13px 46px 13px 13px;border:1px solid #ccd5e1;border-radius:10px;box-sizing:border-box;font-size:15px"><button type="button" id="togglePassword" aria-label="Mostrar contraseña" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:20px">👁️</button></div><div id="sisgopLoginMessage" style="min-height:22px;margin:12px 0;font-size:14px"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:10px;background:#245ea8;color:white;font-weight:700;font-size:15px;cursor:pointer">ENTRAR</button><button type="button" id="sisgopLoginBack" style="width:100%;margin-top:10px;padding:12px;border:0;background:transparent;color:#526173;cursor:pointer">← Volver</button></form></div></div>';
    document.body.appendChild(box);

    document.getElementById("togglePassword").onclick = function () {
      const p = document.getElementById("sisgopLoginPassword");
      p.type = p.type === "password" ? "text" : "password";
    };
    document.getElementById("sisgopLoginForm").onsubmit = function (e) {
      e.preventDefault();
      if (typeof window.loginSISGOP === "function") {
        window.loginSISGOP();
      } else {
        document.getElementById("sisgopLoginMessage").textContent = "El sistema de acceso todavía está cargando. Recarga la página.";
      }
    };
    document.getElementById("sisgopLoginBack").onclick = function () {
      box.remove();
      document.getElementById("welcomeScreen")?.classList.add("active");
    };
    document.getElementById("sisgopLoginUser").focus();
  }

  window.showSISGOPLogin = showLogin;

  document.addEventListener("click", function (e) {
    const button = e.target.closest && e.target.closest(".backpack-entry");
    if (!button) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    showLogin();
  }, true);

  function init() {
    const button = document.querySelector(".backpack-entry");
    if (button) {
      button.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        showLogin();
        return false;
      };
    }
    if (!localStorage.getItem(SESSION_KEY)) {
      document.getElementById("homeScreen")?.classList.remove("active");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();