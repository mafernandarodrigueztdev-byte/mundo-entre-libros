/* ==========================================================================
   LAYOUT COMPARTIDO: NAVBAR + FOOTER
   --------------------------------------------------------------------------
   Antes este bloque estaba copiado y pegado en las 7 páginas del sitio
   (index, aboutUs, account, catalog, contact, forums, shoppingCart), lo que
   provocaba pequeñas diferencias entre páginas y obligaba a repetir el
   mismo cambio 7 veces cada vez que se quería tocar el menú o el pie de
   página.

   Ahora cada página solo necesita:
     <div id="navbar-root"></div>
     ...
     <div id="footer-root"></div>
     <script type="module" src="/src/components/layout.js"></script>

   Este script se coloca como el PRIMER <script> del final del <body>,
   antes que main.js / carrito.js / auth.js / el JS propio de cada página,
   para garantizar que el navbar y el footer ya existan en el DOM cuando
   esos scripts se ejecuten (todos son "module" o "defer", por lo que se
   ejecutan en orden, después de parsear el HTML).
   ========================================================================== */

const navbarHTML = `
<nav class="navbar navbar-expand-lg sticky-top" aria-label="Navegación principal">
    <div class="container">

        <!-- Logo -->
        <a class="navbar-brand fw-bold" href="/">
            <img
                src="/assets/icons/logo-mel.png"
                alt="Logo Mundo Entre Libros"
                class="navbar-logo"
                loading="lazy">
        </a>

        <!-- Botón hamburguesa -->
        <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Abrir menú">
            <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Contenido de la navbar -->
        <div class="collapse navbar-collapse" id="navbarNav">

            <!-- Menú principal -->
            <ul class="navbar-nav mx-auto">

                <li class="nav-item">
                    <a class="nav-link" aria-current="page" href="/">
                        Inicio
                    </a>
                </li>

                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownCatalog" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Catálogo
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="navbarDropdownCatalog">
                        <li><a class="dropdown-item" href="/catalog/catalog.html">Sagas</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="/catalog/catalog.html">Ver todo el catálogo</a></li>
                    </ul>
                </li>

                <li class="nav-item">
                    <a class="nav-link" href="/forums/forums.html">
                        Foros
                    </a>
                </li>

                <li class="nav-item">
                    <a class="nav-link" href="/aboutUs/aboutUs.html">
                        Nosotros
                    </a>
                </li>

                <li class="nav-item">
                    <a class="nav-link" href="/contact/contact.html">
                        Contacto
                    </a>
                </li>

                <!-- Usuario -->
                <li class="nav-item nav-icon-item">
                    <a class="nav-link nav-icon-link" href="/account/account.html">
                        <img
                            src="/assets/icons/icono-cuenta-navbar.png"
                            alt="Mi Cuenta"
                            class="navbar-icon"
                            loading="lazy">
                    </a>
                </li>

                <!-- Carrito Offcanvas -->
                <li class="nav-item contenedor-carrito-offcanvas">
                    <a class="nav-link" href="/shoppingCart/shopping.html"
                       data-bs-toggle="offcanvas"
                       data-bs-target="#offcanvasCarrito"
                       aria-controls="offcanvasCarrito"
                       aria-label="Ver carrito de compras">
                        <div class="caja-icono-carrito">
                            <img src="/assets/icons/icono-carrito-navbar.png"
                                 alt="" class="navbar-icon">
                            <span id="contador-carrito">0</span>
                        </div>
                    </a>
                </li>

                <li class="nav-item d-none" id="li-cerrar-sesion">
                    <a class="nav-link cerrar-sesion-link" href="#" id="btn-cerrar-sesion">
                        Cerrar sesión
                    </a>
                </li>
            </ul>

        </div>

    </div>
</nav>
`;

const footerHTML = `
<footer class="main-footer">
    <div class="footer-container">

        <div class="footer-section logo-section">
            <img src="/assets/icons/logo-mel-horizontal.png" alt="Mundo Entre Libros"
                class="img-fluid footer-logo">
        </div>

        <div class="footer-section links-section">
            <h3>Explora</h3>
            <ul>
                <li><a href="/">Inicio</a></li>
                <li><a href="/catalog/catalog.html">Catálogo</a></li>
                <li><a href="/forums/forums.html">Foros</a></li>
                <li><a href="/aboutUs/aboutUs.html">Nosotros</a></li>
                <li><a href="/contact/contact.html">Contacto</a></li>
            </ul>
        </div>

        <div class="footer-section pixel-section">
            <p class="pixel-interaction-title">¡Pasa a saludarnos!</p>
            <div class="pixel-team">
                <a href="https://github.com/mafernandarodrigueztdev-byte" target="_blank"
                    rel="noopener noreferrer" class="pixel-member pixel-mafer"
                    title="GitHub de María Fernanda Rodríguez Trinidad"
                    aria-label="Ir al perfil de GitHub de María Fernanda Rodríguez Trinidad">
                </a>

                <a href="https://github.com/iladricg14-lab" target="_blank" rel="noopener noreferrer"
                    class="pixel-member pixel-ilse" title="GitHub de Ilse Adriana Careo Galicia"
                    aria-label="Ir al perfil de GitHub de Ilse Adriana Careo Galicia">
                </a>

                <a href="https://github.com/Rock2612" target="_blank" rel="noopener noreferrer"
                    class="pixel-member pixel-rodrigo" title="GitHub de Rodrigo González Pastrana"
                    aria-label="Ir al perfil de GitHub de Rodrigo González Pastrana">
                </a>

                <a href="https://github.com/IsraelMRQ" target="_blank" rel="noopener noreferrer"
                    class="pixel-member pixel-israel" title="GitHub de José Israel Manrique Roque"
                    aria-label="Ir al perfil de GitHub de José Israel Manrique Roque">
                </a>

                <a href="https://github.com/Miguel02mg" target="_blank" rel="noopener noreferrer"
                    class="pixel-member pixel-miguel" title="GitHub de Miguel Ángel Martínez Garduño"
                    aria-label="Ir al perfil de GitHub de Miguel Ángel Martínez Garduño">
                </a>

                <a href="https://github.com/Carlos-Software-Engineer-1999" target="_blank"
                    rel="noopener noreferrer" class="pixel-member pixel-carlos"
                    title="GitHub de Carlos Navarrete Tapia"
                    aria-label="Ir al perfil de GitHub de Carlos Navarrete Tapia">
                </a>

                <a href="https://github.com/Tonantzinap" target="_blank" rel="noopener noreferrer"
                    class="pixel-member pixel-tonantzin" title="GitHub de Tonantzin Alquisira Palma"
                    aria-label="Ir al perfil de GitHub de Tonantzin Alquisira Palma">
                </a>
            </div>
        </div>

    </div>

    <div class="footer-bottom">
        <p>&copy; Mundo Entre Libros - 2026</p>
    </div>
</footer>
`;

function inject(placeholderId, html) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;
    placeholder.outerHTML = html.trim();
}

inject("navbar-root", navbarHTML);
inject("footer-root", footerHTML);

/* ==========================================================================
   ENLACE ACTIVO EN EL NAVBAR
   Se movió aquí desde main.js porque ahora el navbar se inyecta desde este
   mismo módulo: así queda todo lo relacionado al layout en un solo lugar.
   ========================================================================== */
(function marcarEnlaceActivo() {
    const rutaActual = window.location.pathname;
    const navLinks = document.querySelectorAll(".navbar .nav-link");

    navLinks.forEach((link) => {
        const linkHref = link.getAttribute("href");

        if (rutaActual === linkHref || (rutaActual === "/" && linkHref === "/")) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
})();
