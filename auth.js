/* SISGOP - cuentas de 6to B y control de propietario */
(function () {
  const USERS = [
    ["PEREYRA MARIA RENE", "SISGOP001"],
    ["ACUÑA BARRIOS DIANA CAMILA", "SISGOP002"],
    ["AGRADA LEZANO JHANA FABIANE", "SISGOP003"],
    ["ANIBARRO MONTELLANO MATEO GAEL", "SISGOP004"],
    ["APARICIO NAVIA MARIA FERNANDA", "SISGOP005"],
    ["ARANCIBIA LLUEN SAMANTA GUADALUPE", "SISGOP006"],
    ["AYLLON TELLEZ GABRIELA BELEN", "SISGOP007"],
    ["BARRIGA VILLCA LIZETH", "SISGOP008"],
    ["BUEZO VALDA MARCELO BENJAMIN", "SISGOP009"],
    ["CESPEDES ARANCIBIA FABIO EMMANUEL", "SISGOP010"],
    ["CHAMBI ESPINOZA ARIANA AYLIN", "SISGOP011"],
    ["CIVERA LOZADA HENRRY MAURICIO", "SISGOP012"],
    ["COA LOAYZA NATALIA", "SISGOP013"],
    ["COTRINO CHABARRIA ANGELA NATALY", "SISGOP014"],
    ["DAZA BARRIENTOS CAMILA DE LOS ANGELES", "SISGOP015"],
    ["DAZA MANCILLA ANA EMILIA", "SISGOP016"],
    ["DELGADO COPA NATALIA ANDREA", "SISGOP017"],
    ["GEMIO FERNANDEZ DIANA BRENDA", "SISGOP018"],
    ["GONZALES PANIAGUA DYLAN JEREMY", "SISGOP019"],
    ["JESUS SANABRIA IGNACIO ANTONIO", "SISGOP020"],
    ["MALDONADO RAMIREZ ANELID ESTHER", "SISGOP021"],
    ["MARIN CERVANTES GISSEL PAOLA", "SISGOP022"],
    ["MENDEZ CARRASCO IVAN BENIGNO", "SISGOP023"],
    ["MONTOYA RAMOS KAMILAH TAIS", "SISGOP024"],
    ["OBLITAS CORONADO JUAN SAMUEL", "SISGOP025"],
    ["ORTUSTE URQUIZU ANA CECILIA", "SISGOP026"],
    ["PARADA GONZALES MARIANA", "SISGOP027"],
    ["PEREZ FLORES CARLOS FABIAN", "SISGOP028"],
    ["RAMIREZ SIÑANI HUGO JOSE MANUEL", "SISGOP029"],
    ["ROCHA LOPEZ ALEJANDRA EDITH", "SISGOP030"],
    ["RODRIGUEZ APARICIO SAMANTA", "SISGOP031"],
    ["SERRUDO ORTIZ SAMANTA VIOLETA", "SISGOP032"],
    ["TEJERINA PACO JUDITH AMAYA", "SISGOP033"],
    ["VEDIA DURAN ANTHON SEBASTIAN", "SISGOP034"],
    ["VEGA VALDEZ IKER HOLZEN", "SISGOP035"],
    ["VILLEGAS ARANCIBIA CAMILA RENATA", "SISGOP036"],
    ["ZARCILLO ROJAS ANGELA MARIELA", "SISGOP037"]
  ].map(([name, password]) => ({ name, password }));

  const SESSION_KEY = "sisgop_current_user";
  const OBJECTS_KEY = "sisgop_objects";
  const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-ZÑ ]/g, " ").replace(/\s+/g, " ").trim();

  function findUser(value) {
    const text = normalize(value);
    if (!text) return null;
    const exact = USERS.find(u => normalize(u.name) === text);
    if (exact) return exact;
    const matches = USERS.filter(u => text.split(" ").filter(Boolean).every(w => normalize(u.name).includes(w)));
    return matches.length === 1 ? matches[0] : null;
  }

  function currentUser() {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? findUser(saved) : null;
  }

  function setMessage(text, ok) {
    const m = document.getElementById("loginMessage");
    if (!m) return;
    m.textContent = text;
    m.style.color = ok ? "#2e7d4f" : "#b44b4b";
  }

  function showLogin() {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const s = document.getElementById("loginScreen");
    if (s) s.classList.add("active");
    const user = document.getElementById("loginUser");
    const pass = document.getElementById("loginPassword");
    if (user) user.value = "";
    if (pass) pass.value = "";
    setMessage("", false);
    window.scrollTo(0, 0);
  }

  function login() {
    const user = findUser(document.getElementById("loginUser")?.value);
    const password = document.getElementById("loginPassword")?.value || "";
    if (!user || password !== user.password) {
      setMessage("Usuario o contraseña incorrectos.", false);
      return;
    }
    localStorage.setItem(SESSION_KEY, user.name);
    setMessage("", true);
    if (typeof window.openHome === "function") window.openHome();
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    showLogin();
  }

  function ownerCanEdit(id) {
    const user = currentUser();
    if (!user) {
      showLogin();
      return false;
    }
    const data = JSON.parse(localStorage.getItem(OBJECTS_KEY) || "[]");
    const object = data.find(o => String(o.id) === String(id));
    if (!object || object.owner !== user.name) {
      alert("Solo el estudiante que registró este objeto puede modificarlo.");
      return false;
    }
    return true;
  }

  window.enterSystem = function () {
    if (currentUser()) window.openHome();
    else showLogin();
  };
  window.loginSISGOP = login;
  window.logoutSISGOP = logout;
  window.currentSISGOPUser = currentUser;

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    if (form) form.addEventListener("submit", e => { e.preventDefault(); login(); });

    const back = document.getElementById("loginBack");
    if (back) back.addEventListener("click", () => {
      document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
      document.getElementById("welcomeScreen")?.classList.add("active");
    });

    const registerForm = document.getElementById("objectForm");
    if (registerForm) registerForm.addEventListener("submit", () => {
      setTimeout(() => {
        const user = currentUser();
        if (!user) return;
        const data = JSON.parse(localStorage.getItem(OBJECTS_KEY) || "[]");
        const unowned = data.filter(o => !o.owner);
        if (unowned.length) {
          unowned[unowned.length - 1].owner = user.name;
          localStorage.setItem(OBJECTS_KEY, JSON.stringify(data));
        }
      }, 0);
    });

    const originalEdit = window.editObject;
    if (typeof originalEdit === "function") {
      window.editObject = function (id) {
        if (ownerCanEdit(id)) originalEdit(id);
      };
    }
    const originalDelete = window.deleteObject;
    if (typeof originalDelete === "function") {
      window.deleteObject = function (id) {
        if (ownerCanEdit(id)) originalDelete(id);
      };
    }
    const originalFound = window.markFound;
    if (typeof originalFound === "function") {
      window.markFound = function (id) {
        if (ownerCanEdit(id)) originalFound(id);
      };
    }
    const originalRecovered = window.markRecovered;
    if (typeof originalRecovered === "function") {
      window.markRecovered = function (id) {
        if (ownerCanEdit(id)) originalRecovered(id);
      };
    }
  });
})();
