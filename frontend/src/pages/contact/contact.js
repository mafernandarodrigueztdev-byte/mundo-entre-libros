//? Israel: Validación de datos de entrada
// 1.
document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.querySelector("#contactForm");
  if (!contactForm) return;

  // 1. Inyecte los estilos CSS directamente desde JS (Así no toco el contact.css)
  const style = document.createElement("style");
  style.innerHTML = `
        .invalid-feedback-js { display: none; color: #d9534f; font-size: 0.95rem; margin-top: 5px; font-weight: 600; }
        .is-invalid-js { border-color: #d9534f !important; box-shadow: 0 0 0 3px rgba(217, 83, 79, 0.1) !important; }
        .is-valid-js { border-color: #2e5a44 !important; box-shadow: 0 0 0 3px rgba(46, 90, 68, 0.1) !important; }
        .is-invalid-js ~ .invalid-feedback-js { display: block; }
        .char-counter-js { display: block; text-align: right; font-size: 0.9rem; color: rgba(82, 31, 18, 0.7); margin-top: 4px; font-weight: 600; }
    `;
  document.head.appendChild(style);

  // 2. Inyecte los mensajes de error y el contador en el HTML dinámicamente
  const camposData = [
    {
      id: "userName",
      error:
        "El nombre debe tener al menos 3 caracteres y solo contener letras.",
    },
    {
      id: "userEmail",
      error: "Por favor, ingresa un correo electrónico válido.",
    },
    {
      id: "userPhone",
      error: "El teléfono debe contener exactamente 10 números.",
    },
    // --- NUEVO: Mensaje de error para el asunto ---
    {
      id: "subject",
      error:
        "El asunto debe tener máximo 50 caracteres y no usar caracteres invalidos.",
    },
    // --- ACTUALIZADO: Mensaje de error limitando caracteres y símbolos ---
    {
      id: "message",
      error:
        "El mensaje debe tener entre 10 y 1000 caracteres, y no usar caracteres invalidos.",
    },
  ];

  camposData.forEach((campo) => {
    const input = document.getElementById(campo.id);
    if (input) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "invalid-feedback-js";
      errorDiv.textContent = campo.error;
      input.parentElement.appendChild(errorDiv); // Lo coloca debajo del input
    }
  });

  const messageInput = document.getElementById("message");
  const charCountSpan = document.createElement("span");
  charCountSpan.className = "char-counter-js";
  // --- ACTUALIZADO: Contador con límite visual ---
  charCountSpan.textContent = "0 / 1000 caracteres (Mínimo 10)";

  if (messageInput) {
    // Coloca el contador justo después del text area
    messageInput.parentNode.insertBefore(
      charCountSpan,
      messageInput.nextSibling,
    );
  }

  // 3. Lógica de validación (Reglas estandarizadas)
  const inputs = {
    name: document.getElementById("userName"),
    email: document.getElementById("userEmail"),
    phone: document.getElementById("userPhone"),
    subject: document.getElementById("subject"), // --- NUEVO ---
    message: messageInput,
  };

  const regexName = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/; // Solo letras
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regexPhone = /^\d{10}$/; // Exactamente 10 dígitos
  const regexSafeText = /^[^<>]+$/; // --- NUEVO: Bloquea XSS (Evita inyecciones)(< y >) ---

  // --- ACTUALIZADO: Se añadieron parámetros para máximo de letras ---
  function validarInput(
    input,
    regex,
    minLength = 0,
    maxLength = Infinity,
    isRequired = true,
  ) {
    if (!input) return true; // Validación de seguridad por si no encuentra el input

    const value = input.value.trim();
    let isValid = true;

    if (value.length === 0) {
      isValid = !isRequired; // Si está vacío, solo es válido si NO es requerido
    } else {
      if (value.length < minLength || value.length > maxLength) {
        isValid = false;
      } else if (regex && !regex.test(value)) {
        isValid = false;
      }
    }

    // Aplicamos las clases CSS inyectadas previamente
    if (isValid || (value.length === 0 && !isRequired)) {
      input.classList.remove("is-invalid-js");
      if (value.length > 0) input.classList.add("is-valid-js");
    } else {
      input.classList.remove("is-valid-js");
      input.classList.add("is-invalid-js");
    }
    return isValid;
  }

  // Validación en tiempo real para: Nombre, Correo electrónico, Teléfono de contacto
  if (inputs.name)
    inputs.name.addEventListener("input", () =>
      validarInput(inputs.name, regexName, 3, 100, true),
    );
  if (inputs.email)
    inputs.email.addEventListener("input", () =>
      validarInput(inputs.email, regexEmail, 5, 100, true),
    );
  if (inputs.phone)
    inputs.phone.addEventListener("input", () =>
      validarInput(inputs.phone, regexPhone, 10, 10, true),
    );
  // --- NUEVO: Validación del Asunto en tiempo real ---
  if (inputs.subject)
    inputs.subject.addEventListener("input", () =>
      validarInput(inputs.subject, regexSafeText, 0, 50, false),
    );
  // --- NUEVO: Validación del Mensaje ---
  if (inputs.message) {
    inputs.message.addEventListener("input", () => {
      const length = inputs.message.value.trim().length;
      charCountSpan.textContent = `${length} / 1000 caracteres (Mínimo 10)`;

      // --- NUEVO: Detecta símbolos peligrosos para no pintar de verde ---
      const tieneCaracteresPeligrosos = /[<>]/.test(inputs.message.value);

      // Cambia el color si cumple el requisito y no es peligroso
      if (length >= 10 && length <= 1000 && !tieneCaracteresPeligrosos) {
        charCountSpan.style.color = "#2e5a44";
      } else {
        charCountSpan.style.color = "rgba(255, 51, 0, 0.7)";
      }
      validarInput(inputs.message, regexSafeText, 10, 1000, true);
    });
  }

  // 4. Intercepción del envío (Para que no choque con Formspree ni sweetalert)
  contactForm.addEventListener("submit", (event) => {
    // --- NUEVO: Autocompletar asunto vacío ---
    if (inputs.subject && inputs.subject.value.trim() === "") {
      inputs.subject.value = "(sin asunto)";
    }

    const isNameValid = validarInput(inputs.name, regexName, 3, 100, true);
    const isEmailValid = validarInput(inputs.email, regexEmail, 5, 100, true);
    const isPhoneValid = validarInput(inputs.phone, regexPhone, 10, 10, true);
    const isSubjectValid = validarInput(
      inputs.subject,
      regexSafeText,
      0,
      50,
      false,
    ); // --- NUEVO ---
    const isMessageValid = validarInput(
      inputs.message,
      regexSafeText,
      10,
      1000,
      true,
    );

    // Si hay errores, frenamos todo
    if (
      !isNameValid ||
      !isEmailValid ||
      !isPhoneValid ||
      !isSubjectValid ||
      !isMessageValid
    ) {
      event.preventDefault(); // Evita que recargue la página
      event.stopImmediatePropagation(); // Clave (Cuando las validaciones fallan.)

      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "warning",
          title: "Datos incorrectos",
          // --- ACTUALIZADO: Mensaje de alerta general ---
          text: "Por favor, corrige los campos marcados en rojo antes de enviar. Asegúrate de no usar símbolos como < o >.",
          confirmButtonText: "Corregir",
          confirmButtonColor: "#4B1D13",
          background: "#F6EBD9",
          color: "#521F12",
        });
      } else {
        alert(
          "Por favor, corrige los campos marcados en rojo antes de enviar.",
        );
      }
    }
    // cierre del if
  }); // cierre del contactForm.addEventListener("submit", (event) => {
}); //cierre del document.addEventListener("DOMContentLoaded", () => {

