/* SISGOP - autenticación, cambio de contraseña y control de propietario */
(function () {
  const USERS = [
    ["PEREYRA MARIA RENE","SISGOP001"],["ACUÑA BARRIOS DIANA CAMILA","SISGOP002"],["AGRADA LEZANO JHANA FABIANE","SISGOP003"],["ANIBARRO MONTELLANO MATEO GAEL","SISGOP004"],["APARICIO NAVIA MARIA FERNANDA","SISGOP005"],["ARANCIBIA LLUEN SAMANTA GUADALUPE","SISGOP006"],["AYLLON TELLEZ GABRIELA BELEN","SISGOP007"],["BARRIGA VILLCA LIZETH","SISGOP008"],["BUEZO VALDA MARCELO BENJAMIN","SISGOP009"],["CESPEDES ARANCIBIA FABIO EMMANUEL","SISGOP010"],["CHAMBI ESPINOZA ARIANA AYLIN","SISGOP011"],["CIVERA LOZADA HENRRY MAURICIO","SISGOP012"],["COA LOAYZA NATALIA","SISGOP013"],["COTRINO CHABARRIA ANGELA NATALY","SISGOP014"],["DAZA BARRIENTOS CAMILA DE LOS ANGELES","SISGOP015"],["DAZA MANCILLA ANA EMILIA","SISGOP016"],["DELGADO COPA NATALIA ANDREA","SISGOP017"],["GEMIO FERNANDEZ DIANA BRENDA","SISGOP018"],["GONZALES PANIAGUA DYLAN JEREMY","SISGOP019"],["JESUS SANABRIA IGNACIO ANTONIO","SISGOP020"],["MALDONADO RAMIREZ ANELID ESTHER","SISGOP021"],["MARIN CERVANTES GISSEL PAOLA","SISGOP022"],["MENDEZ CARRASCO IVAN BENIGNO","SISGOP023"],["MONTOYA RAMOS KAMILAH TAIS","SISGOP024"],["OBLITAS CORONADO JUAN SAMUEL","SISGOP025"],["ORTUSTE URQUIZU ANA CECILIA","SISGOP026"],["PARADA GONZALES MARIANA","SISGOP027"],["PEREZ FLORES CARLOS FABIAN","SISGOP028"],["RAMIREZ SIÑANI HUGO JOSE MANUEL","SISGOP029"],["ROCHA LOPEZ ALEJANDRA EDITH","SISGOP030"],["RODRIGUEZ APARICIO SAMANTA","SISGOP031"],["SERRUDO ORTIZ SAMANTA VIOLETA","SISGOP032"],["TEJERINA PACO JUDITH AMAYA","SISGOP033"],["VEDIA DURAN ANTHON SEBASTIAN","SISGOP034"],["VEGA VALDEZ IKER HOLZEN","SISGOP035"],["VILLEGAS ARANCIBIA CAMILA RENATA","SISGOP036"],["ZARCILLO ROJAS ANGELA MARIELA","SISGOP037"]
  ].map(([name,password]) => ({name,password}));

  const SESSION_KEY = "sisgop_current_user";
  const PASSWORDS_KEY = "sisgop_changed_passwords";
  const OBJECTS_KEY = "sisgop_objects";

  const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-ZÑ ]/g, " ").replace(/\s+/g, " ").trim();
  const readPasswords = () => { try { return JSON.parse(localStorage.getItem(PASSWORDS_KEY) || "{}"); } catch { return {}; } };
  const findUser = value => {
    const text = normalize(value);
    if (!text) return null;
    const exact = USERS.find(user => normalize(user.name) === text);
    if (exact) return exact;
    const matches = USERS.filter(user => text.split(" ").filter(Boolean).every(word => normalize(user.name).includes(word)));
    return matches.length === 1 ? matches[0] : null;
  };
  const currentUser = () => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? findUser(saved) : null;
  };
  const getPassword = user => readPasswords()[normalize(user.name)] || user.password;
  const hasChangedPassword = user => Object.prototype.hasOwnProperty.call(readPasswords(), normalize(user.name));

  function showLogin() {
    localStorage.removeItem(SESSION_KEY);
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    document.getElementById("sisgopPasswordOverlay")?.remove();
    let box = document.getElementById("sisgopLoginOverlay");
    if (!box) {
      box = document.createElement("div");
      box.id = "sisgopLoginOverlay";
      box.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:linear-gradient(135deg,#edf3fb,#f8fbff);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Segoe UI,Arial,sans-serif";
      box.innerHTML = `<div style="width:min(430px,100%);background:#fff;border-radius:22px;padding:30px;box-shadow:0 20px 70px rgba(20,40,80,.2)"><div style="text-align:center"><div style="font-size:44px">🔐</div><h1 style="margin:8px 0;color:#14233f">SISGOP</h1><p style="color:#718099;margin-bottom:22px">Acceso personal · 6to B</p></div><form id="sisgopLoginForm"><label style="display:block;font-weight:700;font-size:13px;color:#334155;margin:12px 0 7px">Estudiante</label><input id="sisgopLoginUser" autocomplete="username" placeholder="Escribe tu nombre completo" required style="width:100%;padding:13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box;font-size:14px"><label style="display:block;font-weight:700;font-size:13px;color:#334155;margin:14px 0 7px">Contraseña</label><div style="position:relative"><input id="sisgopLoginPassword" type="password" autocomplete="current-password" placeholder="Tu contraseña" required style="width:100%;padding:13px 48px 13px 13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box;font-size:14px"><button type="button" id="sisgopEye" aria-label="Mostrar contraseña" style="position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;background:none;cursor:pointer;font-size:20px">👁️</button></div><div id="sisgopLoginMessage" style="min-height:22px;margin:12px 0;font-size:13px"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:9px;background:#14233f;color:#fff;font-weight:700;cursor:pointer">ENTRAR AL SISTEMA</button><button type="button" id="sisgopChangePasswordFromLogin" style="width:100%;margin-top:10px;padding:11px;border:1px solid #d7e0eb;border-radius:9px;background:#f5f8fc;color:#245ea8;font-weight:700;cursor:pointer">🔑 Cambiar contraseña</button><button type="button" id="sisgopLoginBack" style="width:100%;margin-top:10px;padding:11px;border:0;background:transparent;color:#64748b;cursor:pointer">← Volver</button></form></div>`;
      document.body.appendChild(box);
      document.getElementById("sisgopEye").onclick = () => {
        const input = document.getElementById("sisgopLoginPassword");
        input.type = input.type === "password" ? "text" : "password";
      };
      document.getElementById("sisgopLoginForm").onsubmit = event => { event.preventDefault(); login(); };
      document.getElementById("sisgopChangePasswordFromLogin").onclick = changePasswordFromLogin;
      document.getElementById("sisgopLoginBack").onclick = () => {
        box.remove();
        document.getElementById("welcomeScreen")?.classList.add("active");
      };
    }
    box.style.display = "flex";
    document.getElementById("sisgopLoginUser").value = "";
    document.getElementById("sisgopLoginPassword").value = "";
    document.getElementById("sisgopLoginPassword").type = "password";
    document.getElementById("sisgopLoginMessage").textContent = "";
    document.getElementById("sisgopLoginUser").focus();
  }

  function changePasswordFromLogin() {
    const user = findUser(document.getElementById("sisgopLoginUser")?.value);
    const password = document.getElementById("sisgopLoginPassword")?.value || "";
    const message = document.getElementById("sisgopLoginMessage");
    if (!user) { message.textContent = "Primero escribe tu nombre completo."; message.style.color = "#b44b4b"; return; }
    if (password !== getPassword(user)) { message.textContent = "Escribe primero tu contraseña actual."; message.style.color = "#b44b4b"; return; }
    localStorage.setItem(SESSION_KEY, user.name);
    document.getElementById("sisgopLoginOverlay")?.remove();
    showChangePassword(false);
  }

  function showChangePassword(force) {
    const user = currentUser();
    if (!user) { showLogin(); return; }
    document.getElementById("sisgopPasswordOverlay")?.remove();
    const box = document.createElement("div");
    box.id = "sisgopPasswordOverlay";
    box.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:rgba(15,30,55,.62);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Segoe UI,Arial,sans-serif";
    box.innerHTML = `<div style="width:min(430px,100%);background:#fff;border-radius:22px;padding:30px;box-shadow:0 20px 70px rgba(0,0,0,.25)"><div style="text-align:center"><div style="font-size:40px">🔑</div><h2 style="color:#14233f;margin:8px 0">${force ? "Crea tu nueva contraseña" : "Cambiar contraseña"}</h2><p style="color:#718099;font-size:13px;line-height:1.5">${force ? "Debes cambiar la contraseña inicial antes de continuar." : "Escribe una nueva contraseña para tu cuenta."}</p></div><form id="sisgopPasswordForm"><input id="sisgopNewPassword" type="password" minlength="6" required placeholder="Nueva contraseña (mínimo 6)" style="width:100%;margin-top:18px;padding:13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box"><input id="sisgopConfirmPassword" type="password" minlength="6" required placeholder="Repite la contraseña" style="width:100%;margin-top:10px;padding:13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box"><div id="sisgopPasswordMessage" style="min-height:22px;margin:12px 0;font-size:13px"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:9px;background:#14233f;color:#fff;font-weight:700;cursor:pointer">GUARDAR CONTRASEÑA</button>${force ? "" : "<button type=\"button\" id=\"sisgopPasswordBack\" style=\"width:100%;margin-top:10px;padding:10px;border:0;background:transparent;color:#64748b;cursor:pointer\">← Volver al acceso</button>"}</form></div>`;
    document.body.appendChild(box);
    document.getElementById("sisgopPasswordForm").onsubmit = event => {
      event.preventDefault();
      const a = document.getElementById("sisgopNewPassword").value;
      const b = document.getElementById("sisgopConfirmPassword").value;
      const message = document.getElementById("sisgopPasswordMessage");
      if (a.length < 6) { message.textContent = "La contraseña debe tener al menos 6 caracteres."; message.style.color = "#b44b4b"; return; }
      if (a !== b) { message.textContent = "Las contraseñas no coinciden."; message.style.color = "#b44b4b"; return; }
      if (a === user.password) { message.textContent = "Elige una contraseña diferente a la inicial."; message.style.color = "#b44b4b"; return; }
      const passwords = readPasswords();
      passwords[normalize(user.name)] = a;
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
      box.remove();
      enterHome();
    };
    document.getElementById("sisgopPasswordBack")?.addEventListener("click", () => { box.remove(); showLogin(); });
    document.getElementById("sisgopNewPassword").focus();
  }

  function login() {
    const user = findUser(document.getElementById("sisgopLoginUser")?.value);
    const password = document.getElementById("sisgopLoginPassword")?.value || "";
    const message = document.getElementById("sisgopLoginMessage");
    if (!user || password !== getPassword(user)) { message.textContent = "Usuario o contraseña incorrectos."; message.style.color = "#b44b4b"; return; }
    localStorage.setItem(SESSION_KEY, user.name);
    document.getElementById("sisgopLoginOverlay")?.remove();
    if (!hasChangedPassword(user)) { showChangePassword(true); return; }
    enterHome();
  }

  function enterHome() {
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    document.getElementById("homeScreen")?.classList.add("active");
    if (typeof window.updateAll === "function") window.updateAll();
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    document.getElementById("sisgopPasswordOverlay")?.remove();
    document.getElementById("sisgopLoginOverlay")?.remove();
    showLogin();
  }

  function ownerCanEdit(id) {
    const user = currentUser();
    if (!user) { showLogin(); return false; }
    let data = [];
    try { data = JSON.parse(localStorage.getItem(OBJECTS_KEY) || "[]"); } catch { data = []; }
    const object = data.find(item => String(item.id) === String(id));
    if (!object || object.owner !== user.name) {
      alert("Solo el estudiante que registró este objeto puede modificarlo.");
      return false;
    }
    return true;
  }

  function installGuards() {
    const form = document.getElementById("objectForm");
    if (form && !form.dataset.ownerGuard) {
      form.dataset.ownerGuard = "1";
      form.addEventListener("submit", () => setTimeout(() => {
        const user = currentUser();
        if (!user) return;
        let data = [];
        try { data = JSON.parse(localStorage.getItem(OBJECTS_KEY) || "[]"); } catch { return; }
        for (let i = data.length - 1; i >= 0; i--) {
          if (!data[i].owner) { data[i].owner = user.name; localStorage.setItem(OBJECTS_KEY, JSON.stringify(data)); break; }
        }
      }, 0));
    }
    ["editObject","deleteObject","markFound","markRecovered"].forEach(name => {
      const original = window[name];
      if (typeof original !== "function" || original.__sisgopWrapped) return;
      const wrapped = function (id) {
        if (!ownerCanEdit(id)) return;
        return original.apply(this, arguments);
      };
      wrapped.__sisgopWrapped = true;
      window[name] = wrapped;
    });
  }

  window.showSISGOPLogin = showLogin;
  window.enterSystem = showLogin;
  window.loginSISGOP = login;
  window.logoutSISGOP = logout;
  window.changePasswordSISGOP = () => showChangePassword(false);
  window.currentSISGOPUser = currentUser;

  document.addEventListener("click", event => {
    const entry = event.target.closest?.(".backpack-entry");
    if (!entry) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showLogin();
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installGuards, {once:true});
  } else {
    installGuards();
  }
})();
