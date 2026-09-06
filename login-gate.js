/* SISGOP - puerta de acceso obligatoria */
(function () {
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
        if (typeof window.loginSISGOP === "function") {
          window.loginSISGOP();
        } else {
          document.getElementById("sisgopLoginMessage").textContent = "No se pudo cargar el sistema de acceso. Recarga la página.";
        }
      });
    }

    box.style.display = "flex";
    document.querySelectorAll(".page").forEach(function (page) { page.classList.remove("active"); });
    document.getElementById("sisgopLoginUser").value = "";
    document.getElementById("sisgopLoginPassword").value = "";
    document.getElementById("sisgopLoginMessage").textContent = "";
    document.getElementById("sisgopLoginUser").focus();
  }

  window.enterSystem = openLogin;
  window.showSISGOPLogin = openLogin;
})();
