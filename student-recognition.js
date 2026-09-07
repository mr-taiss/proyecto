/* Reconocimiento de estudiantes de 6to B + acceso SISGOP de respaldo */
(function () {
  const STUDENTS = [
    "PEREYRA MARIA RENE","ACUÑA BARRIOS DIANA CAMILA","AGRADA LEZANO JHANA FABIANE","ANIBARRO MONTELLANO MATEO GAEL","APARICIO NAVIA MARIA FERNANDA","ARANCIBIA LLUEN SAMANTA GUADALUPE","AYLLON TELLEZ GABRIELA BELEN","BARRIGA VILLCA LIZETH","BUEZO VALDA MARCELO BENJAMIN","CESPEDES ARANCIBIA FABIO EMMANUEL","CHAMBI ESPINOZA ARIANA AYLIN","CIVERA LOZADA HENRRY MAURICIO","COA LOAYZA NATALIA","COTRINO CHABARRIA ANGELA NATALY","DAZA BARRIENTOS CAMILA DE LOS ANGELES","DAZA MANCILLA ANA EMILIA","DELGADO COPA NATALIA ANDREA","GEMIO FERNANDEZ DIANA BRENDA","GONZALES PANIAGUA DYLAN JEREMY","JESUS SANABRIA IGNACIO ANTONIO","MALDONADO RAMIREZ ANELID ESTHER","MARIN CERVANTES GISSEL PAOLA","MENDEZ CARRASCO IVAN BENIGNO","MONTOYA RAMOS KAMILAH TAIS","OBLITAS CORONADO JUAN SAMUEL","ORTUSTE URQUIZU ANA CECILIA","PARADA GONZALES MARIANA","PEREZ FLORES CARLOS FABIAN","RAMIREZ SIÑANI HUGO JOSE MANUEL","ROCHA LOPEZ ALEJANDRA EDITH","RODRIGUEZ APARICIO SAMANTA","SERRUDO ORTIZ SAMANTA VIOLETA","TEJERINA PACO JUDITH AMAYA","VEDIA DURAN ANTHON SEBASTIAN","VEGA VALDEZ IKER HOLZEN","VILLEGAS ARANCIBIA CAMILA RENATA","ZARCILLO ROJAS ANGELA MARIELA"
  ];

  const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-ZÑ ]/g, " ").replace(/\s+/g, " ").trim();

  function recognize(value) {
    const text = normalize(value);
    if (!text) return null;
    const exact = STUDENTS.find(name => normalize(name) === text);
    if (exact) return exact;
    const words = text.split(" ").filter(Boolean);
    const matches = STUDENTS.filter(name => words.every(word => normalize(name).includes(word)));
    return matches.length === 1 ? matches[0] : null;
  }

  function setup() {
    const input = document.getElementById("studentName");
    const form = document.getElementById("objectForm");
    if (!input || !form) return;
    let message = document.getElementById("studentRecognitionMessage");
    if (!message) {
      message = document.createElement("small");
      message.id = "studentRecognitionMessage";
      input.parentElement.appendChild(message);
    }
    const check = () => {
      const value = input.value.trim();
      if (!value) { message.textContent = ""; input.style.borderColor = ""; input.setCustomValidity(""); return null; }
      const student = recognize(value);
      if (student) {
        input.value = student;
        message.textContent = "✓ Estudiante reconocido: " + student;
        message.style.color = "#2e7d4f";
        input.style.borderColor = "#79a987";
        input.setCustomValidity("");
        return student;
      }
      message.textContent = "✕ Estudiante no registrado en 6to B";
      message.style.color = "#b44b4b";
      input.style.borderColor = "#c77777";
      input.setCustomValidity("El estudiante no está registrado en 6to B.");
      return null;
    };
    input.addEventListener("input", check);
    input.addEventListener("blur", check);
    form.addEventListener("submit", event => {
      const value = input.value.trim();
      if (!value) return;
      const student = recognize(value);
      if (!student) { event.preventDefault(); event.stopImmediatePropagation(); check(); input.focus(); return; }
      input.value = student; input.setCustomValidity("");
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();

  /* FALLBACK DE ACCESO: funciona aunque auth.js/login-gate-v3.js fallen */
  const USERS = STUDENTS;
  const SESSION_KEY = "sisgop_current_user";
  const PASSWORDS_KEY = "sisgop_changed_passwords";
  const readPasswords = () => { try { return JSON.parse(localStorage.getItem(PASSWORDS_KEY) || "{}"); } catch { return {}; } };
  const findUser = value => {
    const text = normalize(value);
    if (!text) return null;
    let index = USERS.findIndex(n => normalize(n) === text);
    if (index < 0) {
      const matches = USERS.map((name,i)=>({name,i})).filter(x=>text.split(" ").every(w=>normalize(x.name).includes(w)));
      if (matches.length !== 1) return null;
      index = matches[0].i;
    }
    return { name: USERS[index], initial: `SISGOP${String(index + 1).padStart(3,"0")}` };
  };
  const openHome = () => {
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    document.getElementById("homeScreen")?.classList.add("active");
    if (typeof window.updateAll === "function") window.updateAll();
  };
  const showChangePassword = user => {
    document.getElementById("sisgopFallbackPassword")?.remove();
    const box=document.createElement("div"); box.id="sisgopFallbackPassword"; box.style.cssText="position:fixed;inset:0;z-index:2147483647;background:rgba(15,30,55,.72);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Segoe UI,Arial,sans-serif";
    box.innerHTML=`<div style="width:min(430px,100%);background:#fff;border-radius:22px;padding:30px;box-shadow:0 20px 70px rgba(0,0,0,.3)"><h2 style="color:#14233f;margin:0 0 8px">Crea tu nueva contraseña</h2><p style="color:#718099;font-size:13px;line-height:1.5">Debes cambiar la contraseña inicial antes de continuar.</p><form id="sisgopFallbackPasswordForm"><input id="fbNew" type="password" minlength="6" required placeholder="Nueva contraseña" style="width:100%;margin-top:18px;padding:13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box"><input id="fbConfirm" type="password" minlength="6" required placeholder="Repite la contraseña" style="width:100%;margin-top:10px;padding:13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box"><div id="fbMsg" style="min-height:22px;margin:12px 0;font-size:13px"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:9px;background:#14233f;color:#fff;font-weight:700;cursor:pointer">GUARDAR Y ENTRAR</button></form></div>`;
    document.body.appendChild(box);
    document.getElementById("sisgopFallbackPasswordForm").onsubmit=e=>{e.preventDefault();const a=fbNew.value,b=fbConfirm.value;if(a.length<6){fbMsg.textContent="La contraseña debe tener al menos 6 caracteres.";fbMsg.style.color="#b44b4b";return;}if(a!==b){fbMsg.textContent="Las contraseñas no coinciden.";fbMsg.style.color="#b44b4b";return;}if(a===user.initial){fbMsg.textContent="Elige una contraseña diferente a la inicial.";fbMsg.style.color="#b44b4b";return;}const all=readPasswords();all[normalize(user.name)]=a;localStorage.setItem(PASSWORDS_KEY,JSON.stringify(all));box.remove();openHome();};
  };
  const loginFallback = () => {
    const user=findUser(document.getElementById("sisgopFallbackUser")?.value); const pass=document.getElementById("sisgopFallbackPass")?.value||""; const msg=document.getElementById("sisgopFallbackMsg"); const saved=readPasswords(); const expected=user?(saved[normalize(user.name)]||user.initial):"";
    if(!user || pass!==expected){msg.textContent="Usuario o contraseña incorrectos.";msg.style.color="#b44b4b";return;}
    localStorage.setItem(SESSION_KEY,user.name); document.getElementById("sisgopFallbackLogin")?.remove();
    if(!saved[normalize(user.name)]) showChangePassword(user); else openHome();
  };
  const showFallbackLogin = () => {
    localStorage.removeItem(SESSION_KEY); document.querySelectorAll(".page").forEach(p=>p.classList.remove("active")); document.getElementById("sisgopFallbackLogin")?.remove();
    const box=document.createElement("div"); box.id="sisgopFallbackLogin"; box.style.cssText="position:fixed;inset:0;z-index:2147483647;background:linear-gradient(135deg,#edf3fb,#f8fbff);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Segoe UI,Arial,sans-serif";
    box.innerHTML=`<div style="width:min(430px,100%);background:#fff;border-radius:22px;padding:30px;box-shadow:0 20px 70px rgba(20,40,80,.2)"><div style="text-align:center"><div style="font-size:44px">🔐</div><h1 style="margin:8px 0;color:#14233f">SISGOP</h1><p style="color:#718099;margin-bottom:22px">Acceso personal · 6to B</p></div><form id="sisgopFallbackForm"><label style="display:block;font-weight:700;font-size:13px;color:#334155;margin:12px 0 7px">Estudiante</label><input id="sisgopFallbackUser" autocomplete="username" placeholder="Escribe tu nombre completo" required style="width:100%;padding:13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box;font-size:14px"><label style="display:block;font-weight:700;font-size:13px;color:#334155;margin:14px 0 7px">Contraseña</label><div style="position:relative"><input id="sisgopFallbackPass" type="password" autocomplete="current-password" placeholder="Tu contraseña" required style="width:100%;padding:13px 48px 13px 13px;border:1px solid #ccd5e0;border-radius:9px;box-sizing:border-box;font-size:14px"><button type="button" id="sisgopFallbackEye" style="position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;background:none;cursor:pointer;font-size:20px">👁️</button></div><div id="sisgopFallbackMsg" style="min-height:22px;margin:12px 0;font-size:13px"></div><button type="submit" style="width:100%;padding:13px;border:0;border-radius:9px;background:#14233f;color:#fff;font-weight:700;cursor:pointer">ENTRAR AL SISTEMA</button><button type="button" id="sisgopFallbackBack" style="width:100%;margin-top:10px;padding:11px;border:0;background:transparent;color:#64748b;cursor:pointer">← Volver</button></form></div>`;
    document.body.appendChild(box);
    const pw=document.getElementById("sisgopFallbackPass"),eye=document.getElementById("sisgopFallbackEye"); eye.onclick=()=>{pw.type=pw.type==="password"?"text":"password";eye.textContent="👁️";};
    document.getElementById("sisgopFallbackBack").onclick=()=>{box.remove();document.getElementById("welcomeScreen")?.classList.add("active");};
    document.getElementById("sisgopFallbackForm").onsubmit=e=>{e.preventDefault();loginFallback();};
    document.getElementById("sisgopFallbackUser").focus();
  };
  window.showSISGOPLogin = window.showSISGOPLogin || showFallbackLogin;
  document.addEventListener("click",e=>{const b=e.target.closest?.(".backpack-entry");if(!b)return;e.preventDefault();e.stopImmediatePropagation();showFallbackLogin();},true);

  /* ESTILO DEL BLOQUE DE USUARIO: integrado al encabezado, no flotando en la esquina */
  const styleUserBadge = () => {
    if (document.getElementById("sisgopUserBadgeStyle")) return;
    const style = document.createElement("style");
    style.id = "sisgopUserBadgeStyle";
    style.textContent = `
      #sisgopUserBadge {
        position: fixed !important;
        top: 18px !important;
        right: 24px !important;
        z-index: 9998 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 10px 14px !important;
        border: 1px solid #dce2eb !important;
        border-radius: 14px !important;
        background: rgba(255,255,255,.96) !important;
        box-shadow: 0 8px 25px rgba(35,53,76,.10) !important;
        color: #24405f !important;
        font: 12px "Segoe UI",Arial,sans-serif !important;
        max-width: calc(100vw - 48px) !important;
      }
      #sisgopUserBadge strong {
        display: inline-flex !important;
        align-items: center !important;
        gap: 7px !important;
        color: #14233f !important;
        font-size: 11px !important;
        letter-spacing: .3px !important;
        white-space: nowrap !important;
      }
      #sisgopUserBadge strong::before { content: "👤"; font-size: 15px; }
      #sisgopUserBadge button {
        margin-left: 2px !important;
        padding: 5px 7px !important;
        border: 0 !important;
        border-radius: 7px !important;
        background: transparent !important;
        font: 600 10px "Segoe UI",Arial,sans-serif !important;
        cursor: pointer !important;
        transition: background .2s, transform .2s !important;
      }
      #sisgopUserBadge button:first-of-type { color: #245ea8 !important; }
      #sisgopUserBadge button:last-of-type { color: #a65353 !important; }
      #sisgopUserBadge button:hover { background: #edf3f9 !important; transform: translateY(-1px); }
      @media(max-width:700px){
        #sisgopUserBadge { top: 10px !important; right: 10px !important; padding: 8px 10px !important; gap: 4px !important; }
        #sisgopUserBadge strong { max-width: 180px !important; overflow: hidden !important; text-overflow: ellipsis !important; }
      }
    `;
    document.head.appendChild(style);
  };
  styleUserBadge();

  const loadAuth = () => {
    if (document.querySelector('script[data-sisgop-auth]')) return;
    const s = document.createElement("script");
    s.src = "auth.js?v=20260906";
    s.dataset.sisgopAuth = "1";
    document.head.appendChild(s);
  };
  loadAuth();
})();
