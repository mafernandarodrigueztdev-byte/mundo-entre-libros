// carrito.js - con redirección automática al carrito después de agregar

document.addEventListener("DOMContentLoaded", () => {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    const contadorCarrito = document.querySelector("#contador-carrito");

    const listaCarrito = document.querySelector("#lista-carrito");
    const resumenProductos = document.querySelector("#resumen-productos");
    const resumenSubtotal = document.querySelector("#resumen-subtotal");
    const resumenTotal = document.querySelector("#resumen-total");

    const listaOffcanvas = document.querySelector(".carrito-productos-lista");
    const totalOffcanvas = document.querySelector("#total-offcanvas");

    const offcanvas = document.querySelector("#offcanvasCarrito");
    const contenedorIconoCarrito = document.querySelector(".contenedor-carrito-offcanvas");

    if (offcanvas) {
        offcanvas.addEventListener("show.bs.offcanvas", () => {
            carrito = JSON.parse(localStorage.getItem("carrito")) || [];
            renderizarCarrito();
        });
    }

    document.addEventListener("click", (e) => {
        const botonCarrito = e.target.closest(".btn-carrito");

        if (botonCarrito) {
            const producto = {
                id: botonCarrito.dataset.id,
                titulo: botonCarrito.dataset.titulo,
                precio: Number(botonCarrito.dataset.precio),
                portada: botonCarrito.dataset.portada,
                cantidad: 1
            };

            if (
                !producto.id ||
                !producto.titulo ||
                isNaN(producto.precio) ||
                !producto.portada
            ) {
                console.error("Producto incompleto:", producto);
                return;
            }

            agregarProducto(producto);
            
            // ✅ Redirigir al carrito, pero no si ya estamos en esa página
            if (window.location.pathname !== "/shoppingCart/shopping.html") {
                window.location.href = "/shoppingCart/shopping.html";
            }
            return;
        }

        const botonSaga = e.target.closest(".btn-carrito-saga");

        if (botonSaga) {
            const idSaga = botonSaga.dataset.saga;

            const saga = window.todasLasSagas?.find(s => s.id === idSaga);

            if (!saga) {
                console.error("Saga no encontrada:", idSaga);
                return;
            }

            saga.libros.forEach(idLibro => {
                const libro = window.todosLosLibros?.find(l => l.id === idLibro);

                if (libro) {
                    agregarProducto({
                        id: String(libro.id),
                        titulo: libro.titulo,
                        precio: Number(libro.precio),
                        portada: libro.portada,
                        cantidad: 1
                    });
                }
            });
            
            // ✅ Redirigir al carrito después de agregar la saga
            if (window.location.pathname !== "/shoppingCart/shopping.html") {
                window.location.href = "/shoppingCart/shopping.html";
            }
            return;
        }

        const botonEliminar = e.target.closest(".btn-eliminar-producto");

        if (botonEliminar) {
            eliminarProducto(botonEliminar.dataset.id);
        }

        const botonRestar = e.target.closest(".btn-restar-producto");

        if (botonRestar) {
            restarProducto(botonRestar.dataset.id);
        }

        const botonSumar = e.target.closest(".btn-sumar-producto");

        if (botonSumar) {
            sumarProducto(botonSumar.dataset.id);
        }
    });

    function agregarProducto(producto) {
        const productoExiste = carrito.find(item => item.id == producto.id);

        if (productoExiste) {
            productoExiste.cantidad++;
        } else {
            carrito.push({
                id: String(producto.id),
                titulo: producto.titulo,
                precio: Number(producto.precio),
                portada: producto.portada,
                cantidad: producto.cantidad
            });
        }

        guardarCarrito();
        renderizarCarrito();
    }

    function sumarProducto(id) {
        const producto = carrito.find(item => item.id == id);

        if (producto) {
            producto.cantidad++;
        }

        guardarCarrito();
        renderizarCarrito();
    }

    function restarProducto(id) {
        const producto = carrito.find(item => item.id == id);

        if (producto) {
            producto.cantidad--;

            if (producto.cantidad <= 0) {
                carrito = carrito.filter(item => item.id != id);
            }
        }

        guardarCarrito();
        renderizarCarrito();
    }

    function eliminarProducto(id) {
        carrito = carrito.filter(item => item.id != id);

        guardarCarrito();
        renderizarCarrito();
    }

    function guardarCarrito() {
        localStorage.setItem("carrito", JSON.stringify(carrito));
    }

    function calcularTotal() {
        return carrito.reduce((total, producto) => {
            return total + producto.precio * producto.cantidad;
        }, 0);
    }

    function calcularCantidadProductos() {
        return carrito.reduce((total, producto) => {
            return total + producto.cantidad;
        }, 0);
    }

    function actualizarContador() {
        if (!contadorCarrito) return;

        const cantidadProductos = calcularCantidadProductos();

        contadorCarrito.textContent = cantidadProductos > 99 ? "99+" : cantidadProductos;
    }

    function actualizarTotales() {
        const total = calcularTotal();
        const cantidadProductos = calcularCantidadProductos();

        if (resumenProductos) resumenProductos.textContent = cantidadProductos;
        if (resumenSubtotal) resumenSubtotal.textContent = `$${total}.00`;
        if (resumenTotal) resumenTotal.textContent = `$${total}.00`;
        if (totalOffcanvas) totalOffcanvas.textContent = `$${total}.00`;
    }

    function renderizarPaginaCarrito() {
        if (!listaCarrito) return;

        listaCarrito.innerHTML = "";

        if (carrito.length === 0) {
            listaCarrito.innerHTML = `
                <li class="carrito-vacio" id="mensaje-vacio">
                    Carrito vacío
                </li>
            `;
            return;
        }

        carrito.forEach(producto => {
            const li = document.createElement("li");
            li.classList.add("producto-carrito");

            li.innerHTML = `
                <img src="${producto.portada}" alt="${producto.titulo}" class="producto-carrito-img">

                <div class="producto-carrito-info">
                    <h3>${producto.titulo}</h3>
                    <p>Precio: $${producto.precio}.00</p>

                    <div class="producto-cantidad">
                        <button class="btn-restar-producto" data-id="${producto.id}">-</button>
                        <span>${producto.cantidad}</span>
                        <button class="btn-sumar-producto" data-id="${producto.id}">+</button>
                    </div>
                </div>

                <div class="producto-carrito-total">
                    <strong>$${producto.precio * producto.cantidad}.00</strong>

                    <button class="btn-eliminar-producto" data-id="${producto.id}">
                        Eliminar
                    </button>
                </div>
            `;

            listaCarrito.appendChild(li);
        });
    }

    function renderizarOffcanvas() {
        if (!listaOffcanvas) return;

        listaOffcanvas.innerHTML = "";

        if (carrito.length === 0) {
            listaOffcanvas.innerHTML = `
                <p class="text-muted text-center my-5">
                    Tu carrito está vacío actualmente.
                </p>
            `;
            return;
        }

        carrito.forEach(producto => {
            const div = document.createElement("div");
            div.classList.add("producto-offcanvas");

            div.innerHTML = `
                <img src="${producto.portada}" alt="${producto.titulo}" class="producto-offcanvas-img">

                <div class="producto-offcanvas-info">
                    <h6>${producto.titulo}</h6>
                    <p>$${producto.precio}.00 x ${producto.cantidad}</p>

                    <div class="producto-cantidad">
                        <button class="btn-restar-producto" data-id="${producto.id}">-</button>
                        <span>${producto.cantidad}</span>
                        <button class="btn-sumar-producto" data-id="${producto.id}">+</button>
                    </div>
                </div>

                <button class="btn-eliminar-producto" data-id="${producto.id}">
                    ×
                </button>
            `;

            listaOffcanvas.appendChild(div);
        });
    }

    function renderizarCarrito() {
        carrito = JSON.parse(localStorage.getItem("carrito")) || [];

        renderizarPaginaCarrito();
        renderizarOffcanvas();
        actualizarTotales();
        actualizarContador();
    }

    if (contenedorIconoCarrito && offcanvas && typeof bootstrap !== "undefined") {
        const miOffcanvas = new bootstrap.Offcanvas(offcanvas, {
            backdrop: true,
            scroll: true
        });

        let tiempoEspera;

        contenedorIconoCarrito.addEventListener("mouseenter", () => {
            clearTimeout(tiempoEspera);

            tiempoEspera = setTimeout(() => {
                miOffcanvas.show();
            }, 200);
        });

        contenedorIconoCarrito.addEventListener("mouseleave", () => {
            clearTimeout(tiempoEspera);
        });

        offcanvas.addEventListener("mouseleave", () => {
            miOffcanvas.hide();
        });
    }

    setTimeout(() => {
        renderizarCarrito();
    }, 100);
});