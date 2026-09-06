/* Reconocimiento de estudiantes de 6to A */
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
    const matches = STUDENTS.filter(name => {
      const candidate = normalize(name);
      return words.every(word => candidate.includes(word));
    });

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
      if (!value) {
        message.textContent = "";
        input.style.borderColor = "";
        input.setCustomValidity("");
        return null;
      }

      const student = recognize(value);
      if (student) {
        input.value = student;
        message.textContent = "✓ Estudiante reconocido: " + student;
        message.style.color = "#2e7d4f";
        input.style.borderColor = "#79a987";
        input.setCustomValidity("");
        return student;
      }

      message.textContent = "✕ Estudiante no registrado en 6to A";
      message.style.color = "#b44b4b";
      input.style.borderColor = "#c77777";
      input.setCustomValidity("El estudiante no está registrado en 6to A.");
      return null;
    };

    input.addEventListener("input", check);
    input.addEventListener("blur", check);

    form.addEventListener("submit", event => {
      const value = input.value.trim();
      if (!value) return;
      const student = recognize(value);
      if (!student) {
        event.preventDefault();
        event.stopImmediatePropagation();
        check();
        input.focus();
        return;
      }
      input.value = student;
      input.setCustomValidity("");
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
