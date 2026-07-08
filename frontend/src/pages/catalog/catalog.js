/* =====================================
   CATÁLOGO - MUNDO ENTRE LIBROS
   Este archivo:
   - Carga libros y sagas desde catalog.json
   - Renderiza sagas
   - Renderiza categorías de libros
   - Abre modal de libro
   - Abre modal de saga
   - NO maneja el carrito directamente
   ===================================== */

/* =====================================
   VARIABLES GLOBALES
   ===================================== */

let todosLosLibros = [];
let todasLasSagas = [];

window.todosLosLibros = todosLosLibros;
window.todasLasSagas = todasLasSagas;

const API_URL = "http://localhost:8080";


/* =====================================
   CARGAR CATÁLOGO DESDE SPRING BOOT
   ===================================== */

async function cargarCatalogo() {

    try {

        const [respuestaLibros, respuestaSagas] = await Promise.all([
            fetch("http://localhost:8080/api/books"),
            fetch("http://localhost:8080/api/sagas")
        ]);

        if (!respuestaLibros.ok || !respuestaSagas.ok) {
            throw new Error("No se pudieron cargar los datos.");
        }

        const librosAPI = await respuestaLibros.json();
        const sagasAPI = await respuestaSagas.json();

        /* ==========================
           ADAPTAR LIBROS
           ========================== */

        todosLosLibros = librosAPI.map(libro => ({

            id: libro.idBook,

            titulo: libro.title,

            autor: libro.author,

            editorial: libro.saga
                ? libro.saga.editorial
                : "Independiente",

            portada: libro.coverUrl?.startsWith("http")
    ? libro.coverUrl
    : `${API_URL}${libro.coverUrl}`,

            precio: libro.price,

            isbn: libro.isbn,

            edicion: libro.edition,

            sinopsis: libro.synopsis,

            categoria: libro.category
                ? libro.category.name
                : "Sin categoría",

            saga: libro.saga
                ? libro.saga.name
                : null,

            sagaId: libro.saga
                ? libro.saga.idSaga
                : null

        }));


        /* ==========================
           ADAPTAR SAGAS
           ========================== */

        todasLasSagas = sagasAPI.map(saga => ({

            id: saga.idSaga,

            nombre: saga.name,

            portada: `${API_URL}${saga.coverUrl}`,

            precioSaga: saga.price,

            descripcion: saga.description,

            isbnSaga: saga.isbn,

            autor: saga.author,

            editorial: saga.editorial,

            libros: saga.books
                ? saga.books.map(libro => libro.idBook)
                : []

        }));


        window.todosLosLibros = todosLosLibros;
        window.todasLasSagas = todasLasSagas;


        const contenedor = document.getElementById("contenedor-categorias");

        if (!contenedor) {
            console.error("No existe #contenedor-categorias");
            return;
        }

        contenedor.innerHTML = "";

        /* Primero sagas */
        generarSagas(todasLasSagas);

        /* Después categorías */
        generarCategorias(todosLosLibros);

        setTimeout(() => {
            igualarAlturasTarjetas();
        }, 100);

        console.log("Libros:", todosLosLibros);
        console.log("Sagas:", todasLasSagas);

    }
    catch (error) {

        console.error("Error cargando catálogo:", error);

        const contenedor = document.getElementById("contenedor-categorias");

        if (contenedor) {

            contenedor.innerHTML = `
                <p class="catalog-error">
                    No pudimos cargar el catálogo.
                </p>
            `;

        }

    }

}

/* =====================================
   FORMATEADORES
   ===================================== */

function formatearPrecio(precio) {

    return Number(precio || 0).toLocaleString("es-MX", {

        minimumFractionDigits: 2,
        maximumFractionDigits: 2

    });

}

function formatearCategoria(categoria) {

    return categoria || "Sin categoría";

}

/* =====================================
   SAGAS
   ===================================== */

