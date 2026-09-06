/* SISGOP - cuentas de 6to B, cambio de contraseña y control de propietario */
(function () {
  const USERS = [
    ["PEREYRA MARIA RENE", "SISGOP001"],["ACUÑA BARRIOS DIANA CAMILA", "SISGOP002"],["AGRADA LEZANO JHANA FABIANE", "SISGOP003"],["ANIBARRO MONTELLANO MATEO GAEL", "SISGOP004"],["APARICIO NAVIA MARIA FERNANDA", "SISGOP005"],["ARANCIBIA LLUEN SAMANTA GUADALUPE", "SISGOP006"],["AYLLON TELLEZ GABRIELA BELEN", "SISGOP007"],["BARRIGA VILLCA LIZETH", "SISGOP008"],["BUEZO VALDA MARCELO BENJAMIN", "SISGOP009"],["CESPEDES ARANCIBIA FABIO EMMANUEL", "SISGOP010"],["CHAMBI ESPINOZA ARIANA AYLIN", "SISGOP011"],["CIVERA LOZADA HENRRY MAURICIO", "SISGOP012"],["COA LOAYZA NATALIA", "SISGOP013"],["COTRINO CHABARRIA ANGELA NATALY", "SISGOP014"],["DAZA BARRIENTOS CAMILA DE LOS ANGELES", "SISGOP015"],["DAZA MANCILLA ANA EMILIA", "SISGOP016"],["DELGADO COPA NATALIA ANDREA", "SISGOP017"],["GEMIO FERNANDEZ DIANA BRENDA", "SISGOP018"],["GONZALES PANIAGUA DYLAN JEREMY", "SISGOP019"],["JESUS SANABRIA IGNACIO ANTONIO", "SISGOP020"],["MALDONADO RAMIREZ ANELID ESTHER", "SISGOP021"],["MARIN CERVANTES GISSEL PAOLA", "SISGOP022"],["MENDEZ CARRASCO IVAN BENIGNO", "SISGOP023"],["MONTOYA RAMOS KAMILAH TAIS", "SISGOP024"],["OBLITAS CORONADO JUAN SAMUEL", "SISGOP025"],["ORTUSTE URQUIZU ANA CECILIA", "SISGOP026"],["PARADA GONZALES MARIANA", "SISGOP027"],["PEREZ FLORES CARLOS FABIAN", "SISGOP028"],["RAMIREZ SIÑANI HUGO JOSE MANUEL", "SISGOP029"],["ROCHA LOPEZ ALEJANDRA EDITH", "SISGOP030"],["RODRIGUEZ APARICIO SAMANTA", "SISGOP031"],["SERRUDO ORTIZ SAMANTA VIOLETA", "SISGOP032"],["TEJERINA PACO JUDITH AMAYA", "SISGOP033"],["VEDIA DURAN ANTHON SEBASTIAN", "SISGOP034"],["VEGA VALDEZ IKER HOLZEN", "SISGOP035"],["VILLEGAS ARANCIBIA CAMILA RENATA", "SISGOP036"],["ZARCILLO ROJAS ANGELA MARIELA", "SISGOP037"]
  ].map(([name, password]) => ({ name, password }));

  const SESSION_KEY = "sisgop_current_user";
  const PASSWORDS_KEY = "sisgop_changed_passwords";
  const OBJECTS_KEY = "sisgop_objects";
  const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-ZÑ ]/g, " ").replace(/\s+/g, " ").trim();
  const findUser = value => { const text = normalize(value); if (!text) return null; const exact = USERS.find(u => normalize(u.name) === text); if (exact) return exact; const matches = USERS.filter(u => text.split(" ").filter(Boolean).every(w => normalize(u.name).includes(w))); return matches.length === 1 ? matches[0] : null; };
  const changedPasswords = () => JSON.parse(localStorage.getItem(PASSWORDS_KEY) || "{}");
  const getPassword = user => changedPasswords()[normalize(user.name)] || user.password;
  const hasChangedPassword = user => Object.prototype.hasOwnProperty.call(changedPasswords(), normalize(user.name));
  const currentUser = () => { const saved = localStorage.getItem(SESSION_KEY); return saved ? findUser(saved) : null; };

  function showLogin() {
    let box = document.getElementById("sisgopLoginOverlay");
    if (!box) {
      box = document.createElement("div"); box.id = "sisgopLoginOverlay";
      box.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(135deg,#eef4ff,#f8fbff);font-family:Arial,sans-serif;box-sizing:border-box"><div style="width:min(440px,100%);background:white;border-radius:22px;padding:32px;box-shadow:0 18px 50px rgba(20,40,80,.16);box-sizing:border-box"><div style="text-align:center;margin-bottom:24px"><div style="font-size:42px">🔐</div><h1 style="margin:8px 0 4px;color:#183b68">SISGOP</h1><p style="margin:0;color:#667085">Acceso personal · 6to B</p></div><form id="sisgopLoginForm"><label style="display:block;margin:14px 0 7px;font-weight:700;color:#334155">Estudiante</label><input id="sisgopLoginUser" autocomplete="username" placeholder="Escribe tu nombre (ej. tais)" style="width:100%;padding:13px;border:1px solid #ccd5e1;border-radius:10px;box-sizing:border-box;font-size:15px"><label style="display:block;margin:14px 0 7px;font-weight:700;color:#334155">Contraseña</label><input id="sisgopLoginPassword" type="password" autocomplete="current-password" placeholder="Tu contraseña" style="width:100%;padding:13px;border:1px solid #ccd5e1;border-radius:10px;box-sizing:border-box;font-size:15px"><div id="sisgopLoginMessage" style="min-height:22px;margin:12px 0;font-size:14px"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:10px;background:#245ea8;color:white;font-weight:700;font-size:15px;cursor:pointer">ENTRAR</button><button type="button" id="sisgopLoginBack" style="width:100%;margin-top:10px;padding:12px;border:0;background:transparent;color:#526173;cursor:pointer">← Volver</button></form></div></div>`;
      document.body.appendChild(box);
      document.getElementById("sisgopLoginForm").addEventListener("submit", e => { e.preventDefault(); login(); });
      document.getElementById("sisgopLoginBack").addEventListener("click", () => { box.remove(); document.querySelectorAll(".page").forEach(p => p.classList.remove("active")); document.getElementById("welcomeScreen")?.classList.add("active"); });
    }
    box.style.display = "block";
    document.getElementById("sisgopLoginUser").value = ""; document.getElementById("sisgopLoginPassword").value = ""; document.getElementById("sisgopLoginMessage").textContent = "";
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active")); document.getElementById("sisgopLoginUser").focus();
  }

  function showChangePassword(force) {
    let box = document.getElementById("sisgopPasswordOverlay");
    if (!box) {
      box = document.createElement("div"); box.id = "sisgopPasswordOverlay";
      box.innerHTML = `<div style="position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,30,55,.55);font-family:Arial,sans-serif;box-sizing:border-box"><div style="width:min(440px,100%);background:white;border-radius:22px;padding:30px;box-shadow:0 20px 60px rgba(0,0,0,.25);box-sizing:border-box"><div style="text-align:center"><div style="font-size:40px">🔑</div><h2 style="margin:8px 0;color:#183b68">Crea tu nueva contraseña</h2><p id="sisgopPasswordHint" style="color:#667085;font-size:14px;line-height:1.5"></p></div><form id="sisgopPasswordForm"><label style="display:block;margin:14px 0 7px;font-weight:700;color:#334155">Nueva contraseña</label><input id="sisgopNewPassword" type="password" minlength="6" autocomplete="new-password" required placeholder="Mínimo 6 caracteres" style="width:100%;padding:13px;border:1px solid #ccd5e1;border-radius:10px;box-sizing:border-box;font-size:15px"><label style="display:block;margin:14px 0 7px;font-weight:700;color:#334155">Repite la contraseña</label><input id="sisgopConfirmPassword" type="password" minlength="6" autocomplete="new-password" required placeholder="Repite tu contraseña" style="width:100%;padding:13px;border:1px solid #ccd5e1;border-radius:10px;box-sizing:border-box;font-size:15px"><div id="sisgopPasswordMessage" style="min-height:22px;margin:12px 0;font-size:14px"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:10px;background:#245ea8;color:white;font-weight:700;font-size:15px;cursor:pointer">GUARDAR NUEVA CONTRASEÑA</button></form></div></div>`;
      document.body.appendChild(box);
      document.getElementById("sisgopPasswordForm").addEventListener("submit", e => { e.preventDefault(); changePassword(); });
    }
    const user = currentUser(); if (!user) return;
    document.getElementById("sisgopPasswordHint").textContent = force ? `Hola, ${user.name}. Por seguridad, debes cambiar la contraseña inicial antes de continuar.` : "Puedes cambiar tu contraseña cuando quieras.";
    document.getElementById("sisgopNewPassword").value = ""; document.getElementById("sisgopConfirmPassword").value = ""; document.getElementById("sisgopPasswordMessage").textContent = "";
    box.style.display = "flex"; document.getElementById("sisgopNewPassword").focus();
  }

  function changePassword() {
    const user = currentUser(); if (!user) return;
    const password = document.getElementById("sisgopNewPassword")?.value || ""; const confirm = document.getElementById("sisgopConfirmPassword")?.value || ""; const message = document.getElementById("sisgopPasswordMessage");
    if (password.length < 6) { message.textContent = "La contraseña debe tener al menos 6 caracteres."; message.style.color = "#b44b4b"; return; }
    if (password !== confirm) { message.textContent = "Las contraseñas no coinciden."; message.style.color = "#b44b4b"; return; }
    if (password === user.password) { message.textContent = "Elige una contraseña diferente a la inicial."; message.style.color = "#b44b4b"; return; }
    const passwords = changedPasswords(); passwords[normalize(user.name)] = password; localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    document.getElementById("sisgopPasswordOverlay").style.display = "none"; updateUserBadge();
    if (typeof window.openHome === "function") window.openHome();
    alert("Contraseña cambiada correctamente. Recuerda guardarla en un lugar seguro.");
  }

  function login() {
    const user = findUser(document.getElementById("sisgopLoginUser")?.value); const password = document.getElementById("sisgopLoginPassword")?.value || ""; const message = document.getElementById("sisgopLoginMessage");
    if (!user || password !== getPassword(user)) { if (message) { message.textContent = "Usuario o contraseña incorrectos."; message.style.color = "#b44b4b"; } return; }
    localStorage.setItem(SESSION_KEY, user.name); document.getElementById("sisgopLoginOverlay")?.remove(); updateUserBadge();
    if (!hasChangedPassword(user)) { showChangePassword(true); return; }
    if (typeof window.openHome === "function") window.openHome();
  }

  function logout() { localStorage.removeItem(SESSION_KEY); document.getElementById("sisgopUserBadge")?.remove(); showLogin(); }

  function ownerCanEdit(id) {
    const user = currentUser(); if (!user) { showLogin(); return false; }
    const data = JSON.parse(localStorage.getItem(OBJECTS_KEY) || "[]"); const object = data.find(o => String(o.id) === String(id));
    if (!object || object.owner !== user.name) { alert("Solo el estudiante que registró este objeto puede modificarlo."); return false; } return true;
  }

  function updateUserBadge() {
    const user = currentUser(); if (!user) return;
    let badge = document.getElementById("sisgopUserBadge");
    if (!badge) { badge = document.createElement("div"); badge.id = "sisgopUserBadge"; badge.style.cssText = "position:fixed;right:18px;top:18px;z-index:9998;background:#fff;padding:8px 12px;border-radius:12px;box-shadow:0 5px 18px rgba(0,0,0,.12);font:13px Arial;color:#24405f"; document.body.appendChild(badge); }
    badge.innerHTML = `<strong>${user.name}</strong> <button onclick="changePasswordSISGOP()" style="margin-left:8px;border:0;background:transparent;color:#245ea8;cursor:pointer">Cambiar contraseña</button><button onclick="logoutSISGOP()" style="margin-left:8px;border:0;background:transparent;color:#b44b4b;cursor:pointer">Salir</button>`;
  }

  // Al entrar desde la portada siempre se solicita el login. La sesión guardada no salta esta pantalla.
  window.enterSystem = function () { localStorage.removeItem(SESSION_KEY); showLogin(); };
  window.loginSISGOP = login; window.logoutSISGOP = logout; window.currentSISGOPUser = currentUser; window.changePasswordSISGOP = () => showChangePassword(false);
  window.__SISGOP_AUTH_READY = true;

  function installGuards() {
    const registerForm = document.getElementById("objectForm");
    if (registerForm && !registerForm.dataset.ownerGuard) {
      registerForm.dataset.ownerGuard = "1";
      registerForm.addEventListener("submit", () => { setTimeout(() => { const user = currentUser(); if (!user) return; const data = JSON.parse(localStorage.getItem(OBJECTS_KEY) || "[]"); const unowned = data.filter(o => !o.owner); if (unowned.length) { unowned[unowned.length - 1].owner = user.name; localStorage.setItem(OBJECTS_KEY, JSON.stringify(data)); } }, 0); });
    }
    ["editObject", "deleteObject", "markFound", "markRecovered"].forEach(name => { const original = window[name]; const marker = "__sisgopWrapped"; if (typeof original === "function" && !original[marker]) { const wrapped = function (id) { if (ownerCanEdit(id)) return original(id); }; wrapped[marker] = true; window[name] = wrapped; } });
    if (currentUser()) updateUserBadge();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installGuards); else installGuards();
})();
