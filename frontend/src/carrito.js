/* ==========================================================================
   CARRITO - BACKEND + JWT
   Mundo Entre Libros
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "http://localhost:8080";
    const TOKEN_KEY = "mel_token";
    const USER_KEY = "mel_logged_user";

    let carritoData = {
        items: [],
        totalProducts: 0,
        subtotal: 0,
        total: 0
    };

    const contadorCarrito = document.querySelector("#contador-carrito");

    const listaCarrito = document.querySelector("#lista-carrito");
    const resumenProductos = document.querySelector("#resumen-productos");
    const resumenSubtotal = document.querySelector("#resumen-subtotal");
    const resumenTotal = document.querySelector("#resumen-total");
    const metodoPagoSelect = document.querySelector("#metodo-pago");

    const listaOffcanvas = document.querySelector(".carrito-productos-lista");
    const totalOffcanvas = document.querySelector("#total-offcanvas");

    const offcanvas = document.querySelector("#offcanvasCarrito");
    const contenedorIconoCarrito = document.querySelector(".contenedor-carrito-offcanvas");

    // =========================
    // SESIÓN / TOKEN
    // =========================

    function obtenerToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function estaLogueado() {
        return Boolean(obtenerToken());
    }

    function limpiarSesion() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("token");
    }

    function mostrarLoginRequerido() {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "warning",
                title: "Inicia sesión",
                text: "Para usar el carrito necesitas iniciar sesión.",
                confirmButtonText: "Ir a mi cuenta",
                confirmButtonColor: "#4B1D13",
                background: "#F6EBD9",
                color: "#521F12"
            }).then(() => {
                window.location.href = "/account/account.html";
            });

            return;
        }

        alert("Necesitas iniciar sesión para usar el carrito.");
        window.location.href = "/account/account.html";
    }

    // =========================
    // FETCH CON JWT
    // =========================

    async function cartFetch(endpoint, options = {}) {
        const token = obtenerToken();

        if (!token) {
            return null;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {})
            }
        });

        if (response.status === 401 || response.status === 403) {
            limpiarSesion();
            mostrarLoginRequerido();
            throw new Error("Sesión expirada o sin permisos");
        }

        if (!response.ok) {
            let errorText = "Error en carrito";

            try {
                errorText = await response.text();
            } catch (error) {
                console.error("No se pudo leer error:", error);
            }

            throw new Error(errorText || "Error en carrito");
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
    // UTILIDADES
    // =========================

    function formatearPrecio(precio) {
        return Number(precio || 0).toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function escapeHTML(text) {
        return String(text || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function obtenerImagen(item) {
        let imagen = item.coverUrl || item.portada || item.imagen || "";

        if (!imagen) {
            return "/assets/img/no-image.png";
        }

        imagen = String(imagen).trim();

        if (
            imagen.startsWith("http://") ||
            imagen.startsWith("https://") ||
            imagen.startsWith("data:")
        ) {
            return imagen;
        }

        if (imagen.startsWith("/libros/")) {
            return `${API_URL}${imagen}`;
        }

        if (imagen.startsWith("libros/")) {
            return `${API_URL}/${imagen}`;
        }

        if (imagen.startsWith("/assets/")) {
            return imagen;
        }

        return imagen;
    }

    function normalizarItems(data) {
        return Array.isArray(data?.items) ? data.items : [];
    }

    function actualizarCarritoData(data) {
        carritoData = data || {
            items: [],
            totalProducts: 0,
            subtotal: 0,
            total: 0
        };

        carritoData.items = normalizarItems(carritoData);
        carritoData.totalProducts = Number(carritoData.totalProducts || 0);
        carritoData.subtotal = Number(carritoData.subtotal || 0);
        carritoData.total = Number(carritoData.total || 0);
    }

    function obtenerBookIdDesdeBoton(btn) {
        return btn.dataset.bookId || btn.dataset.id;
    }

    function obtenerSagaIdDesdeBoton(btn) {
        const raw =
            btn.dataset.sagaId ||
            btn.dataset.saga ||
            btn.dataset.id ||
            "";

        return String(raw).replace("saga-", "");
    }

    // =========================
    // API CARRITO
    // =========================

    async function cargarCarrito() {
        if (!estaLogueado()) {
            actualizarCarritoData(null);
            renderizarCarrito();
            return;
        }

        try {
            const data = await cartFetch("/api/cart");

            actualizarCarritoData(data);
            renderizarCarrito();

        } catch (error) {
            console.error("Error cargando carrito:", error);

            actualizarCarritoData(null);
            renderizarCarrito();
        }
    }

    async function agregarLibroCarrito(bookId) {
        if (!bookId) return;

        const data = await cartFetch(`/api/cart/books/${bookId}`, {
            method: "POST"
        });

        actualizarCarritoData(data);
        renderizarCarrito();
        animarContadorCarrito();
        mostrarToastCarrito();

        document.dispatchEvent(new CustomEvent("carrito-actualizado"));
    }

    async function agregarSagaCarrito(sagaId) {
        if (!sagaId) return;

        const data = await cartFetch(`/api/cart/sagas/${sagaId}`, {
            method: "POST"
        });

        actualizarCarritoData(data);
        renderizarCarrito();
        animarContadorCarrito();
        mostrarToastCarrito();

        document.dispatchEvent(new CustomEvent("carrito-actualizado"));
    }

    async function actualizarCantidadItem(itemId, quantity) {
        const data = await cartFetch(`/api/cart/items/${itemId}`, {
            method: "PUT",
            body: JSON.stringify({
                quantity
            })
        });

        actualizarCarritoData(data);
        renderizarCarrito();

        document.dispatchEvent(new CustomEvent("carrito-actualizado"));
    }

    async function eliminarItemCarrito(itemId) {
        const data = await cartFetch(`/api/cart/items/${itemId}`, {
            method: "DELETE"
        });

        actualizarCarritoData(data);
        renderizarCarrito();

        document.dispatchEvent(new CustomEvent("carrito-actualizado"));
    }

    async function realizarPedido() {
        if (!estaLogueado()) {
            mostrarLoginRequerido();
            return;
        }

        if (!carritoData.items || carritoData.items.length === 0) {
            mostrarMensajeCompra({
                icon: "warning",
                title: "Tu carrito está vacío",
                text: "Agrega algún libro o saga antes de realizar el pedido."
            });
            return;
        }

        const paymentMethod = metodoPagoSelect?.value || "cash";

        try {
            const btnPedido = document.querySelector(".resumenbtn");

            if (btnPedido) {
                btnPedido.disabled = true;
                btnPedido.textContent = "Enviando pedido...";
            }

            const pedido = await cartFetch("/api/orders/from-cart", {
                method: "POST",
                body: JSON.stringify({
                    paymentMethod
                })
            });

            await cargarCarrito();

            await mostrarMensajeCompra({
                icon: "success",
                title: "¡Pedido realizado!",
                text: `Tu pedido #${pedido.idOrder} por $${formatearPrecio(pedido.totalAmount)} se registró correctamente.`
            });

            localStorage.setItem("abrirHistorialCompras", "true");

            window.location.href = "/account/account.html";

        } catch (error) {
            console.error("Error realizando pedido:", error);

            mostrarMensajeCompra({
                icon: "error",
                title: "Error",
                text: "No se pudo realizar el pedido. Intenta nuevamente."
            });

        } finally {
            const btnPedido = document.querySelector(".resumenbtn");

            if (btnPedido) {
                btnPedido.disabled = false;
                btnPedido.textContent = "Realizar pedido";
            }
        }
    }

    // =========================
    // RENDER
    // =========================

    function actualizarTotales() {
        const total = Number(carritoData.total || 0);
        const cantidadProductos = Number(carritoData.totalProducts || 0);

        if (resumenProductos) {
            resumenProductos.textContent = cantidadProductos;
        }

        if (resumenSubtotal) {
            resumenSubtotal.textContent = `$${formatearPrecio(total)}`;
        }

        if (resumenTotal) {
            resumenTotal.textContent = `$${formatearPrecio(total)}`;
        }

        if (totalOffcanvas) {
            totalOffcanvas.textContent = `$${formatearPrecio(total)}`;
        }
    }

    function actualizarContador() {
        if (!contadorCarrito) return;

        const cantidadProductos = Number(carritoData.totalProducts || 0);

        contadorCarrito.textContent = cantidadProductos > 99 ? "99+" : cantidadProductos;
    }

    function renderizarPaginaCarrito() {
        if (!listaCarrito) return;

        listaCarrito.innerHTML = "";

        const items = carritoData.items || [];

        if (items.length === 0) {
            listaCarrito.innerHTML = `
                <li class="carrito-vacio" id="mensaje-vacio">
                    Carrito vacío
                </li>
            `;
            return;
        }

        items.forEach((item) => {
            const li = document.createElement("li");
            li.classList.add("producto-carrito");

            const imagen = obtenerImagen(item);
            const titulo = item.title || "Producto sin título";
            const precio = Number(item.price || 0);
            const cantidad = Number(item.quantity || 1);
            const subtotal = Number(item.subtotal || precio * cantidad);
            const tipo = item.type === "SAGA" ? "Saga" : "Libro";

            li.innerHTML = `
                <img 
                    src="${escapeHTML(imagen)}" 
                    alt="${escapeHTML(titulo)}" 
                    class="producto-carrito-img"
                    onerror="this.onerror=null; this.src='/assets/img/no-image.png';"
                >

                <div class="producto-carrito-info">
                    <h3>${escapeHTML(titulo)}</h3>
                    <p>${tipo}</p>
                    <p>Precio: $${formatearPrecio(precio)}</p>

                    <div class="producto-cantidad">
                        <button 
                            class="btn-restar-producto" 
                            data-item-id="${item.idCartItem}"
                            data-cantidad="${cantidad}">
                            -
                        </button>

                        <span>${cantidad}</span>

                        <button 
                            class="btn-sumar-producto" 
                            data-item-id="${item.idCartItem}"
                            data-cantidad="${cantidad}">
                            +
                        </button>
                    </div>
                </div>

                <div class="producto-carrito-total">
                    <strong>$${formatearPrecio(subtotal)}</strong>

                    <button 
                        class="btn-eliminar-producto" 
                        data-item-id="${item.idCartItem}">
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

        const items = carritoData.items || [];

        if (items.length === 0) {
            listaOffcanvas.innerHTML = `
                <p class="text-muted text-center my-5">
                    Tu carrito está vacío actualmente.
                </p>
            `;
            return;
        }

        items.forEach((item) => {
            const div = document.createElement("div");
            div.classList.add("producto-offcanvas");

            const imagen = obtenerImagen(item);
            const titulo = item.title || "Producto sin título";
            const precio = Number(item.price || 0);
            const cantidad = Number(item.quantity || 1);

            div.innerHTML = `
                <img 
                    src="${escapeHTML(imagen)}" 
                    alt="${escapeHTML(titulo)}" 
                    class="producto-offcanvas-img"
                    onerror="this.onerror=null; this.src='/assets/img/no-image.png';"
                >

                <div class="producto-offcanvas-info">
                    <h6>${escapeHTML(titulo)}</h6>
                    <p>$${formatearPrecio(precio)} x ${cantidad}</p>

                    <div class="producto-cantidad">
                        <button 
                            class="btn-restar-producto" 
                            data-item-id="${item.idCartItem}"
                            data-cantidad="${cantidad}">
                            -
                        </button>

                        <span>${cantidad}</span>

                        <button 
                            class="btn-sumar-producto" 
                            data-item-id="${item.idCartItem}"
                            data-cantidad="${cantidad}">
                            +
                        </button>
                    </div>
                </div>

                <button 
                    class="btn-eliminar-producto" 
                    data-item-id="${item.idCartItem}">
                    ×
                </button>
            `;

            listaOffcanvas.appendChild(div);
        });
    }

    function renderizarCarrito() {
        renderizarPaginaCarrito();
        renderizarOffcanvas();
        actualizarTotales();
        actualizarContador();
    }

    // =========================
    // TOAST / MENSAJES
    // =========================

    function mostrarToastCarrito() {
        const toast = document.getElementById("toast-carrito");

        if (!toast) return;

        toast.classList.add("mostrar");

        setTimeout(() => {
            toast.classList.remove("mostrar");
        }, 3000);
    }

    function animarContadorCarrito() {
        if (!contadorCarrito) return;

        contadorCarrito.classList.remove("animacion-pop");

        void contadorCarrito.offsetWidth;

        contadorCarrito.classList.add("animacion-pop");

        setTimeout(() => {
            contadorCarrito.classList.remove("animacion-pop");
        }, 300);
    }

    async function mostrarMensajeCompra({ icon, title, text }) {
        if (typeof Swal !== "undefined") {
            await Swal.fire({
                icon,
                title,
                text,
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#4B1D13",
                background: "#F6EBD9",
                color: "#521F12"
            });

            return;
        }

        alert(`${title}\n${text}`);
    }

    // =========================
    // EVENTOS
    // =========================

    if (offcanvas) {
        offcanvas.addEventListener("show.bs.offcanvas", () => {
            cargarCarrito();
        });
    }

    document.addEventListener("click", async (e) => {
        const botonCarrito = e.target.closest(".btn-carrito");
        const botonSaga = e.target.closest(".btn-carrito-saga");
        const botonCarritoWishlist = e.target.closest(".btn-carrito-wishlist");

        const botonEliminar = e.target.closest(".btn-eliminar-producto");
        const botonRestar = e.target.closest(".btn-restar-producto");
        const botonSumar = e.target.closest(".btn-sumar-producto");
        const botonPedido = e.target.closest(".resumenbtn");

        try {
            // =========================
            // AGREGAR LIBRO DESDE CATÁLOGO
            // =========================

            if (botonCarrito) {
                if (!estaLogueado()) {
                    mostrarLoginRequerido();
                    return;
                }

                const bookId = obtenerBookIdDesdeBoton(botonCarrito);

                if (!bookId) {
                    console.error("El botón de libro no tiene data-id o data-book-id");
                    return;
                }

                botonCarrito.disabled = true;

                await agregarLibroCarrito(bookId);

                botonCarrito.disabled = false;

                return;
            }

            // =========================
            // AGREGAR SAGA DESDE CATÁLOGO
            // =========================

            if (botonSaga) {
                if (!estaLogueado()) {
                    mostrarLoginRequerido();
                    return;
                }

                const sagaId = obtenerSagaIdDesdeBoton(botonSaga);

                if (!sagaId) {
                    console.error("El botón de saga no tiene data-saga, data-saga-id o data-id");
                    return;
                }

                botonSaga.disabled = true;

                await agregarSagaCarrito(sagaId);

                botonSaga.disabled = false;

                return;
            }

            // =========================
            // AGREGAR DESDE WISHLIST
            // =========================

            if (botonCarritoWishlist) {
                if (!estaLogueado()) {
                    mostrarLoginRequerido();
                    return;
                }

                const tipo = String(botonCarritoWishlist.dataset.tipo || "").toUpperCase();
                const bookId = botonCarritoWishlist.dataset.bookId;
                const sagaId = botonCarritoWishlist.dataset.sagaId;

                botonCarritoWishlist.disabled = true;
                botonCarritoWishlist.textContent = "Agregando...";

                if (tipo === "BOOK" && bookId) {
                    await agregarLibroCarrito(bookId);
                }

                if (tipo === "SAGA" && sagaId) {
                    await agregarSagaCarrito(sagaId);
                }

                botonCarritoWishlist.textContent = "Agregado";

                return;
            }

            // =========================
            // ELIMINAR ITEM
            // =========================

            if (botonEliminar) {
                if (!estaLogueado()) {
                    mostrarLoginRequerido();
                    return;
                }

                const itemId = botonEliminar.dataset.itemId;

                if (!itemId) return;

                botonEliminar.disabled = true;

                await eliminarItemCarrito(itemId);

                return;
            }

            // =========================
            // RESTAR CANTIDAD
            // =========================

            if (botonRestar) {
                if (!estaLogueado()) {
                    mostrarLoginRequerido();
                    return;
                }

                const itemId = botonRestar.dataset.itemId;
                const cantidadActual = Number(botonRestar.dataset.cantidad || 1);
                const nuevaCantidad = cantidadActual - 1;

                await actualizarCantidadItem(itemId, nuevaCantidad);

                return;
            }

            // =========================
            // SUMAR CANTIDAD
            // =========================

            if (botonSumar) {
                if (!estaLogueado()) {
                    mostrarLoginRequerido();
                    return;
                }

                const itemId = botonSumar.dataset.itemId;
                const cantidadActual = Number(botonSumar.dataset.cantidad || 1);
                const nuevaCantidad = cantidadActual + 1;

                await actualizarCantidadItem(itemId, nuevaCantidad);
                animarContadorCarrito();

                return;
            }

            // =========================
            // REALIZAR PEDIDO
            // =========================

            if (botonPedido) {
                await realizarPedido();
                return;
            }

        } catch (error) {
            console.error("Error en evento de carrito:", error);

            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo actualizar el carrito.",
                    confirmButtonColor: "#4B1D13",
                    background: "#F6EBD9",
                    color: "#521F12"
                });
            }

            document
                .querySelectorAll("button:disabled")
                .forEach((btn) => {
                    if (!btn.classList.contains("resumenbtn")) {
                        btn.disabled = false;
                    }
                });
        }
    });

    // =========================
    // OFFCANVAS HOVER
    // =========================

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

    // =========================
    // FUNCIÓN GLOBAL PARA OTROS ARCHIVOS
    // =========================

    window.cargarCarritoBackend = cargarCarrito;

    // =========================
    // INICIO
    // =========================

    setTimeout(() => {
        cargarCarrito();
    }, 100);

});