function generarSagas(sagas) {

    if (!sagas || sagas.length === 0) return;

    const contenedor = document.getElementById("contenedor-categorias");

    const section = document.createElement("section");
    section.classList.add("categoria", "categoria-sagas");

    section.innerHTML = `
        <h2 class="categoria-titulo">📚 Sagas</h2>
    `;

    const wrapper = document.createElement("div");
    wrapper.classList.add("carrusel-contenedor");

    const carruselDiv = document.createElement("div");
    carruselDiv.classList.add("carrusel-libros");

    carruselDiv.innerHTML = sagas
        .map(saga => crearCardSaga(saga))
        .join("");

    const btnIzq = document.createElement("button");
    btnIzq.className = "carrusel-btn carrusel-btn-izq";
    btnIzq.type = "button";
    btnIzq.innerHTML = "&lt;";
    btnIzq.setAttribute("aria-label", "Ver sagas anteriores");

    const btnDer = document.createElement("button");
    btnDer.className = "carrusel-btn carrusel-btn-der";
    btnDer.type = "button";
    btnDer.innerHTML = "&gt;";
    btnDer.setAttribute("aria-label", "Ver más sagas");

    btnIzq.addEventListener("click", () => moverCarrusel(carruselDiv, "izq"));
    btnDer.addEventListener("click", () => moverCarrusel(carruselDiv, "der"));

    wrapper.appendChild(carruselDiv);
    wrapper.appendChild(btnIzq);
    wrapper.appendChild(btnDer);

    section.appendChild(wrapper);

    contenedor.appendChild(section);

}

/* =====================================
   CARD DE SAGA
   ===================================== */

function crearCardSaga(saga) {

    const cantidadLibros = saga.libros
        ? saga.libros.length
        : 0;

    return `

    <article class="card card-libro card-saga">

        <img
            src="${saga.portada}"
            alt="${saga.nombre}"
            loading="lazy"
        >

        <div class="card-body d-flex flex-column">

            <h5 class="card-title">
                ${saga.nombre}
            </h5>

            <p class="dato-libro">
                <strong>${cantidadLibros}</strong> libros
            </p>

            <div class="precio-container">

                <span class="texto-precio">
                    Precio de la saga
                </span>

                <p class="precio">
                    $${formatearPrecio(saga.precioSaga)}
                </p>

            </div>

            <button
                class="btn btn-sagas mt-auto"
                type="button"
                data-saga="${saga.id}"
            >
                Ver más
            </button>

        </div>

    </article>

    `;

}

/* =====================================
   CATEGORÍAS
   ===================================== */

function generarCategorias(libros) {

    const contenedor = document.getElementById("contenedor-categorias");

    const categorias = [
        ...new Set(
            libros.map(libro => libro.categoria)
        )
    ];

    categorias.forEach(categoria => {

        const librosCategoria = libros.filter(
            libro => libro.categoria === categoria
        );

        crearCategoria(
            categoria,
            librosCategoria,
            contenedor
        );

    });

}

/* =====================================
   CREAR CATEGORÍA
   ===================================== */

function crearCategoria(categoria, libros, contenedor) {

    const section = document.createElement("section");
    section.classList.add("categoria");

    section.innerHTML = `
        <h2 class="categoria-titulo">
            ${formatearCategoria(categoria)}
        </h2>
    `;

    const wrapper = document.createElement("div");
    wrapper.classList.add("carrusel-contenedor");

    const carruselDiv = document.createElement("div");
    carruselDiv.classList.add("carrusel-libros");

    carruselDiv.innerHTML = libros
        .map(libro => crearCardLibro(libro))
        .join("");

    const btnIzq = document.createElement("button");
    btnIzq.className = "carrusel-btn carrusel-btn-izq";
    btnIzq.type = "button";
    btnIzq.innerHTML = "&lt;";
    btnIzq.setAttribute("aria-label", "Ver libros anteriores");

    const btnDer = document.createElement("button");
    btnDer.className = "carrusel-btn carrusel-btn-der";
    btnDer.type = "button";
    btnDer.innerHTML = "&gt;";
    btnDer.setAttribute("aria-label", "Ver más libros");

    btnIzq.addEventListener("click", () => moverCarrusel(carruselDiv, "izq"));
    btnDer.addEventListener("click", () => moverCarrusel(carruselDiv, "der"));

    wrapper.appendChild(carruselDiv);
    wrapper.appendChild(btnIzq);
    wrapper.appendChild(btnDer);

    section.appendChild(wrapper);

    contenedor.appendChild(section);

}

/* =====================================
   CARD LIBRO
   ===================================== */

