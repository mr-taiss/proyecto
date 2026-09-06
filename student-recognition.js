/* Reconocimiento de estudiantes de 6to A */
(function () {
  const STUDENTS = [
    "PEREYRA MARIA RENE",
    "ACUÑA BARRIOS DIANA CAMILA",
    "AGRADA LEZANO JHANA FABIANE",
    "ANIBARRO MONTELLANO MATEO GAEL",
    "APARICIO NAVIA MARIA FERNANDA",
    "ARANCIBIA LLUEN SAMANTA GUADALUPE",
    "AYLLON TELLEZ GABRIELA BELEN",
    "BARRIGA VILLCA LIZETH",
    "BUEZO VALDA MARCELO BENJAMIN",
    "CESPEDES ARANCIBIA FABIO EMMANUEL",
    "CHAMBI ESPINOZA ARIANA AYLIN",
    "CIVERA LOZADA HENRRY MAURICIO",
    "COA LOAYZA NATALIA",
    "COTRINO CHABARRIA ANGELA NATALY",
    "DAZA BARRIENTOS CAMILA DE LOS ANGELES",
    "DAZA MANCILLA ANA EMILIA",
    "DELGADO COPA NATALIA ANDREA",
    "GEMIO FERNANDEZ DIANA BRENDA",
    "GONZALES PANIAGUA DYLAN JEREMY",
    "JESUS SANABRIA IGNACIO ANTONIO",
    "MALDONADO RAMIREZ ANELID ESTHER",
    "MARIN CERVANTES GISSEL PAOLA",
    "MENDEZ CARRASCO IVAN BENIGNO",
    "MONTOYA RAMOS KAMILAH TAIS",
    "OBLITAS CORONADO JUAN SAMUEL",
    "ORTUSTE URQUIZU ANA CECILIA",
    "PARADA GONZALES MARIANA",
    "PEREZ FLORES CARLOS FABIAN",
    "RAMIREZ SIÑANI HUGO JOSE MANUEL",
    "ROCHA LOPEZ ALEJANDRA EDITH",
    "RODRIGUEZ APARICIO SAMANTA",
    "SERRUDO ORTIZ SAMANTA VIOLETA",
    "TEJERINA PACO JUDITH AMAYA",
    "VEDIA DURAN ANTHON SEBASTIAN",
    "VEGA VALDEZ IKER HOLZEN",
    "VILLEGAS ARANCIBIA CAMILA RENATA",
    "ZARCILLO ROJAS ANGELA MARIELA"
  ];

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-ZÑ ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function recognize(value) {
    const text = normalize(value);
    if (!text) return null;

    const exact = STUDENTS.find((name) => normalize(name) === text);
    if (exact) return exact;

    const words = text.split(" ").filter(Boolean);
    const matches = STUDENTS.filter((name) => {
      const candidate = normalize(name);
      return words.every((word) => candidate.includes(word));
    });

    if (matches.length === 1) return matches[0];

    const compact = text.replace(/ /g, "");
    const compactMatches = STUDENTS.filter((name) =>
      normalize(name).replace(/ /g, "").includes(compact)
    );
    return compactMatches.length === 1 ? compactMatches[0] : null;
  }

  function setup() {
    const form = document.getElementById("objectForm");
    const input = document.getElementById("studentName");
    if (!form || !input) return;

    let message = document.getElementById("studentRecognitionMessage");
    if (!message) {
      message = document.createElement("small");
      message.id = "studentRecognitionMessage";
      message.style.display = "block";
      message.style.marginTop = "5px";
      message.style.fontSize = "11px";
      input.parentElement.appendChild(message);
    }

    function check(showError) {
      const value = input.value.trim();
      if (!value) {
        message.textContent = "";
        input.style.borderColor = "";
        input.setCustomValidity("");
        return null;
      }

      const student = recognize(value);
      if (student) {
        input.value = student;
        input.setCustomValidity("");
        input.style.borderColor = "#79a987";
        message.textContent = "✓ Estudiante reconocido";
        return student;
      }

      input.style.borderColor = "#c77777";
      message.textContent = showError ? "✕ Estudiante no registrado en 6to A" : "";
      input.setCustomValidity(showError ? "El estudiante no está registrado en 6to A." : "");
      return null;
    }

    input.addEventListener("input", () => check(false));
    input.addEventListener("blur", () => check(true));

    form.addEventListener("submit", (event) => {
      const value = input.value.trim();
      if (!value) return;

      const student = recognize(value);
      if (!student) {
        event.preventDefault();
        event.stopImmediatePropagation();
        check(true);
        input.focus();
        if (typeof window.showToast === "function") {
          window.showToast("El estudiante no está registrado en 6to A.", "error");
        }
        return;
      }

      input.value = student;
      input.setCustomValidity("");
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
