/*============================================================================
             SPA: Control de vistas principal - ACCOUNT
=============================================================================*/

document.addEventListener("DOMContentLoaded", () => {

  const vistaLogin = document.getElementById("vista-login");
  const vistaRegistro = document.getElementById("vista-registro");
  const vistaMiCuenta = document.getElementById("vista-mi-cuenta");

  function mostrarVista(id) {
    if (vistaLogin) {
      vistaLogin.style.display = id === "vista-login" ? "block" : "none";
    }

    if (vistaRegistro) {
      vistaRegistro.style.display = id === "vista-registro" ? "block" : "none";
    }

    if (vistaMiCuenta) {
      vistaMiCuenta.style.display = id === "vista-mi-cuenta" ? "block" : "none";
    }

    sessionStorage.setItem("vista_activa", id);
  }

  // Hacerla global porque otros bloques la usan
  window.mostrarVista = mostrarVista;

  function haySesionActiva() {
    const token = localStorage.getItem("mel_token");
    const usuario = localStorage.getItem("mel_logged_user");

    return Boolean(token && usuario);
  }

  // ============================================================
  // VISTA INICIAL AL ENTRAR A account.html
  // ============================================================

  if (haySesionActiva()) {
    // Si ya hay sesión, SIEMPRE debe entrar a Mi Cuenta
    // No usamos vista_activa porque pudo haberse quedado guardada como login.
    mostrarVista("vista-mi-cuenta");

    if (window.renderUserPointsGlobal) {
      window.renderUserPointsGlobal();
    }

    if (window.cargarWishlistBackend) {
      window.cargarWishlistBackend();
    }

  } else {
    mostrarVista("vista-login");
  }

  // ============================================================
  // LINKS LOGIN / REGISTRO
  // ============================================================

  document.getElementById("ir-a-registro")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      mostrarVista("vista-registro");
    });

  document.getElementById("ir-a-login")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      mostrarVista("vista-login");
    });

});

