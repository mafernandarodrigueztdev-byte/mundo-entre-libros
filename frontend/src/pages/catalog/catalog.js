/* ===================================== */
/* VARIABLES GLOBALES */
/* ===================================== */

window.todosLosLibros = [];
window.todasLasSagas = [];

/* ===================================== */
/* CARGAR JSON */
/* ===================================== */

async function cargarCatalogo() {
    try {
        const respuesta = await fetch("../data/catalog.json");
        const data = await respuesta.json();
        window.todosLosLibros = data.libros;
        window.todasLasSagas = data.sagas;
        generarSagas(data.sagas, data.libros);
        generarCategorias(data.libros);
        
        // Igualar alturas después de generar el contenido
        igualarAlturasTarjetas();
        
        console.log("JSON cargado");
    } catch (error) {
        console.error(error);
    }
}

/* ===================================== */
/* SAGAS (con carrusel infinito y flechas) */
/* ===================================== */

function generarSagas(sagas, libros) {
    const contenedor = document.getElementById("contenedor-categorias");
    const section = document.createElement("section");
    section.classList.add("categoria");
    const titulo = `<h2 class="categoria-titulo">📚 Sagas</h2>`;
    const wrapper = document.createElement("div");
    wrapper.classList.add("carrusel-contenedor");
    const carruselDiv = document.createElement("div");
    carruselDiv.classList.add("carrusel-libros");
    carruselDiv.innerHTML = sagas.map(saga => crearCardSaga(saga, libros)).join("");
    
    const btnIzq = document.createElement("button");
    btnIzq.classList.add("carrusel-btn", "carrusel-btn-izq");
    btnIzq.innerHTML = "&lt;";
    const btnDer = document.createElement("button");
    btnDer.classList.add("carrusel-btn", "carrusel-btn-der");
    btnDer.innerHTML = "&gt;";
    
    const mover = (direccion) => {
        const paso = 260;
        if (direccion === "izq") {
            if (carruselDiv.scrollLeft <= 0) {
                carruselDiv.scrollLeft = carruselDiv.scrollWidth - carruselDiv.clientWidth;
            } else {
                carruselDiv.scrollBy({ left: -paso, behavior: "smooth" });
            }
        } else {
            if (carruselDiv.scrollLeft + carruselDiv.clientWidth >= carruselDiv.scrollWidth - 1) {
                carruselDiv.scrollLeft = 0;
            } else {
                carruselDiv.scrollBy({ left: paso, behavior: "smooth" });
            }
        }
    };
    btnIzq.onclick = () => mover("izq");
    btnDer.onclick = () => mover("der");
    
    wrapper.appendChild(carruselDiv);
    wrapper.appendChild(btnIzq);
    wrapper.appendChild(btnDer);
    section.innerHTML = titulo;
    section.appendChild(wrapper);
    contenedor.appendChild(section);
}

/* ===================================== */
/* CARD SAGA */
/* ===================================== */

function crearCardSaga(saga, libros) {
    const cantidadLibros = saga.libros.length;
    return `
        <div class="card card-libro card-saga">
            <img src="${saga.portada}" alt="${saga.nombre}">
            <div class="card-body">
                <h5 class="card-title">${saga.nombre}</h5>
                <p>${cantidadLibros} libros</p>
                <p class="precio">$${saga.precioSaga}</p>
                <button class="btn btn-sagas" data-saga="${saga.id}">Ver más</button>
            </div>
        </div>
    `;
}

/* ===================================== */
/* CATEGORÍAS */
/* ===================================== */

function generarCategorias(libros) {
    const contenedor = document.getElementById("contenedor-categorias");
    const categorias = [...new Set(libros.map(libro => libro.categoria))];
    categorias.forEach(categoria => {
        const librosCategoria = libros.filter(libro => libro.categoria === categoria);
        crearCategoria(categoria, librosCategoria, contenedor);
    });
}

/* ===================================== */
/* CREAR CATEGORÍA (con carrusel infinito y flechas) */
/* ===================================== */