function crearCardLibro(libro) {

    return `

    <article class="card card-libro">

        <img
            src="${libro.portada}"
            alt="${libro.titulo}"
            loading="lazy"
        >

        <div class="card-body d-flex flex-column">

            <h5 class="card-title">
                ${libro.titulo}
            </h5>

            <p class="dato-libro">
                <strong>Autor:</strong>
                ${libro.autor}
            </p>

            <p class="dato-libro">
                <strong>Editorial:</strong>
                ${libro.editorial}
            </p>

            <div class="precio-container">

                <span class="texto-precio">
                    Precio
                </span>

                <p class="precio">
                    $${formatearPrecio(libro.precio)}
                </p>

            </div>

            <button
                class="btn btn-libro mt-auto"
                type="button"
                data-id="${libro.id}"
            >
                Ver detalles
            </button>

        </div>

    </article>

    `;

}

/* =====================================
   MOVER CARRUSEL
   ===================================== */

function moverCarrusel(carruselDiv, direccion) {
  const paso = 280;

  if (direccion === "izq") {
    if (carruselDiv.scrollLeft <= 0) {
      carruselDiv.scrollTo({
        left: carruselDiv.scrollWidth - carruselDiv.clientWidth,
        behavior: "smooth"
      });
    } else {
      carruselDiv.scrollBy({
        left: -paso,
        behavior: "smooth"
      });
    }

    return;
  }

  const estaAlFinal =
    carruselDiv.scrollLeft + carruselDiv.clientWidth >= carruselDiv.scrollWidth - 5;

  if (estaAlFinal) {
    carruselDiv.scrollTo({
      left: 0,
      behavior: "smooth"
    });
  } else {
    carruselDiv.scrollBy({
      left: paso,
      behavior: "smooth"
    });
  }
}

/* =====================================
   EVENTO: VER DETALLES DE LIBRO
   ===================================== */

document.addEventListener("click", function (evento) {
  const btnLibro = evento.target.closest(".btn-libro");

  if (!btnLibro) return;

  const idLibro = Number(btnLibro.dataset.id);

  if (!idLibro) return;

  const libro = todosLosLibros.find((item) => item.id === idLibro);

  if (libro) {
    abrirModalLibro(libro);
  }
});

/* =====================================
   EVENTO: VER DETALLES DE SAGA
   ===================================== */

document.addEventListener("click", function (evento) {

  const btn = evento.target.closest(".btn-sagas");

  if (!btn) return;

  const idSaga = Number(btn.dataset.saga);

  const saga = todasLasSagas.find(
    s => s.id === idSaga
  );

  if (!saga) return;

  abrirModalSagas(saga);

});

/* =====================================
   ABRIR MODAL LIBRO
   ===================================== */

function abrirModalLibro(libro) {
  document.getElementById("tituloModal").textContent = libro.titulo;
  document.getElementById("imagenModal").src = libro.portada;
  document.getElementById("imagenModal").alt = libro.titulo;
  document.getElementById("autorModal").textContent = libro.autor;
  document.getElementById("cantidadModal").textContent = libro.saga || "Libro independiente";
  document.getElementById("editorialModal").textContent = libro.editorial;
  document.getElementById("edicionModal").textContent = libro.edicion;
  document.getElementById("isbnModal").textContent = libro.isbn;
  document.getElementById("precioModal").textContent = formatearPrecio(libro.precio);
  document.getElementById("sinopsisModal").textContent =
    libro.sinopsis || "Sinopsis disponible próximamente.";

  const botonCarrito = document.getElementById("btnCarrito");

  if (botonCarrito) {
    botonCarrito.dataset.id = String(libro.id);
    botonCarrito.dataset.titulo = libro.titulo;
    botonCarrito.dataset.precio = String(libro.precio);
    botonCarrito.dataset.portada = libro.portada;
  }
/*Wishlist */ 
  const btnWishlist = document.getElementById("btnWishlist");

if (btnWishlist) {
  btnWishlist.dataset.id = String(libro.id);
  btnWishlist.dataset.titulo = libro.titulo;
  btnWishlist.dataset.precio = String(libro.precio);
  btnWishlist.dataset.imagen = libro.portada;
  btnWishlist.dataset.descripcion = libro.sinopsis || "";
}

  const modal = new bootstrap.Modal(document.getElementById("modalLibro"));
  modal.show();
}


/* =====================================
   ABRIR MODAL SAGAS
   ===================================== */