/* ==========================================================================
   MI CUENTA - PUNTOS ACUMULADOS
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const totalUserPoints = document.querySelector("#totalUserPoints");
  const userForumPointsList = document.querySelector("#userForumPointsList");

  const USER_STORAGE_KEY = "mel_logged_user";
  const MEMBERSHIPS_STORAGE_KEY = "mel_forum_memberships";

  function getLoggedUser() {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Error leyendo usuario desde localStorage:", error);
      return null;
    }
  }

  function getUserId(user) {
    if (!user) return null;

    return (
      user.idUser ??
      user.userId ??
      user.id ??
      user.id_user ??
      user.email ??
      null
    );
  }

  function getAllMemberships() {
    const storedMemberships = localStorage.getItem(MEMBERSHIPS_STORAGE_KEY);

    if (!storedMemberships) return {};

    try {
      return JSON.parse(storedMemberships);
    } catch (error) {
      console.error("Error leyendo membresías desde localStorage:", error);
      return {};
    }
  }

  function formatNumber(number) {
    return Number(number || 0).toLocaleString("es-MX");
  }

  function formatDate(dateString) {
    if (!dateString) return "fecha no disponible";

    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  async function getForumsData() {
    try {
      const response = await fetch("http://localhost:8080/api/forums");

      if (!response.ok) {
        throw new Error(`Error al cargar foros: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error cargando foros desde backend:", error);
      return [];
    }
  }

  function findForumById(forums, forumId) {
    return forums.find((forum) => {
      const idForum = forum.idForum ?? forum.id ?? forum.forumId;
      return String(idForum) === String(forumId);
    });
  }

  function renderEmptyState(message) {
    if (totalUserPoints) {
      totalUserPoints.textContent = "0";
    }

    if (userForumPointsList) {
      userForumPointsList.innerHTML = `
        <p class="empty-points-message">
          ${message}
        </p>
      `;
    }
  }

  function sortMembershipsByPoints(memberships) {
    return memberships.sort((a, b) => {
      return Number(b.points || 0) - Number(a.points || 0);
    });
  }

  function getUserMemberships(memberships, loggedUser) {
    const possibleKeys = [
      loggedUser.idUser,
      loggedUser.userId,
      loggedUser.id,
      loggedUser.id_user,
      loggedUser.email
    ]
      .filter(Boolean)
      .map(String);

    for (const key of possibleKeys) {
      if (memberships[key]) {
        return memberships[key];
      }
    }

    return {};
  }

  async function renderUserPoints() {
    const loggedUser = getLoggedUser();

    if (!loggedUser) {
      renderEmptyState(
        "Inicia sesión para consultar tus puntos acumulados y tus foros activos."
      );
      return;
    }

    const userId = getUserId(loggedUser);

    if (!userId) {
      renderEmptyState(
        "No se pudo identificar tu usuario para consultar tus puntos."
      );
      return;
    }

    const memberships = getAllMemberships();

    const userMemberships = getUserMemberships(memberships, loggedUser);

    const userForumMemberships = Object.values(userMemberships);

    if (userForumMemberships.length === 0) {
      renderEmptyState(
        "Aún no tienes puntos acumulados. Suscríbete a un foro, crea una publicación o responde para comenzar a ganar puntos."
      );
      return;
    }

    const forums = await getForumsData();

    const sortedMemberships = sortMembershipsByPoints(userForumMemberships);

    const totalPoints = sortedMemberships.reduce((total, membership) => {
      return total + Number(membership.points || 0);
    }, 0);

    if (totalUserPoints) {
      totalUserPoints.textContent = formatNumber(totalPoints);
    }

    if (!userForumPointsList) return;

    userForumPointsList.innerHTML = sortedMemberships
      .map((membership) => {
        const forum = findForumById(forums, membership.forumId);

        const forumName =
          forum?.nombre ||
          forum?.name ||
          "Foro desconocido";

        const forumIcon =
          forum?.icono ||
          forum?.icon ||
          "📚";

        const joinedAt = formatDate(membership.joinedAt);
        const points = Number(membership.points || 0);

        return `
          <article class="forum-points-item">
            <div class="forum-points-icon">
              ${forumIcon}
            </div>

            <div class="forum-points-info">
              <h4>${forumName}</h4>
              <p>Te uniste el ${joinedAt}</p>
            </div>

            <div class="forum-points-value">
              ${formatNumber(points)}
              <small>puntos</small>
            </div>
          </article>
        `;
      })
      .join("");
  }

  window.renderUserPointsGlobal = renderUserPoints;

  renderUserPoints();

  const btnPuntos = document.querySelector('button[data-target="puntos"]');

  if (btnPuntos) {
    btnPuntos.addEventListener("click", () => {
      renderUserPoints();
    });
  }
});
/*==========================================================================*/
//*! Formulario de registro + login automático con JWT
/*==========================================================================*/

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("formregister");

    if (!form) return;

    const API_URL = "http://localhost:8080";
    const TOKEN_KEY = "mel_token";
    const USER_KEY = "mel_logged_user";

    // Inputs
    const nombreInput = document.getElementById("regisNombres");
    const apellidosInput = document.getElementById("regisApellidos");
    const phoneInput = document.getElementById("regisphone");
    const emailInput = document.getElementById("regisEmail");
    const emailconfInput = document.getElementById("regisEmailconf");
    const passwordInput = document.getElementById("regisPassword");
    const passwordconfInput = document.getElementById("regisPasswordconf");

    // Toggle password
    const togglePasswordBtn = document.getElementById("togglePassword");
    const togglePasswordconfBtn = document.getElementById("togglePasswordconf");

    const submitBtn = form.querySelector("button[type='submit']");
    const submitTextOriginal = submitBtn ? submitBtn.textContent : "Registrarse";

    // =========================
    // TOGGLE PASSWORD VISIBILITY
    // =========================

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
        });
    }

    if (togglePasswordconfBtn && passwordconfInput) {
        togglePasswordconfBtn.addEventListener("click", () => {
            const isPassword = passwordconfInput.type === "password";
            passwordconfInput.type = isPassword ? "text" : "password";
        });
    }

    // =========================
    // LIMPIAR SESIÓN ANTERIOR
    // =========================

    function limpiarSesionAnterior() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("token");
    }

    // =========================
    // GUARDAR SESIÓN
    // =========================

    function guardarSesion(token, usuario) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(usuario));

        // Limpiar token viejo para evitar conflictos
        localStorage.removeItem("token");
    }

    // =========================
    // REGISTRAR USUARIO
    // =========================

    async function registrarUsuario(nuevoUsuario) {

        const response = await fetch(`${API_URL}/api/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(nuevoUsuario)
        });

        if (!response.ok) {
            let errorText = "Error al registrar usuario";

            try {
                errorText = await response.text();
            } catch (error) {
                console.error("No se pudo leer el error:", error);
            }

            throw new Error(errorText || "Error al registrar usuario");
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            return await response.json();
        }

        return null;
    }

    // =========================
    // LOGIN AUTOMÁTICO
    // =========================

    async function loginUsuario(email, password) {

        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (!response.ok) {
            throw new Error("No se pudo iniciar sesión automáticamente");
        }

        return await response.json();
    }

    // =========================
    // OBTENER USUARIO LOGUEADO
    // =========================

    async function obtenerUsuarioLogueado(token) {

        const response = await fetch(`${API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("No se pudo obtener el usuario logueado");
        }

        return await response.json();
    }

    // =========================
    // SUBMIT FORM
    // =========================

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = nombreInput.value.trim();
        const apellidos = apellidosInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const emailconf = emailconfInput.value.trim();
        const password = passwordInput.value.trim();
        const passwordconf = passwordconfInput.value.trim();

        let errores = [];

        // =========================
        // VALIDACIONES BÁSICAS
        // =========================

        if (!nombre || !apellidos || !phone || !email || !emailconf || !password || !passwordconf) {
            errores.push("Todos los campos son obligatorios.");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email && !emailRegex.test(email)) {
            errores.push("Ingresa un correo válido.");
        }

        if (email !== emailconf) {
            errores.push("Los correos no coinciden.");
        }

        if (password.length < 8) {
            errores.push("La contraseña debe tener mínimo 8 caracteres.");
        }

        if (password !== passwordconf) {
            errores.push("Las contraseñas no coinciden.");
        }

        if (errores.length > 0) {
            Swal.fire({
                title: "Error de registro",
                html: errores.join("<br>"),
                icon: "error",
                confirmButtonText: "Entendido",
                background: "#F6EBD9",
                confirmButtonColor: "#4b1d13"
            });

            return;
        }

        const nuevoUsuario = {
            name: nombre,
            lastName: apellidos,
            phone: phone,
            email: email,
            password: password
        };

        try {

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Creando cuenta...";
            }

            limpiarSesionAnterior();

            // 1. Registrar usuario
            await registrarUsuario(nuevoUsuario);

            // 2. Iniciar sesión automáticamente
            const loginResponse = await loginUsuario(email, password);

            if (!loginResponse.token) {
                throw new Error("El backend no devolvió token");
            }

            // 3. Obtener usuario real desde /api/auth/me
            const usuario = await obtenerUsuarioLogueado(loginResponse.token);

            // 4. Guardar sesión igual que el login normal
            guardarSesion(loginResponse.token, usuario);

            // 5. Mostrar botón cerrar sesión
            document
                .getElementById("li-cerrar-sesion")
                ?.classList.remove("d-none");

            form.reset();

            // 6. Alerta
            await Swal.fire({
                title: "¡Registro exitoso!",
                text: "Tu cuenta fue creada correctamente. Bienvenido a Mundo Entre Libros.",
                icon: "success",
                confirmButtonText: "Continuar",
                background: "#F6EBD9",
                confirmButtonColor: "#4b1d13"
            });

            // 7. Redirigir al inicio
            window.location.href = "/index.html";

        } catch (error) {

            console.error("Error registrando usuario:", error);

            limpiarSesionAnterior();

            Swal.fire({
                title: "Error",
                text: "No se pudo registrar el usuario o iniciar sesión automáticamente.",
                icon: "error",
                confirmButtonText: "Entendido",
                background: "#F6EBD9",
                confirmButtonColor: "#4b1d13"
            });

        } finally {

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitTextOriginal;
            }

        }

    });

});
/* ==========================================================================
   MI CUENTA - WISHLIST CON BACKEND + JWT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const wishlistContainer = document.querySelector("#wishlist-container");
  const wishlistVacia = document.querySelector("#wishlist-vacia");

  if (!wishlistContainer || !wishlistVacia) {
    return;
  }

  const API_URL = "http://localhost:8080";
  const TOKEN_KEY = "mel_token";

  let wishlistItems = [];

  // =========================
  // TOKEN / SESIÓN
  // =========================

  function obtenerToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function estaLogueado() {
    return Boolean(obtenerToken());
  }

  function limpiarSesion() {
    localStorage.removeItem("mel_token");
    localStorage.removeItem("mel_logged_user");
  }

  // =========================
  // FETCH CON JWT
  // =========================

  async function wishlistFetch(endpoint, options = {}) {
    const token = obtenerToken();

    if (!token) {
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
      limpiarSesion();
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

  function normalizarTipo(item) {
    return String(item.type || item.tipo || "").toUpperCase();
  }

  function obtenerTitulo(item) {
    return item.title || item.titulo || "Producto sin título";
  }

  function obtenerAutor(item) {
    return item.author || item.autor || "";
  }

  function obtenerImagen(item) {
  let imagen = item.coverUrl || item.imagen || item.portada || "";

  if (!imagen) {
    return "/assets/img/no-image.png";
  }

  imagen = String(imagen).trim();

  // Si ya viene completa, se respeta
  if (
    imagen.startsWith("http://") ||
    imagen.startsWith("https://") ||
    imagen.startsWith("data:")
  ) {
    return imagen;
  }

  // Si viene como /libros/sagas/Saga_Ca.jpg
  // Se convierte en http://localhost:8080/libros/sagas/Saga_Ca.jpg
  if (imagen.startsWith("/libros/")) {
    return `${API_URL}${imagen}`;
  }

  // Si viene como libros/sagas/Saga_Ca.jpg
  if (imagen.startsWith("libros/")) {
    return `${API_URL}/${imagen}`;
  }

  // Si en algún caso viene como /assets/... del frontend
  if (imagen.startsWith("/assets/")) {
    return imagen;
  }

  return imagen;
}

  function obtenerPrecio(item) {
    return Number(item.price ?? item.precio ?? 0);
  }

  function obtenerIdCarrito(item) {
    const tipo = normalizarTipo(item);

    if (tipo === "SAGA") {
      return `saga-${item.sagaId}`;
    }

    return String(item.bookId);
  }

  // =========================
  // API WISHLIST
  // =========================

  async function cargarWishlist() {
    wishlistItems = [];

    if (!estaLogueado()) {
      renderWishlist();
      return;
    }

    try {
      const data = await wishlistFetch("/api/wishlist");

      wishlistItems = Array.isArray(data?.items) ? data.items : [];

      renderWishlist();

    } catch (error) {
      console.error("Error cargando wishlist:", error);

      wishlistItems = [];
      renderWishlist();

      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar tu wishlist.",
          confirmButtonColor: "#4B1D13",
          background: "#F6EBD9",
          color: "#521F12"
        });
      }
    }
  }

  async function eliminarLibroWishlist(bookId) {
    const data = await wishlistFetch(`/api/wishlist/books/${bookId}`, {
      method: "DELETE"
    });

    wishlistItems = Array.isArray(data?.items) ? data.items : [];
    renderWishlist();

    return data;
  }

  async function eliminarSagaWishlist(sagaId) {
    const data = await wishlistFetch(`/api/wishlist/sagas/${sagaId}`, {
      method: "DELETE"
    });

    wishlistItems = Array.isArray(data?.items) ? data.items : [];
    renderWishlist();

    return data;
  }

  // =========================
  // RENDER
  // =========================

  function renderWishlist() {
    wishlistContainer.innerHTML = "";

    if (!wishlistItems || wishlistItems.length === 0) {
      wishlistVacia.style.display = "flex";
      return;
    }

    wishlistVacia.style.display = "none";

    wishlistItems.forEach((item) => {
      const tipo = normalizarTipo(item);
      const esSaga = tipo === "SAGA";

      const titulo = obtenerTitulo(item);
      const autor = obtenerAutor(item);
      const imagen = obtenerImagen(item);
      const precio = obtenerPrecio(item);

      const bookId = item.bookId;
      const sagaId = item.sagaId;

      const card = document.createElement("div");
      card.classList.add("wishlist-card");

      card.innerHTML = `
        <img 
          src="${escapeHTML(imagen)}" 
          alt="${escapeHTML(titulo)}" 
          class="wishlist-img"
        >

        <div class="wishlist-info">
          <div>
            <h3>${escapeHTML(titulo)}</h3>

            <p>
              ${autor ? escapeHTML(autor) : "Sin autor disponible."}
            </p>

            <p>
              ${esSaga ? "Saga completa" : "Libro"}
            </p>

            <p class="wishlist-precio">
              $${formatearPrecio(precio)}
            </p>
          </div>

          <div class="wishlist-actions">
            <button
              class="btn-carrito-wishlist"
              data-id="${escapeHTML(obtenerIdCarrito(item))}"
              data-tipo="${escapeHTML(tipo)}"
              data-book-id="${bookId ?? ""}"
              data-saga-id="${sagaId ?? ""}"
              data-titulo="${escapeHTML(titulo)}"
              data-precio="${precio}"
              data-portada="${escapeHTML(imagen)}">
              Agregar al carrito
            </button>

            <button
              class="btn-eliminar-wishlist"
              data-tipo="${escapeHTML(tipo)}"
              data-book-id="${bookId ?? ""}"
              data-saga-id="${sagaId ?? ""}">
              Eliminar
            </button>
          </div>
        </div>
      `;

      wishlistContainer.appendChild(card);
    });
  }

  // =========================
  // EVENTOS
  // =========================

  wishlistContainer.addEventListener("click", async (e) => {
    const botonCarrito = e.target.closest(".btn-carrito-wishlist");
    const botonEliminar = e.target.closest(".btn-eliminar-wishlist");

    if (!estaLogueado()) {
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "warning",
          title: "Inicia sesión",
          text: "Para usar tu wishlist necesitas iniciar sesión.",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#4B1D13",
          background: "#F6EBD9",
          color: "#521F12"
        });
      }

      return;
    }

    if (botonEliminar) {
      const tipo = botonEliminar.dataset.tipo;
      const bookId = botonEliminar.dataset.bookId;
      const sagaId = botonEliminar.dataset.sagaId;

      try {
        botonEliminar.disabled = true;
        botonEliminar.textContent = "Eliminando...";

        if (tipo === "BOOK") {
          await eliminarLibroWishlist(bookId);
        }

        if (tipo === "SAGA") {
          await eliminarSagaWishlist(sagaId);
        }

        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "success",
            title: "Eliminado",
            text: "El producto fue eliminado de tu wishlist.",
            confirmButtonColor: "#4B1D13",
            background: "#F6EBD9",
            color: "#521F12"
          });
        }

      } catch (error) {
        console.error("Error eliminando wishlist:", error);

        botonEliminar.disabled = false;
        botonEliminar.textContent = "Eliminar";

        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo eliminar el producto de tu wishlist.",
            confirmButtonColor: "#4B1D13",
            background: "#F6EBD9",
            color: "#521F12"
          });
        }
      }

      return;
    }

    if (botonCarrito) {
      const producto = {
        id: botonCarrito.dataset.id,
        tipo: botonCarrito.dataset.tipo,
        bookId: botonCarrito.dataset.bookId || null,
        sagaId: botonCarrito.dataset.sagaId || null,
        titulo: botonCarrito.dataset.titulo,
        precio: Number(botonCarrito.dataset.precio),
        portada: botonCarrito.dataset.portada,
        cantidad: 1
      };

      let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

      const existe = carrito.find(
        (item) => String(item.id) === String(producto.id)
      );

      if (existe) {
        existe.cantidad++;
      } else {
        carrito.push(producto);
      }

      localStorage.setItem("carrito", JSON.stringify(carrito));

      botonCarrito.textContent = "Agregado";
      botonCarrito.disabled = true;

      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "success",
          title: "Agregado",
          text: "El producto fue agregado al carrito.",
          confirmButtonColor: "#4B1D13",
          background: "#F6EBD9",
          color: "#521F12"
        });
      }

      return;
    }
  });

  // =========================
  // EXPONER FUNCIÓN PARA RECARGAR DESPUÉS DEL LOGIN
  // =========================

  window.cargarWishlistBackend = cargarWishlist;

  // =========================
  // INICIO
  // =========================

  cargarWishlist();

});
/* ==========================================================================
   MI CUENTA - LOG IN (CON BACKEND REAL + JWT + VALIDACIONES)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  const API_URL = "http://localhost:8080";
  const TOKEN_KEY = "mel_token";
  const USER_KEY = "mel_logged_user";

  // =========================
  // ESTILOS
  // =========================

  const style = document.createElement("style");
  style.innerHTML = `
        .is-invalid-login-js { border-color: #b22222 !important; box-shadow: 0 0 0 3px rgba(178, 34, 34, 0.15) !important; }
        .is-valid-login-js { border-color: #2e5a44 !important; box-shadow: 0 0 0 3px rgba(46, 90, 68, 0.15) !important; }
        .toggle-password-icon {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.1rem;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #521f12;
            opacity: 0.7;
            transition: opacity 0.2s;
            z-index: 10;
        }
        .toggle-password-icon:hover { opacity: 1; }
        .caps-warning-message {
            display: block;
            color: #a0653d;
            font-size: 0.85rem;
            font-weight: 700;
            margin-top: 4px;
        }
    `;
  document.head.appendChild(style);

  // =========================
  // ELEMENTOS
  // =========================

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const capsLockWarning = document.getElementById("capsLockWarning");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const submitBtn = loginForm.querySelector(".login-btn");

  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // =========================
  // LIMPIAR SESIÓN ANTERIOR
  // =========================

  function limpiarSesionAnterior() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("token");
  }

  // =========================
  // GUARDAR SESIÓN
  // =========================

  function guardarSesion(token, usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));

    // Limpiar token viejo para evitar conflictos
    localStorage.removeItem("token");
  }

  // =========================
  // TOGGLE PASSWORD
  // =========================

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";

      passwordInput.type = isPassword ? "text" : "password";
      togglePasswordBtn.textContent = isPassword ? "🙈" : "👁";
    });
  }

  // =========================
  // CAPS LOCK
  // =========================

  if (passwordInput && capsLockWarning) {
    passwordInput.addEventListener("keyup", (event) => {
      capsLockWarning.style.display =
        event.getModifierState("CapsLock") ? "block" : "none";
    });

    passwordInput.addEventListener("blur", () => {
      capsLockWarning.style.display = "none";
    });
  }

  // =========================
  // VALIDACIÓN DE PASSWORD
  // =========================

  function evaluarSeguridadPassword(password) {
    if (password.length === 0) {
      return {
        isValid: false,
        msg: "La contraseña es obligatoria."
      };
    }

    if (password.length < 8) {
      return {
        isValid: false,
        msg: "Mínimo 8 caracteres."
      };
    }

    const blacklist = ["12345678", "password", "admin1234"];

    if (blacklist.includes(password.toLowerCase())) {
      return {
        isValid: false,
        msg: "Contraseña muy común."
      };
    }

    return {
      isValid: true,
      msg: ""
    };
  }

  function checarEmail() {
    const value = emailInput.value.trim();

    if (!value) {
      emailError.textContent = "El correo es obligatorio";
      emailInput.classList.add("is-invalid-login-js");
      emailInput.classList.remove("is-valid-login-js");
      return false;
    }

    if (!regexEmail.test(value)) {
      emailError.textContent = "Correo inválido";
      emailInput.classList.add("is-invalid-login-js");
      emailInput.classList.remove("is-valid-login-js");
      return false;
    }

    emailError.textContent = "";
    emailInput.classList.remove("is-invalid-login-js");
    emailInput.classList.add("is-valid-login-js");
    return true;
  }

  function checarPassword() {
    const res = evaluarSeguridadPassword(passwordInput.value);

    passwordError.textContent = res.isValid ? "" : res.msg;

    if (!res.isValid) {
      passwordInput.classList.add("is-invalid-login-js");
      passwordInput.classList.remove("is-valid-login-js");
      return false;
    }

    passwordInput.classList.remove("is-invalid-login-js");
    passwordInput.classList.add("is-valid-login-js");
    return true;
  }

  // =========================
  // API LOGIN REAL
  // =========================

  async function loginUsuario(email, password) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!response.ok) {
      throw new Error("Credenciales incorrectas");
    }

    return await response.json();
  }

  async function obtenerUsuarioLogueado(token) {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("No se pudo obtener el usuario logueado");
    }

    return await response.json();
  }

  // =========================
  // VALIDACIÓN EN TIEMPO REAL
  // =========================

  emailInput?.addEventListener("input", checarEmail);
  passwordInput?.addEventListener("input", checarPassword);

  // =========================
  // SUBMIT
  // =========================

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const isEmailValid = checarEmail();
    const isPasswordValid = checarPassword();

    if (!isEmailValid || !isPasswordValid) {
      Swal.fire({
        icon: "warning",
        title: "Corrige los campos",
        text: "Verifica tus datos antes de continuar",
        confirmButtonColor: "#4B1D13"
      });

      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Iniciando sesión...";

      limpiarSesionAnterior();

      const loginResponse = await loginUsuario(
        emailInput.value.trim(),
        passwordInput.value.trim()
      );

      if (!loginResponse.token) {
        throw new Error("El backend no devolvió token");
      }

      const usuario = await obtenerUsuarioLogueado(loginResponse.token);

      guardarSesion(loginResponse.token, usuario);

      document
        .getElementById("li-cerrar-sesion")
        ?.classList.remove("d-none");

      await Swal.fire({
        icon: "success",
        title: "Bienvenido",
        text: "Inicio de sesión correcto",
        confirmButtonColor: "#4B1D13"
      });

      if (window.renderUserPointsGlobal) {
        window.renderUserPointsGlobal();
      }

      loginForm.reset();

      emailInput.classList.remove("is-valid-login-js");
      passwordInput.classList.remove("is-valid-login-js");

      // Redirigir al inicio
      window.location.href = "/index.html";

    } catch (error) {
      console.error("Error de login:", error);

      limpiarSesionAnterior();

      Swal.fire({
        icon: "error",
        title: "Error de login",
        text: "Email o contraseña incorrectos",
        confirmButtonColor: "#4B1D13"
      });

    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Iniciar sesión";
    }
  });
});
// Historial
document.addEventListener("DOMContentLoaded", () => {

    const btnHistorial = document.querySelector('button[data-target="historial"]');
    const contenedor = document.getElementById("contenido");

    const modal = document.getElementById("modal-historial");
    const modalBody = document.getElementById("modal-body");
    const closeModal = document.querySelector(".close-modal");

    if (!btnHistorial || !contenedor) {
        console.warn("No se encontró el botón con data-target='historial' o el div '#contenido'.");
        return;
    }

    const API_URL = "http://localhost:8080";
    const TOKEN_KEY = "mel_token";

    // =========================
    // HELPERS
    // =========================

    function obtenerToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function formatearPrecio(precio) {
        return Number(precio || 0).toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatearFecha(fecha) {
        if (!fecha) return "Sin fecha";

        const date = new Date(fecha);

        if (isNaN(date.getTime())) {
            return "Sin fecha";
        }

        return date.toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric"
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

    function obtenerImagenBackend(coverUrl) {
        if (!coverUrl) return "/assets/img/no-image.png";

        let imagen = String(coverUrl).trim();

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

        return imagen;
    }

    function traducirEstado(status) {
        const estado = String(status || "pending").toLowerCase();

        const estados = {
            pending: "Pendiente",
            completed: "Pagado",
            cancelled: "Cancelado",
            pagado: "Pagado",
            pendiente: "Pendiente"
        };

        return estados[estado] || estado;
    }

    function traducirMetodoPago(method) {
        const metodo = String(method || "cash").toLowerCase();

        const metodos = {
            cash: "Efectivo",
            card: "Tarjeta",
            transfer: "Transferencia",
            points: "Puntos"
        };

        return metodos[metodo] || metodo;
    }

    function sumarDias(fecha, dias) {
        const nuevaFecha = new Date(fecha);
        nuevaFecha.setDate(nuevaFecha.getDate() + dias);
        return nuevaFecha;
    }

    function estaPagado(status) {
        const estado = String(status || "").toLowerCase();
        return estado === "completed" || estado === "pagado";
    }

    async function ordersFetch(endpoint, options = {}) {
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
            localStorage.removeItem("mel_token");
            localStorage.removeItem("mel_logged_user");
            throw new Error("Sesión expirada");
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Error en historial");
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            return await response.json();
        }

        return null;
    }

    async function obtenerOrdenes() {
        const data = await ordersFetch("/api/orders", {
            method: "GET"
        });

        return Array.isArray(data) ? data : [];
    }

    async function pagarPedido(idOrderReal) {
        return await ordersFetch(`/api/orders/${idOrderReal}/pay`, {
            method: "PUT"
        });
    }

    // =========================
    // EVENTO CLICK HISTORIAL
    // =========================

    btnHistorial.addEventListener("click", () => {
        const seccionPadre = document.getElementById("sec-historial");

        if (seccionPadre) {
            seccionPadre.style.display = "block";
            seccionPadre.classList.add("active");
        }

        mostrarHistorial();
    });

    // =========================
    // MOSTRAR HISTORIAL
    // =========================

    async function mostrarHistorial() {
        contenedor.innerHTML = "";

        try {
            const orders = await obtenerOrdenes();

            if (!orders || orders.length === 0) {
                contenedor.innerHTML = `
                    <p class="empty" style="padding: 20px; text-align: center; color: #521f12; font-weight: 700;">
                        No hay compras registradas en tu historial.
                    </p>
                `;
                return;
            }

            orders.forEach((order, index) => {
                const numeroPedidoUsuario = orders.length - index;

                const productos = Array.isArray(order.items)
                    ? order.items.map(item => ({
                        id: item.type === "SAGA"
                            ? `saga-${item.sagaId}`
                            : String(item.bookId),

                        tipo: String(item.type || "").toUpperCase(),
                        titulo: item.title || "Producto sin título",
                        autor: item.author || "",
                        precio: Number(item.unitPrice || 0),
                        cantidad: Number(item.quantity || 1),
                        subtotal: Number(item.subtotal || 0),
                        portada: obtenerImagenBackend(item.coverUrl)
                    }))
                    : [];

                const totalProductos = order.totalProducts || productos.reduce((total, item) => {
                    return total + Number(item.cantidad || 0);
                }, 0);

                const compra = {
                    idCompra: numeroPedidoUsuario,
                    idOrderReal: order.idOrder,
                    fecha: formatearFecha(order.orderDate),
                    fechaOriginal: order.orderDate,
                    total: Number(order.totalAmount || 0),
                    totalProductos: totalProductos,
                    metodoPago: order.paymentMethod || "cash",
                    status: order.status || "pending",
                    productos: productos
                };

                const card = document.createElement("div");
                card.classList.add("card-historial");

                card.innerHTML = `
                    <span class="pedido-numero">#Pedido ${compra.idCompra}</span>
                    <span class="pedido-total">$${formatearPrecio(compra.total)}</span>
                    <span class="pedido-productos">${compra.totalProductos} productos</span>
                    <span class="pedido-estado">${traducirEstado(compra.status)}</span>
                    <button class="btn-ver">Ver detalles</button>
                `;

                contenedor.appendChild(card);

                card.querySelector(".btn-ver").addEventListener("click", () => {
                    abrirModal(compra);
                });
            });

        } catch (error) {
            console.error("Error mostrando historial:", error);

            contenedor.innerHTML = `
                <p class="empty" style="padding: 20px; text-align: center; color: #521f12; font-weight: 700;">
                    No se pudo cargar tu historial de compras.
                </p>
            `;
        }
    }

    // =========================
    // MODAL
    // =========================

    function abrirModal(compra) {
        const isPagado = estaPagado(compra.status);

        const fechaPedidoTexto = compra.fecha || "Sin fecha";
        let entregaTexto = "Pendiente";

        if (isPagado && compra.fechaOriginal) {
            const fechaBase = new Date(compra.fechaOriginal);

            if (!isNaN(fechaBase.getTime())) {
                const entrega = sumarDias(fechaBase, 15);
                entregaTexto = entrega.toLocaleDateString("es-MX");
            }
        }

        const libros = compra.productos.filter(p => p.tipo === "BOOK");
        const sagas = compra.productos.filter(p => p.tipo === "SAGA");

        if (modalBody) {
            modalBody.innerHTML = `
                <div class="tabla-info">
                    <div class="col">
                        <p><b>Compra:</b> #${compra.idCompra}</p>
                        <p><b>Fecha:</b> ${escapeHTML(fechaPedidoTexto)}</p>
                        <p><b>Entrega:</b> ${escapeHTML(entregaTexto)}</p>
                    </div>

                    <div class="col">
                        <p><b>Estado:</b> ${escapeHTML(traducirEstado(compra.status))}</p>
                        <p><b>Método de pago:</b> ${escapeHTML(traducirMetodoPago(compra.metodoPago))}</p>
                        <p><b>Total:</b> $${formatearPrecio(compra.total)}</p>
                    </div>
                </div>

                <hr>

                <h3>📚 Libros</h3>

                <div class="grid-libros">
                    ${
                        libros.length
                            ? libros.map(p => `
                                <div class="item-libro">
                                    <img 
                                        src="${escapeHTML(p.portada)}" 
                                        alt="${escapeHTML(p.titulo)}"
                                        onerror="this.onerror=null; this.src='/assets/img/no-image.png';"
                                    >

                                    <div>
                                        <p><b>${escapeHTML(p.titulo)}</b></p>
                                        <small>$${formatearPrecio(p.precio)} x ${p.cantidad}</small>
                                    </div>
                                </div>
                            `).join("")
                            : "<p>Sin libros</p>"
                    }
                </div>

                <h3>📦 Sagas</h3>

                <div class="grid-libros">
                    ${
                        sagas.length
                            ? sagas.map(p => `
                                <div class="item-libro saga">
                                    <img 
                                        src="${escapeHTML(p.portada)}" 
                                        alt="${escapeHTML(p.titulo)}"
                                        onerror="this.onerror=null; this.src='/assets/img/no-image.png';"
                                    >

                                    <div>
                                        <p><b>${escapeHTML(p.titulo)}</b></p>
                                        <small>$${formatearPrecio(p.precio)} x ${p.cantidad}</small>
                                    </div>
                                </div>
                            `).join("")
                            : "<p>Sin sagas</p>"
                    }
                </div>

                <div class="pagar-wrapper">
                    ${
                        !isPagado
                            ? `<button id="btn-pagar" class="btn-ver pagar">Pagar</button>`
                            : `<p class="pagado">✔ Pagado</p>`
                    }
                </div>
            `;
        }

        if (modal) {
            modal.style.display = "flex";
        }

        const btnPagar = document.getElementById("btn-pagar");

        if (btnPagar) {
            btnPagar.addEventListener("click", async () => {
                try {
                    btnPagar.disabled = true;
                    btnPagar.textContent = "Pagando...";

                    await pagarPedido(compra.idOrderReal);

                    if (modal) {
                        modal.style.display = "none";
                    }

                    await Swal.fire({
                        icon: "success",
                        title: "Pedido pagado",
                        text: "El estado del pedido cambió a Pagado.",
                        confirmButtonColor: "#4B1D13",
                        background: "#F6EBD9",
                        color: "#521F12"
                    });

                    mostrarHistorial();

                } catch (error) {
                    console.error("Error pagando pedido:", error);

                    btnPagar.disabled = false;
                    btnPagar.textContent = "Pagar";

                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "No se pudo cambiar el estado del pedido.",
                        confirmButtonColor: "#4B1D13",
                        background: "#F6EBD9",
                        color: "#521F12"
                    });
                }
            });
        }
    }

    // =========================
    // CERRAR MODAL
    // =========================

    if (closeModal) {
        closeModal.addEventListener("click", () => {
            if (modal) {
                modal.style.display = "none";
            }
        });
    }

    window.addEventListener("click", (e) => {
        if (modal && e.target === modal) {
            modal.style.display = "none";
        }
    });

    window.mostrarHistorial = mostrarHistorial;
});
document.addEventListener('DOMContentLoaded', () => {
    // === CONTROL DEL SIDEBAR INTERNO DE MI CUENTA (IZQUIERDO) ===
    // Eliminamos el bloque duplicado de vistas principales para que no choque con la sección SPA de arriba
    const botonesMenu = document.querySelectorAll('.sidebar-menu .menu-btn');
    const seccionesContenido = document.querySelectorAll('.main-content .content-section');

    botonesMenu.forEach(boton => {
        boton.addEventListener('click', () => {
            // Remover la clase active de todos los botones
            botonesMenu.forEach(btn => btn.classList.remove('active'));
            // Añadir active al botón presionado
            boton.classList.add('active');

            // Obtener el target del botón (actualizar, historial, puntos, wishlist)
            const target = boton.getAttribute('data-target');

            // Ocultar todas las sub-secciones del contenido principal
            seccionesContenido.forEach(seccion => {
                seccion.style.display = 'none';
            });

            // Mostrar la sección correspondiente emparejando el ID "sec-[target]"
            const seccionAMostrar = document.getElementById(`sec-${target}`);
            if (seccionAMostrar) {
                seccionAMostrar.style.display = 'block';
            }
        });
    });
    
    // Vinculación opcional: si tienes un botón de menú exterior para forzar la vista de cuenta
    const navMiCuentaBtn = document.getElementById('nav-mi-cuenta-btn');
    if (navMiCuentaBtn) {
        navMiCuentaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Si el storage tiene un usuario, va directo a cuenta, si no, al login
            const sessionActive = localStorage.getItem("mel_logged_user");
            mostrarVista(sessionActive ? "vista-mi-cuenta" : "vista-login");
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. Control del Menú Lateral / SPA (Mostrar/Ocultar Vistas)
    // ==========================================================================
    const menuButtons = document.querySelectorAll(".menu-btn");
    const contentSections = document.querySelectorAll(".content-section");

    menuButtons.forEach(button => {
        button.addEventListener("click", () => {
            menuButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            contentSections.forEach(section => section.style.display = "none");

            const targetSectionId = `sec-${button.getAttribute("data-target")}`;
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.style.display = "block";
                
                if(button.getAttribute("data-target") === "actualizar") {
                    cargarDatosUsuario();
                }
            }
        });
    });

    // ==========================================================================
    // 2. Carga Asíncrona de act.json con protección anti-errores
    // ==========================================================================
    function cargarDatosUsuario() {
        const datosLocales = localStorage.getItem("usuario_perfil");

        if (datosLocales) {
            inyectarDatosEnPantalla(JSON.parse(datosLocales));
        } else {
            fetch("/data/act.json") 
                .then(response => {
                    if (!response.ok) throw new Error("Error al abrir act.json");
                    return response.text(); 
                })
                .then(texto => {
                    // Si el archivo está vacío, pasa un objeto vacío sin romper el flujo
                    const datosDesdeJson = texto ? JSON.parse(texto) : {};
                    inyectarDatosEnPantalla(datosDesdeJson);
                })
                .catch(error => {
                    console.error("Aviso: act.json está vacío o no se encontró. Iniciando limpio.", error);
                    inyectarDatosEnPantalla({ nombre: "", apellido: "", telefono: "", email: "" });
                });
        }
    }

    function inyectarDatosEnPantalla(datos) {
        document.getElementById("update-nombre").value = datos.nombre || "";
        document.getElementById("update-apellido").value = datos.apellido || "";
        document.getElementById("update-telefono").value = datos.telefono || "";
        document.getElementById("update-email").value = datos.email || "";
        document.getElementById("update-email-confirm").value = datos.email || "";
    }

    // ==========================================================================
    // 3. Sistema de Restricciones y Validaciones (Submit del Formulario)
    // ==========================================================================
    const formUpdate = document.getElementById("form-update-profile");
    if (formUpdate) {
        formUpdate.addEventListener("submit", (e) => {
            e.preventDefault(); // Detiene la recarga de página

            // Captura de valores limpios sin espacios en los extremos
            const nombre = document.getElementById("update-nombre").value.trim();
            const apellido = document.getElementById("update-apellido").value.trim();
            const telefono = document.getElementById("update-telefono").value.trim();
            const email = document.getElementById("update-email").value.trim();
            const emailConfirm = document.getElementById("update-email-confirm").value.trim();
            const password = document.getElementById("update-password").value;
            const passwordConfirm = document.getElementById("update-password-confirm").value;

            // --- EXPRESIONES REGULARES (RESTRICCIONES) ---
            const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/; // Solo letras y acentos
            const regexTelefono = /^\d{10}$/; // Exactamente 10 números continuos
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Estructura válida de correo electrónico
            const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/; // Min 8 caracteres, 1 Mayús, 1 Minús, 1 Núm

            // Validación: Campos Obligatorios Base vacíos
            if (!nombre || !apellido || !telefono || !email || !emailConfirm) {
                mostrarAlerta("Campos incompletos", "Por favor, rellena todos los campos de tus datos personales.", "error");
                return;
            }

            // Restricción: Nombre y Apellido válidos
            if (!regexLetras.test(nombre) || !regexLetras.test(apellido)) {
                mostrarAlerta("Formato inválido", "El nombre y el apellido solo deben contener letras.", "warning");
                return;
            }

            //  Restricción: Teléfono de 10 dígitos
            if (!regexTelefono.test(telefono)) {
                mostrarAlerta("Teléfono inválido", "El número de teléfono debe tener exactamente 10 dígitos numéricos.", "warning");
                return;
            }

            // Restricción: Estructura del Email
            if (!regexEmail.test(email)) {
                mostrarAlerta("Correo inválido", "Por favor, ingresa una dirección de correo electrónico válida.", "warning");
                return;
            }

            // Validación: Coincidencia de correos
            if (email !== emailConfirm) {
                mostrarAlerta("Correos no coinciden", "El correo ingresado y su confirmación no son iguales.", "error");
                return;
            }

            // Restricciones de Contraseña (Solo si el usuario escribe algo en el campo)
            if (password || passwordConfirm) {
                // Validación: Coincidencia de contraseñas
                if (password !== passwordConfirm) {
                    mostrarAlerta("Contraseñas diferentes", "La nueva contraseña y su confirmación no coinciden.", "error");
                    return;
                }
                
                // Restricción: Formato y longitud de 8 dígitos seguros
                if (!regexPassword.test(password)) {
                    mostrarAlerta(
                        "Contraseña insegura", 
                        "La contraseña debe tener mínimo 8 caracteres, e incluir al menos una letra mayúscula, una minúscula y un número.", 
                        "info"
                    );
                    return;
                }
            }

            // ==========================================================================
            // 4. Guardado Exitoso con Limpieza y Cierre de Sección
            // ==========================================================================
            const datosActualizados = { nombre, apellido, telefono, email };
            
            // Guardamos localmente para persistencia inmediata en la SPA
            localStorage.setItem("usuario_perfil", JSON.stringify(datosActualizados));

            // Alerta de éxito con SweetAlert2
            Swal.fire({
                icon: 'success',
                title: '¡Datos guardados con éxito!',
                text: 'Tu perfil en Mundo Entre Libros ha sido actualizado.',
                confirmButtonColor: '#3B1A11'
            }).then((result) => {
                // Este bloque se ejecuta JUSTO CUANDO EL USUARIO LE DA CLIC AL BOTÓN "OK"
                if (result.isConfirmed) {
                    
                    // 1. Limpiamos por completo todos los campos del formulario
                    formUpdate.reset();

                    // 2. Escondemos la sección de actualizar datos para que no se vea más
                    const secActualizar = document.getElementById("sec-actualizar");
                    if (secActualizar) {
                        secActualizar.style.display = "none";
                    }

                    // 3. Quitamos la selección visual (clase active) del menú lateral
                    menuButtons.forEach(btn => btn.classList.remove("active"));
                }
            });
        });
    }
          
    // Función auxiliar para acortar las llamadas de alertas de SweetAlert2
    function mostrarAlerta(titulo, mensaje, tipo) {
        Swal.fire({
            icon: tipo,
            title: titulo,
            text: mensaje,
            confirmButtonColor: '#3B1A11'
        });
    }
});