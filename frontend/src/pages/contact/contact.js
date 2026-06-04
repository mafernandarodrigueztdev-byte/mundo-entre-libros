//? Israel: Validación de datos de entrada

//? Rodrigo: Formspree
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