function abrirModalSagas(saga) {
  // ✅ IDs correctos con "s" al final
  document.getElementById("tituloModals").textContent = saga.nombre;
  document.getElementById("nombreSagaModal").textContent = saga.nombre;
  document.getElementById("imagenModals").src = saga.portada || "";
  document.getElementById("imagenModals").alt = saga.nombre;
  document.getElementById("isbnModals").textContent = saga.isbnSaga;
  document.getElementById("precioModals").textContent = formatearPrecio(saga.precioSaga);
  document.getElementById("descripcionModals").textContent = saga.descripcion || "Descripción disponible próximamente.";

  const contenedor = document.getElementById("carruselSaga");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.classList.add("carrusel-contenedor");

  const carruselDiv = document.createElement("div");
  carruselDiv.classList.add("carrusel-libros");

  const librosDeSaga = todosLosLibros.filter(
    libro => libro.sagaId === saga.id
);

  carruselDiv.innerHTML = librosDeSaga
    .map((libro) => crearCardLibroSagaModal(libro))
    .join("");

  const btnIzq = document.createElement("button");
  btnIzq.classList.add("carrusel-btn", "carrusel-btn-izq");
  btnIzq.type = "button";
  btnIzq.innerHTML = "&lt;";
  btnIzq.setAttribute("aria-label", "Ver libros anteriores de la saga");

  const btnDer = document.createElement("button");
  btnDer.classList.add("carrusel-btn", "carrusel-btn-der");
  btnDer.type = "button";
  btnDer.innerHTML = "&gt;";
  btnDer.setAttribute("aria-label", "Ver más libros de la saga");

  // ✅ Eventos con console.log para depurar (opcional)
  btnIzq.addEventListener("click", () => {
    console.log("Flecha izquierda clickeada");
    moverCarrusel(carruselDiv, "izq");
  });
  btnDer.addEventListener("click", () => {
    console.log("Flecha derecha clickeada");
    moverCarrusel(carruselDiv, "der");
  });

  wrapper.appendChild(carruselDiv);
  wrapper.appendChild(btnIzq);
  wrapper.appendChild(btnDer);

  contenedor.appendChild(wrapper);

  const botonSagaCarrito = document.getElementById("btnAgregarSagaCarrito");
  if (botonSagaCarrito) {
    botonSagaCarrito.dataset.saga = saga.id;
  }

  /*Wishlist*/

const btnWishlistSaga = document.getElementById("btnWishlistSaga");

if (btnWishlistSaga) {
  btnWishlistSaga.dataset.id = String(saga.id);
  btnWishlistSaga.dataset.titulo = saga.nombre;
  btnWishlistSaga.dataset.precio = String(saga.precioSaga);
  btnWishlistSaga.dataset.imagen = saga.portada;
  btnWishlistSaga.dataset.descripcion = saga.descripcion || "Saga completa";
  btnWishlistSaga.dataset.tipo = "saga";
}

  const modalElement = document.getElementById("modalSagas");
  const modal = new bootstrap.Modal(modalElement);

  modalElement.addEventListener(
    "shown.bs.modal",
    () => {
      igualarAlturasTarjetasModalSaga();
    },
    { once: true }
  );

  modal.show();
}

/* =====================================
   CARD DE LIBRO DENTRO DEL MODAL DE SAGA
   ===================================== */

function crearCardLibroSagaModal(libro) {

  return `
    <article class="card card-libro card-libro-saga-modal">

      <img
        src="${libro.portada}"
        alt="${libro.titulo}"
        loading="lazy"
      >

      <div class="card-body d-flex flex-column">

        <h5 class="card-title">
          ${libro.titulo}
        </h5>

        <p class="dato-libro">
          <strong>Autor:</strong>
          ${libro.autor}
        </p>

        <div class="precio-container">

          <span class="texto-precio">
            Precio
          </span>

          <p class="precio">
            $${formatearPrecio(libro.precio)}
          </p>

        </div>

        <button
          class="btn btn-libro mt-auto"
          type="button"
          data-id="${libro.id}"
        >
          Ver detalles
        </button>

        <button
          class="btn btn-carrito mt-2"
          type="button"
          data-id="${libro.id}"
          data-titulo="${libro.titulo}"
          data-precio="${libro.precio}"
          data-portada="${libro.portada}"
        >
          Agregar al carrito
        </button>

      </div>

    </article>
  `;
}
/* =====================================
   IGUALAR ALTURAS DE CARDS
   ===================================== */