// -- Hasta aqui termina la validación de datos de entrada --

//? Rodrigo: Formsprgit merge mainee
// 1. Se define la función de envío asíncrono hacia tu Endpoint de Formspree
async function enviarAFormspree(form) {
  const url = "https://formspree.io/f/mjgdbgaw";
  const formData = new FormData(form);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Error al enviar a Formspree");
  }

  return response.json();
}

// 2. Interceptamos el flujo del submit para cambiar la simulación por el envío real
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#contactForm");
  if (form) {
    form.addEventListener("submit", async (event) => {
      // Detenemos el envío inmediato para procesar la promesa de Formspree
      event.preventDefault();

      // Intentamos el envío real
      try {
        await enviarAFormspree(form);
        // Si el envío es exitoso, dejamos que el flujo continúe visualmente con el SweetAlert de Mafer de abajo
      } catch (error) {
        console.error("Error detectado en sección Rodrigo:", error);
        // Forzamos un quiebre para que no salte el éxito por defecto si falla la red
        window.formspreeError = true;
      }
    });
  }
});

/* ==========================================================================
   ?FORMULARIO DE CONTACTO - SWEETALERT: Mafer
   Esta sección sólo se encarga de:
   1. Evitar que el formulario ensucie la URL.
   2. Mostrar SweetAlert de confirmación.
   3. Mostrar SweetAlert de error si fuera necesario.
   4. Limpiar el formulario después de enviar.

   Nota:
   La validación real de datos será integrada por Israel.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.querySelector("#contactForm");

  if (!contactForm) {
    console.error("No se encontró el formulario con id='contactForm'.");
    return;
  }

  /* --------------------------------------------------------------------------
     SweetAlert de éxito
     Se muestra cuando el envío simulado del formulario fue correcto.
     -------------------------------------------------------------------------- */
  function showContactSuccess() {
    return Swal.fire({
      icon: "success",
      title: "Mensaje enviado",
      text: "Gracias por contactarnos. Te responderemos lo antes posible.",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#4B1D13",
      background: "#F6EBD9",
      color: "#521F12",
    });
  }

  /* --------------------------------------------------------------------------
     SweetAlert de error
     Esta función queda lista para que después tu compañero la use con validación.
     -------------------------------------------------------------------------- */
  function showContactError(
    message = "Ocurrió un error al registrar tu mensaje. Inténtalo nuevamente.",
  ) {
    return Swal.fire({
      icon: "error",
      title: "No se pudo enviar",
      text: message,
      confirmButtonText: "Entendido",
      confirmButtonColor: "#4B1D13",
      background: "#F6EBD9",
      color: "#521F12",
    });
  }

  /* --------------------------------------------------------------------------
     Envío temporal del formulario
     Esta es la prueba visual de SweetAlert.
     No valida datos ni envía información a backend.
     -------------------------------------------------------------------------- */
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    /*
       Limpia la URL en caso de que el navegador haya agregado parámetros
       como ?userName=...&userEmail=...
    */
    window.history.replaceState({}, document.title, window.location.pathname);

    /*
       Verifica que SweetAlert2 esté cargado.
       Si no está cargado, usa alert normal como respaldo.
    */
    if (typeof Swal === "undefined") {
      console.error(
        "SweetAlert2 no está cargado. Revisa el script CDN en tu HTML.",
      );
      alert("Mensaje enviado correctamente.");
      contactForm.reset();
      return;
    }

    /*
       MODIFICACIÓN COMPATIBLE CON RODRIGO:
       Si la petición de arriba falló, muestra error. Si no, muestra el éxito de Mafer.
    */
    if (window.formspreeError) {
      showContactError(
        "Hubo un problema al procesar los datos con Formspree. Inténtalo de nuevo.",
      );
      window.formspreeError = false; // Resetear bandera de error
      return;
    }

    /*
       PRUEBA TEMPORAL (Convertida en Real gracias a Rodrigo):
       Muestra alerta de éxito y limpia el formulario después de aceptar.
    */
    showContactSuccess().then(() => {
      contactForm.reset();
    });

    /*
       PRUEBA DE ERROR:
       Si necesitas probar el SweetAlert de error, comenta el bloque de éxito de arriba
       y descomenta este bloque.

       showContactError("Algo salió mal, intenta de nuevo por favor");
    */
  });
});
