/* SISGOP - acceso independiente para evitar bloqueos del botón de entrada */
(function () {
  const SESSION_KEY = "sisgop_current_user";
  const PASSWORDS_KEY = "sisgop_changed_passwords";
  const USERS = [
    "PEREYRA MARIA RENE","ACUÑA BARRIOS DIANA CAMILA","AGRADA LEZANO JHANA FABIANE","ANIBARRO MONTELLANO MATEO GAEL","APARICIO NAVIA MARIA FERNANDA","ARANCIBIA LLUEN SAMANTA GUADALUPE","AYLLON TELLEZ GABRIELA BELEN","BARRIGA VILLCA LIZETH","BUEZO VALDA MARCELO BENJAMIN","CESPEDES ARANCIBIA FABIO EMMANUEL","CHAMBI ESPINOZA ARIANA AYLIN","CIVERA LOZADA HENRRY MAURICIO","COA LOAYZA NATALIA","COTRINO CHABARRIA ANGELA NATALY","DAZA BARRIENTOS CAMILA DE LOS ANGELES","DAZA MANCILLA ANA EMILIA","DELGADO COPA NATALIA ANDREA","GEMIO FERNANDEZ DIANA BRENDA","GONZALES PANIAGUA DYLAN JEREMY","JESUS SANABRIA IGNACIO ANTONIO","MALDONADO RAMIREZ ANELID ESTHER","MARIN CERVANTES GISSEL PAOLA","MENDEZ CARRASCO IVAN BENIGNO","MONTOYA RAMOS KAMILAH TAIS","OBLITAS CORONADO JUAN SAMUEL","ORTUSTE URQUIZU ANA CECILIA","PARADA GONZALES MARIANA","PEREZ FLORES CARLOS FABIAN","RAMIREZ SIÑANI HUGO JOSE MANUEL","ROCHA LOPEZ ALEJANDRA EDITH","RODRIGUEZ APARICIO SAMANTA","SERRUDO ORTIZ SAMANTA VIOLETA","TEJERINA PACO JUDITH AMAYA","VEDIA DURAN ANTHON SEBASTIAN","VEGA VALDEZ IKER HOLZEN","VILLEGAS ARANCIBIA CAMILA RENATA","ZARCILLO ROJAS ANGELA MARIELA"
  ];
  const normalize = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-ZÑ ]/g, " ").replace(/\s+/g, " ").trim();
  function findUser(value) {
    const text = normalize(value);
    if (!text) return null;
    let i = USERS.findIndex(n => normalize(n) === text);
    if (i >= 0) return { name: USERS[i], initial: `SISGOP${String(i + 1).padStart(3, "0")}` };
    const matches = USERS.map((n, i) => ({ name:n, initial:`SISGOP${String(i+1).padStart(3,"0")}` })).filter(u => text.split(" ").every(w => normalize(u.name).includes(w)));
    return matches.length === 1 ? matches[0] : null;
  }
  function passwords() { try { return JSON.parse(localStorage.getItem(PASSWORDS_KEY) || "{}"); } catch { return {}; } }
  function userFromSession() { return findUser(localStorage.getItem(SESSION_KEY)); }
  function openHomeSafe() {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("homeScreen")?.classList.add("active");
    if (typeof window.updateAll === "function") window.updateAll();
    if (typeof window.updateUserBadge === "function") window.updateUserBadge();
  }
  function showLogin() {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("sisgopStandaloneLogin")?.remove();
    const box = document.createElement("div");
    box.id = "sisgopStandaloneLogin";
    box.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:linear-gradient(135deg,#edf3fb,#f8fbff);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Segoe UI,Arial,sans-serif";
    box.innerHTML = `<div style="width:min(430px,100%);background:#fff;border-radius:22px;padding:30px;box-shadow:0 20px 70px rgba(20,40,80,.2)"><div style="text-align:center"><div style="font-size:44px">🔐</div><h1 style="margin:8px 0;color:#14233f">SISGOP</h1><p style="color:#718099;margin-bottom:22px">Acceso personal · 6to B</p></div><form id="standaloneLoginForm"><label style="display:block;font-weight:700;font-size:13px;color:#334155;margin:12px 0 7px">Estudiante</label><input id="standaloneUser" autocomplete="username" placeholder="Escribe tu nombre completo" required style="width:100%;padding:13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box;font-size:14px"><label style="display:block;font-weight:700;font-size:13px;color:#334155;margin:14px 0 7px">Contraseña</label><div style="position:relative"><input id="standalonePassword" type="password" autocomplete="current-password" placeholder="Tu contraseña" required style="width:100%;padding:13px 48px 13px 13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box;font-size:14px"><button type="button" id="standaloneEye" aria-label="Mostrar contraseña" style="position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;background:none;cursor:pointer;font-size:20px">👁️</button></div><div id="standaloneMessage" style="min-height:22px;margin:12px 0;font-size:13px"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:9px;background:#14233f;color:#fff;font-weight:700;cursor:pointer">ENTRAR AL SISTEMA</button><button type="button" id="standaloneBack" style="width:100%;margin-top:10px;padding:11px;border:0;background:transparent;color:#64748b;cursor:pointer">← Volver</button></form></div>`;
    document.body.appendChild(box);
    const pw = document.getElementById("standalonePassword"), eye = document.getElementById("standaloneEye");
    eye.onclick = () => { pw.type = pw.type === "password" ? "text" : "password"; eye.textContent = "👁️"; };
    document.getElementById("standaloneBack").onclick = () => { box.remove(); document.getElementById("welcomeScreen")?.classList.add("active"); };
    document.getElementById("standaloneLoginForm").onsubmit = e => { e.preventDefault(); doLogin(); };
    document.getElementById("standaloneUser").focus();
  }
  function doLogin() {
    const name = document.getElementById("standaloneUser")?.value || "";
    const pass = document.getElementById("standalonePassword")?.value || "";
    const msg = document.getElementById("standaloneMessage");
    const user = findUser(name);
    const saved = passwords();
    const expected = user ? (saved[normalize(user.name)] || user.initial) : "";
    if (!user || pass !== expected) { msg.textContent = "Usuario o contraseña incorrectos."; msg.style.color = "#b44b4b"; return; }
    localStorage.setItem(SESSION_KEY, user.name);
    document.getElementById("sisgopStandaloneLogin")?.remove();
    if (!saved[normalize(user.name)]) return forcePasswordChange(user);
    openHomeSafe();
  }
  function forcePasswordChange(user) {
    document.getElementById("sisgopPasswordStandalone")?.remove();
    const box = document.createElement("div"); box.id = "sisgopPasswordStandalone"; box.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:rgba(15,30,55,.62);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Segoe UI,Arial,sans-serif";
    box.innerHTML = `<div style="width:min(430px,100%);background:#fff;border-radius:22px;padding:30px;box-shadow:0 20px 70px rgba(0,0,0,.25)"><div style="text-align:center"><div style="font-size:40px">🔑</div><h2 style="color:#14233f;margin:8px 0">Crea tu nueva contraseña</h2><p style="color:#718099;font-size:13px;line-height:1.5">Debes cambiar la contraseña inicial antes de entrar al sistema.</p></div><form id="standaloneChangeForm"><input id="standaloneNew" type="password" minlength="6" required placeholder="Nueva contraseña (mínimo 6)" style="width:100%;margin-top:18px;padding:13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box"><input id="standaloneConfirm" type="password" minlength="6" required placeholder="Repite la contraseña" style="width:100%;margin-top:10px;padding:13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box"><div id="standaloneChangeMessage" style="min-height:22px;margin:12px 0;font-size:13px"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:9px;background:#14233f;color:#fff;font-weight:700;cursor:pointer">GUARDAR Y ENTRAR</button></form></div>`;
    document.body.appendChild(box);
    document.getElementById("standaloneChangeForm").onsubmit = e => { e.preventDefault(); const a=document.getElementById("standaloneNew").value,b=document.getElementById("standaloneConfirm").value,m=document.getElementById("standaloneChangeMessage"); if(a.length<6){m.textContent="La contraseña debe tener al menos 6 caracteres.";m.style.color="#b44b4b";return;} if(a!==b){m.textContent="Las contraseñas no coinciden.";m.style.color="#b44b4b";return;} if(a===user.initial){m.textContent="Elige una contraseña diferente a la inicial.";m.style.color="#b44b4b";return;} const all=passwords();all[normalize(user.name)]=a;localStorage.setItem(PASSWORDS_KEY,JSON.stringify(all));box.remove();openHomeSafe(); };
    document.getElementById("standaloneNew").focus();
  }
  window.showSISGOPLogin = showLogin;
  window.enterSystem = showLogin;
  document.addEventListener("click", e => { const b=e.target.closest?.(".backpack-entry"); if(!b)return; e.preventDefault(); e.stopImmediatePropagation(); showLogin(); }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { const b=document.querySelector(".backpack-entry"); if(b)b.onclick=e=>{e.preventDefault();showLogin();}; });
})();
