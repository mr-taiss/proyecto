/* SISGOP - puerta de acceso obligatoria */
(function () {
  function hasSession() {
    return !!localStorage.getItem("sisgop_current_user");
  }

  function openLogin() {
    localStorage.removeItem("sisgop_current_user");

    let box = document.getElementById("sisgopLoginOverlay");
    if (!box) {
      box = document.createElement("div");
      box.id = "sisgopLoginOverlay";
      box.style.cssText = "position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(135deg,#eef4ff,#f8fbff);font-family:Arial,sans-serif;box-sizing:border-box";
      box.innerHTML = `<div style="width:min(440px,100%);background:white;border-radius:22px;padding:32px;box-shadow:0 18px 50px rgba(20,40,80,.16);box-sizing:border-box"><div style="text-align:center;margin-bottom:24px"><div style="font-size:42px">🔐</div><h1 style="margin:8px 0 4px;color:#183b68">SISGOP</h1><p style="margin:0;color:#667085">Acceso personal · 6to B</p></div><form id="sisgopLoginForm"><label style="display:block;margin:14px 0 7px;font-weight:700;color:#334155">Estudiante</label><input id="sisgopLoginUser" autocomplete="username" placeholder="Escribe tu nombre (ej. tais)" required style="width:100%;padding:13px;border:1px solid #ccd5e1;border-radius:10px;box-sizing:border-box;font-size:15px"><label style="display:block;margin:14px 0 7px;font-weight:700;color:#334155">Contraseña</label><input id="sisgopLoginPassword" type="password" autocomplete="current-password" placeholder="Tu contraseña" required style="width:100%;padding:13px;border:1px solid #ccd5e1;border-radius:10px;box-sizing:border-box;font-size:15px"><div id="sisgopLoginMessage" style="min-height:22px;margin:12px 0;font-size:14px"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:10px;background:#245ea8;color:white;font-weight:700;font-size:15px;cursor:pointer">ENTRAR</button></form></div>`;
      document.body.appendChild(box);
      document.getElementById("sisgopLoginForm").addEventListener("submit", function (event) {
        event.preventDefault();
        if (typeof window.loginSISGOP === "function") window.loginSISGOP();
      });
    }
    box.style.display = "flex";
    document.querySelectorAll(".page").forEach(function (page) { page.classList.remove("active"); });
    document.getElementById("sisgopLoginUser").value = "";
    document.getElementById("sisgopLoginPassword").value = "";
    document.getElementById("sisgopLoginMessage").textContent = "";
    document.getElementById("sisgopLoginUser").focus();
  }

  function guardHome() {
    if (!hasSession()) {
      document.querySelectorAll(".page").forEach(function (page) { page.classList.remove("active"); });
      openLogin();
      return false;
    }
    return true;
  }

  function enforceGate() {
    window.enterSystem = openLogin;
    window.showSISGOPLogin = openLogin;

    const originalOpenHome = window.openHome;
    if (typeof originalOpenHome === "function" && !originalOpenHome.__sisgopGuarded) {
      const guardedOpenHome = function () {
        if (!guardHome()) return;
        return originalOpenHome.apply(this, arguments);
      };
      guardedOpenHome.__sisgopGuarded = true;
      window.openHome = guardedOpenHome;
    }

    const button = document.querySelector(".backpack-entry");
    if (button) {
      button.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        openLogin();
      };
    }

    if (!hasSession()) {
      const home = document.getElementById("homeScreen");
      if (home) home.classList.remove("active");
    }
  }

  enforceGate();
  document.addEventListener("DOMContentLoaded", enforceGate);
  setTimeout(enforceGate, 0);
  setTimeout(enforceGate, 250);
  setTimeout(enforceGate, 1000);

  document.addEventListener("click", function (event) {
    const button = event.target.closest && event.target.closest(".backpack-entry");
    if (button) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openLogin();
      return;
    }

    const homeTarget = event.target.closest && event.target.closest("#homeScreen");
    if (homeTarget && !hasSession()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openLogin();
    }
  }, true);

  // Si cualquier código intenta activar homeScreen sin autenticación, se vuelve al login.
  const observer = new MutationObserver(function () {
    if (!hasSession()) {
      const home = document.getElementById("homeScreen");
      if (home && home.classList.contains("active")) {
        home.classList.remove("active");
        openLogin();
      }
    }
  });

  function startObserver() {
    if (document.body) observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["class"] });
  }
  if (document.body) startObserver();
  document.addEventListener("DOMContentLoaded", startObserver, { once: true });
})();