function igualarAlturasTarjetas() {
  const carruseles = document.querySelectorAll("#contenedor-categorias .carrusel-libros");

  carruseles.forEach((carrusel) => {
    const tarjetas = carrusel.querySelectorAll(".card-libro");

    if (tarjetas.length === 0) return;

    tarjetas.forEach((tarjeta) => {
      tarjeta.style.height = "auto";
    });

    let maxAltura = 0;

    tarjetas.forEach((tarjeta) => {
      const altura = tarjeta.offsetHeight;

      if (altura > maxAltura) {
        maxAltura = altura;
      }
    });

    tarjetas.forEach((tarjeta) => {
      tarjeta.style.height = `${maxAltura}px`;
    });
  });
}

function igualarAlturasTarjetasModalSaga() {
  const tarjetas = document.querySelectorAll("#modalSagas .card-libro");

  if (tarjetas.length === 0) return;

  tarjetas.forEach((tarjeta) => {
    tarjeta.style.height = "auto";
  });

  let maxAltura = 0;

  tarjetas.forEach((tarjeta) => {
    const altura = tarjeta.offsetHeight;

    if (altura > maxAltura) {
      maxAltura = altura;
    }
  });

  tarjetas.forEach((tarjeta) => {
    tarjeta.style.height = `${maxAltura}px`;
  });
}

/* =====================================
   RESPONSIVE / RESIZE
   ===================================== */

window.addEventListener("resize", () => {
  igualarAlturasTarjetas();
});

/* =====================================
   INICIO
   ===================================== */

document.addEventListener("DOMContentLoaded", () => {
  cargarCatalogo();
});

/* =====================================
   AGREGAR A WISHLIST - BACKEND + JWT
   ===================================== */
/* Libros y sagas */