function crearCategoria(categoria, libros, contenedor) {
    const section = document.createElement("section");
    section.classList.add("categoria");
    const titulo = `<h2 class="categoria-titulo">${categoria}</h2>`;
    const wrapper = document.createElement("div");
    wrapper.classList.add("carrusel-contenedor");
    const carruselDiv = document.createElement("div");
    carruselDiv.classList.add("carrusel-libros");
    carruselDiv.innerHTML = libros.map(libro => crearCardLibro(libro)).join("");
    
    const btnIzq = document.createElement("button");
    btnIzq.classList.add("carrusel-btn", "carrusel-btn-izq");
    btnIzq.innerHTML = "&lt;";
    const btnDer = document.createElement("button");
    btnDer.classList.add("carrusel-btn", "carrusel-btn-der");
    btnDer.innerHTML = "&gt;";
    
    const mover = (direccion) => {
        const paso = 260;
        if (direccion === "izq") {
            if (carruselDiv.scrollLeft <= 0) {
                carruselDiv.scrollLeft = carruselDiv.scrollWidth - carruselDiv.clientWidth;
            } else {
                carruselDiv.scrollBy({ left: -paso, behavior: "smooth" });
            }
        } else {
            if (carruselDiv.scrollLeft + carruselDiv.clientWidth >= carruselDiv.scrollWidth - 1) {
                carruselDiv.scrollLeft = 0;
            } else {
                carruselDiv.scrollBy({ left: paso, behavior: "smooth" });
            }
        }
    };
    btnIzq.onclick = () => mover("izq");
    btnDer.onclick = () => mover("der");
    
    wrapper.appendChild(carruselDiv);
    wrapper.appendChild(btnIzq);
    wrapper.appendChild(btnDer);
    section.innerHTML = titulo;
    section.appendChild(wrapper);
    contenedor.appendChild(section);
}

/* ===================================== */
/* CARD LIBRO */
/* ===================================== */

function crearCardLibro(libro) {
    return `
        <div class="card card-libro">
            <img src="${libro.portada}" alt="${libro.titulo}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${libro.titulo}</h5>
                <p class="dato-libro"><strong>Autor:</strong> ${libro.autor}</p>
                <p class="dato-libro"><strong>Editorial:</strong> ${libro.editorial}</p>
                <div class="precio-container">
                    <span class="texto-precio">Precio</span>
                    <p class="precio">$${libro.precio}</p>
                </div>
                <button class="btn btn-libro mt-auto" data-id="${libro.id}">Ver detalles</button>
            </div>
        </div>
    `;
}

/* ===================================== */
/* EVENTO VER DETALLES LIBRO */
/* ===================================== */

document.addEventListener("click", function (evento) {
    const btnLibro = evento.target.closest(".btn-libro");
    if (!btnLibro) return;
    const idLibro = Number(btnLibro.dataset.id);
    if (!idLibro) return;
    const libro = window.todosLosLibros.find(l => l.id === idLibro);
    if (libro) abrirModalLibro(libro);
});

/* ===================================== */
/* EVENTO VER DETALLES SAGAS */
/* ===================================== */

document.addEventListener("click", function (evento) {
    const btnSagas = evento.target.closest(".btn-sagas");
    if (!btnSagas) return;
    const idSaga = btnSagas.dataset.saga;
    if (!idSaga) return;
    const saga = window.todasLasSagas.find(s => s.id === idSaga);
    if (saga) abrirModalSagas(saga);
});

/* ===================================== */
/* ABRIR MODAL LIBRO */
/* ===================================== */

function abrirModalLibro(libro) {
    document.getElementById("tituloModal").textContent = libro.titulo;
    document.getElementById("imagenModal").src = libro.portada;
    document.getElementById("imagenModal").alt = libro.titulo;
    document.getElementById("autorModal").textContent = libro.autor;
    document.getElementById("cantidadModal").textContent = libro.saga ? libro.saga : "Libro independiente";
    document.getElementById("editorialModal").textContent = libro.editorial;
    document.getElementById("edicionModal").textContent = libro.edicion;
    document.getElementById("isbnModal").textContent = libro.isbn;
    document.getElementById("precioModal").textContent = `$${libro.precio}.00`;
    document.getElementById("sinopsisModal").textContent = libro.sinopsis || "Sinopsis disponible próximamente.";
    const botonCarrito = document.querySelector("#modalLibro .btn-carrito");
    if (botonCarrito) {
        botonCarrito.dataset.id = libro.id;
        botonCarrito.dataset.titulo = libro.titulo;
        botonCarrito.dataset.precio = libro.precio;
        botonCarrito.dataset.portada = libro.portada;
    }
    const modal = new bootstrap.Modal(document.getElementById("modalLibro"));
    modal.show();
}

/* ===================================== */
/* ABRIR MODAL SAGAS (con flechas y desplazamiento infinito) */
/* ===================================== */

