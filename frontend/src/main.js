document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("foros-populares");

  if (!contenedor) {
    console.error("No existe #foros-populares");
    return;
  }

  try {
    // 🔥 Cargar JSON
    const res = await fetch("/data/forums.json");

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

/*Libros destacados */

document.addEventListener("DOMContentLoaded", () => {
    const trackLibros = document.getElementById("librosTrack");
    const btnLibroPrev = document.getElementById("btnLibroPrev");
    const btnLibroNext = document.getElementById("btnLibroNext");
    const ventanaLibros = document.querySelector(".libros-ventana");

    if (!trackLibros || !btnLibroPrev || !btnLibroNext || !ventanaLibros) return;

    let posicionLibro = 0;

    function obtenerMedidas() {
        const card = document.querySelector(".libro-card");
        const gap = 14;

        const anchoCard = card.offsetWidth + gap;

        // Máximo desplazamiento real permitido
        const maxScroll = trackLibros.scrollWidth - ventanaLibros.clientWidth;

        return { anchoCard, maxScroll };
    }

    function moverLibros() {
        const { anchoCard, maxScroll } = obtenerMedidas();

        let desplazamiento = posicionLibro * anchoCard;

        // Evita que se pase y deje espacio vacío
        if (desplazamiento > maxScroll) {
            desplazamiento = maxScroll;
        }

        trackLibros.style.transform = `translateX(-${desplazamiento}px)`;
    }

    btnLibroPrev.addEventListener("click", () => {
        if (posicionLibro > 0) {
            posicionLibro--;
            moverLibros();
        }
    });

    btnLibroNext.addEventListener("click", () => {
        const { anchoCard, maxScroll } = obtenerMedidas();

        const siguienteMovimiento = (posicionLibro + 1) * anchoCard;

        if (siguienteMovimiento <= maxScroll) {
            posicionLibro++;
            moverLibros();
        } else if (posicionLibro * anchoCard < maxScroll) {
            posicionLibro++;
            moverLibros();
        } else {
            window.location.href = "/catalog/catalog.html";
        }
    });

    window.addEventListener("resize", () => {
        posicionLibro = 0;
        moverLibros();
    });
});