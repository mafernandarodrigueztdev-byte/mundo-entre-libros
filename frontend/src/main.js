document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("foros-populares");

  if (!contenedor) {
    console.error("No existe #foros-populares");
    return;
  }

  try {
    // 🔥 Cargar JSON
    const res = await fetch("/src/pages/forums/forums.json");

    if (!res.ok) {
      throw new Error("Error al cargar JSON: " + res.status);
    }

    const foros = await res.json();

    // 🔥 Ordenar por popularidad y tomar top 3
    const top3 = foros
      .sort((a, b) => b.miembros - a.miembros)
      .slice(0, 3);

    // 🔥 Limpiar contenedor
    contenedor.innerHTML = "";

    // 🔥 Renderizar cards
    top3.forEach(foro => {
      contenedor.innerHTML += `
        <div class="foro-card-mini">

          <!-- ICONO IZQUIERDA -->
          <div class="foro-icono">
            ${foro.icono}
          </div>

          <!-- CONTENIDO DERECHA -->
          <div class="foro-content">

            <h4>${foro.nombre}</h4>

            <p>${foro.descripcion}</p>

            <div class="foro-stats">
              👥 ${foro.miembros} &nbsp;&nbsp; 📝 ${foro.publicaciones}
            </div>

          </div>

        </div>
      `;
    });

  } catch (error) {
    console.error("Error cargando foros:", error);
  }
});