function abrirModalSagas(saga) {
    document.getElementById("tituloModals").textContent = saga.nombre;
    document.getElementById("nombreSagaModal").textContent = saga.nombre;
    document.getElementById("imagenModals").src = saga.portada || "";
    document.getElementById("isbnModals").textContent = saga.isbnSaga;
    document.getElementById("precioModals").textContent = saga.precioSaga;
    document.getElementById("descripcionModals").textContent = saga.descripcion;
    
    const contenedor = document.getElementById("carruselSaga");
    if (!contenedor) return;
    
    // Limpiar y crear estructura
    contenedor.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.classList.add("carrusel-contenedor");
    
    const carruselDiv = document.createElement("div");
    carruselDiv.classList.add("carrusel-libros");
    
    const librosDeSaga = window.todosLosLibros.filter(libro => saga.libros.includes(libro.id));
    librosDeSaga.forEach(libro => {
        const card = document.createElement("div");
        card.classList.add("card", "card-libro");
        card.innerHTML = `
            <img src="${libro.portada}" alt="${libro.titulo}">
            <div class="card-body">
                <h5 class="card-title">${libro.titulo}</h5>
                <p>${libro.autor}</p>
                <div class="d-flex gap-2 mt-2">
                    <button type="button" class="btn btn-libro btn-sm" data-id="${libro.id}">Ver detalles</button>
                    <button type="button" class="btn btn-carrito" data-id="${libro.id}" data-titulo="${libro.titulo}" data-precio="${libro.precio}" data-portada="${libro.portada}">Agregar al carrito</button>
                </div>
            </div>
        `;
        carruselDiv.appendChild(card);
    });
    
    // Botones de flecha
    const btnIzq = document.createElement("button");
    btnIzq.classList.add("carrusel-btn", "carrusel-btn-izq");
    btnIzq.innerHTML = "&lt;";
    const btnDer = document.createElement("button");
    btnDer.classList.add("carrusel-btn", "carrusel-btn-der");
    btnDer.innerHTML = "&gt;";
    
    const paso = 260;
    const mover = (direccion) => {
        if (direccion === "izq") {
            if (carruselDiv.scrollLeft <= 0) {
                carruselDiv.scrollLeft = carruselDiv.scrollWidth - carruselDiv.clientWidth;
            } else {
                carruselDiv.scrollBy({ left: -paso, behavior: "smooth" });
            }
        } else {
            if (carruselDiv.scrollLeft + carruselDiv.clientWidth >= carruselDiv.scrollWidth - 1) {
                carruselDiv.scrollLeft = 0;
            } else {
                carruselDiv.scrollBy({ left: paso, behavior: "smooth" });
            }
        }
    };
    
    btnIzq.onclick = () => mover("izq");
    btnDer.onclick = () => mover("der");
    
    wrapper.appendChild(carruselDiv);
    wrapper.appendChild(btnIzq);
    wrapper.appendChild(btnDer);
    contenedor.appendChild(wrapper);
    
    const modalElement = document.getElementById("modalSagas");
    const modal = new bootstrap.Modal(modalElement);
    
    // Igualar alturas después de que el modal se muestre
    modalElement.removeEventListener('shown.bs.modal', igualarAlturasTarjetasModalSaga);
    modalElement.addEventListener('shown.bs.modal', function() {
        igualarAlturasTarjetasModalSaga();
    });
    
    const botonSagaCarrito = document.querySelector("#modalSagas .btn-carrito-saga");
    if (botonSagaCarrito) {
        botonSagaCarrito.dataset.saga = saga.id;
    }
    modal.show();
}

/* ===================================== */
/* IGUALAR ALTURAS DE TARJETAS EN CADA CARRUSEL (CATÁLOGO PRINCIPAL) */
/* ===================================== */

function igualarAlturasTarjetas() {
    const carruseles = document.querySelectorAll('.carrusel-libros');
    carruseles.forEach(carrusel => {
        const tarjetas = carrusel.querySelectorAll('.card-libro');
        if (tarjetas.length === 0) return;
        tarjetas.forEach(tarjeta => tarjeta.style.height = 'auto');
        let maxAltura = 0;
        tarjetas.forEach(tarjeta => {
            const altura = tarjeta.offsetHeight;
            if (altura > maxAltura) maxAltura = altura;
        });
        tarjetas.forEach(tarjeta => {
            tarjeta.style.height = maxAltura + 'px';
        });
    });
}

/* ===================================== */
/* IGUALAR ALTURAS DE TARJETAS DENTRO DEL CARRUSEL DEL MODAL DE SAGA */
/* ===================================== */

function igualarAlturasTarjetasModalSaga() {
    const carrusel = document.querySelector('#modalSagas .carrusel-libros');
    if (!carrusel) return;
    const tarjetas = carrusel.querySelectorAll('.card-libro');
    if (tarjetas.length === 0) return;
    tarjetas.forEach(tarjeta => tarjeta.style.height = 'auto');
    let maxAltura = 0;
    tarjetas.forEach(tarjeta => {
        const altura = tarjeta.offsetHeight;
        if (altura > maxAltura) maxAltura = altura;
    });
    tarjetas.forEach(tarjeta => {
        tarjeta.style.height = maxAltura + 'px';
    });
}

// Ejecutar igualación después de que el DOM esté listo (por si acaso)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(igualarAlturasTarjetas, 100);
    });
} else {
    setTimeout(igualarAlturasTarjetas, 100);
}

// Recalcular alturas si la ventana cambia de tamaño (responsive)
window.addEventListener('resize', () => {
    igualarAlturasTarjetas();
});

/* ===================================== */
/* INICIAR */
/* ===================================== */

cargarCatalogo();