document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:8080";
  const TOKEN_KEY = "mel_token";

  const btnWishlist = document.getElementById("btnWishlist");
  const btnWishlistSaga = document.getElementById("btnWishlistSaga");

  // =========================
  // TOKEN / SESIÓN
  // =========================

  function obtenerToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function estaLogueado() {
    return Boolean(obtenerToken());
  }

  function mostrarLoginRequerido() {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "Para agregar productos a tu wishlist necesitas iniciar sesión.",
        confirmButtonText: "Ir a mi cuenta",
        confirmButtonColor: "#4B1D13",
        background: "#F6EBD9",
        color: "#521F12"
      }).then(() => {
        window.location.href = "/account/account.html";
      });

      return;
    }

    alert("Necesitas iniciar sesión para usar wishlist.");
    window.location.href = "/account/account.html";
  }

  // =========================
  // FETCH CON JWT
  // =========================

  async function wishlistFetch(endpoint, options = {}) {
    const token = obtenerToken();

    if (!token) {
      mostrarLoginRequerido();
      return null;
    }

    const response = await fetch(API_URL + endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("mel_token");
      localStorage.removeItem("mel_logged_user");
      mostrarLoginRequerido();
      throw new Error("Sesión expirada");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error en wishlist");
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    return null;
  }

  // =========================
  // API LIBROS
  // =========================

  async function verificarLibroWishlist(bookId) {
    try {
      return await wishlistFetch(`/api/wishlist/check/book/${bookId}`);
    } catch (error) {
      console.error("Error verificando libro en wishlist:", error);
      return false;
    }
  }

  async function agregarLibroWishlist(bookId) {
    return await wishlistFetch(`/api/wishlist/books/${bookId}`, {
      method: "POST"
    });
  }

  async function eliminarLibroWishlist(bookId) {
    return await wishlistFetch(`/api/wishlist/books/${bookId}`, {
      method: "DELETE"
    });
  }

  // =========================
  // API SAGAS
  // =========================

  async function verificarSagaWishlist(sagaId) {
    try {
      return await wishlistFetch(`/api/wishlist/check/saga/${sagaId}`);
    } catch (error) {
      console.error("Error verificando saga en wishlist:", error);
      return false;
    }
  }

  async function agregarSagaWishlist(sagaId) {
    return await wishlistFetch(`/api/wishlist/sagas/${sagaId}`, {
      method: "POST"
    });
  }

  async function eliminarSagaWishlist(sagaId) {
    return await wishlistFetch(`/api/wishlist/sagas/${sagaId}`, {
      method: "DELETE"
    });
  }

  // =========================
  // ESTADO VISUAL
  // =========================

  function marcarActivo(btn) {
    if (!btn) return;

    btn.classList.add("activo");
    btn.setAttribute("title", "Guardado en wishlist");
  }

  function marcarInactivo(btn) {
    if (!btn) return;

    btn.classList.remove("activo");
    btn.setAttribute("title", "Agregar a wishlist");
  }

  // =========================
  // INICIALIZAR LIBRO
  // =========================

  async function inicializarLibro() {
    if (!btnWishlist || !estaLogueado()) return;

    const bookId = btnWishlist.dataset.id || btnWishlist.dataset.bookId;

    if (!bookId) return;

    const existe = await verificarLibroWishlist(bookId);

    if (existe) {
      marcarActivo(btnWishlist);
    } else {
      marcarInactivo(btnWishlist);
    }
  }

  // =========================
  // INICIALIZAR SAGA
  // =========================

  async function inicializarSaga() {
    if (!btnWishlistSaga || !estaLogueado()) return;

    const sagaId = btnWishlistSaga.dataset.id || btnWishlistSaga.dataset.sagaId;

    if (!sagaId) return;

    const existe = await verificarSagaWishlist(sagaId);

    if (existe) {
      marcarActivo(btnWishlistSaga);
    } else {
      marcarInactivo(btnWishlistSaga);
    }
  }

  // =========================
  // CLICK LIBRO
  // =========================

  if (btnWishlist) {
    btnWishlist.addEventListener("click", async () => {
      if (!estaLogueado()) {
        mostrarLoginRequerido();
        return;
      }

      const bookId = btnWishlist.dataset.id || btnWishlist.dataset.bookId;

      if (!bookId) {
        console.error("El botón de libro no tiene data-id o data-book-id");
        return;
      }

      try {
        btnWishlist.disabled = true;

        const existe = await verificarLibroWishlist(bookId);

        if (existe) {
          await eliminarLibroWishlist(bookId);
          marcarInactivo(btnWishlist);

          Swal.fire({
            icon: "success",
            title: "Eliminado",
            text: "El libro fue eliminado de tu wishlist.",
            confirmButtonColor: "#4B1D13",
            background: "#F6EBD9",
            color: "#521F12"
          });

          return;
        }

        await agregarLibroWishlist(bookId);
        marcarActivo(btnWishlist);

        Swal.fire({
          icon: "success",
          title: "Agregado",
          text: "El libro fue agregado a tu wishlist.",
          confirmButtonColor: "#4B1D13",
          background: "#F6EBD9",
          color: "#521F12"
        });

      } catch (error) {
        console.error("Error wishlist libro:", error);

        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar la wishlist.",
          confirmButtonColor: "#4B1D13",
          background: "#F6EBD9",
          color: "#521F12"
        });

      } finally {
        btnWishlist.disabled = false;
      }
    });
  }

  // =========================
  // CLICK SAGA
  // =========================

  if (btnWishlistSaga) {
    btnWishlistSaga.addEventListener("click", async () => {
      if (!estaLogueado()) {
        mostrarLoginRequerido();
        return;
      }

      const sagaId = btnWishlistSaga.dataset.id || btnWishlistSaga.dataset.sagaId;

      if (!sagaId) {
        console.error("El botón de saga no tiene data-id o data-saga-id");
        return;
      }

      try {
        btnWishlistSaga.disabled = true;

        const existe = await verificarSagaWishlist(sagaId);

        if (existe) {
          await eliminarSagaWishlist(sagaId);
          marcarInactivo(btnWishlistSaga);

          Swal.fire({
            icon: "success",
            title: "Eliminada",
            text: "La saga fue eliminada de tu wishlist.",
            confirmButtonColor: "#4B1D13",
            background: "#F6EBD9",
            color: "#521F12"
          });

          return;
        }

        await agregarSagaWishlist(sagaId);
        marcarActivo(btnWishlistSaga);

        Swal.fire({
          icon: "success",
          title: "Agregada",
          text: "La saga fue agregada a tu wishlist.",
          confirmButtonColor: "#4B1D13",
          background: "#F6EBD9",
          color: "#521F12"
        });

      } catch (error) {
        console.error("Error wishlist saga:", error);

        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar la wishlist.",
          confirmButtonColor: "#4B1D13",
          background: "#F6EBD9",
          color: "#521F12"
        });

      } finally {
        btnWishlistSaga.disabled = false;
      }
    });
  }

  // =========================
  // INICIO
  // =========================

  inicializarLibro();
  inicializarSaga();

});