document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("foros-lista");

  if (!contenedor) {
    console.error("No existe #foros-lista");
    return;
  }

  try {
    const res = await fetch("/src/pages/forums/forums.json");
    const foros = await res.json();

    contenedor.innerHTML = "";

    foros.forEach(foro => {
      contenedor.innerHTML += `
        <div class="foro-card">
          <h3>${foro.icono} ${foro.nombre}</h3>
          <p>${foro.descripcion}</p>

          <small>👥 ${foro.miembros} | 📝 ${foro.publicaciones}</small>

          <button class="btn-unirme">Unirme</button>
        </div>
      `;
    });

  } catch (error) {
    console.error("Error cargando foros:", error);
  }
});