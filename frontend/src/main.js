/* ==========================================================================
   HOME - FOROS DESTACADOS
   Usa la misma lógica que forums.js:
   - No cuenta entradas vacías
   - No muestra posts demo
   - Miembros activos desde localStorage
   - Temas reales desde JSON + localStorage
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const forumsHomeContainer = document.querySelector("#foros-populares");

  if (!forumsHomeContainer) return;

  const USER_STORAGE_KEY = "mel_logged_user";
  const MEMBERSHIPS_STORAGE_KEY = "mel_forum_memberships";

  function getLoggedUser() {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Error leyendo usuario:", error);
      return null;
    }
  }

  function isUserLoggedIn() {
    return getLoggedUser() !== null;
  }

  function getForumStorageKey(forumId) {
    return `mel_forum_posts_${forumId}`;
  }

  function getStoredPosts(forumId) {
    const storedPosts = localStorage.getItem(getForumStorageKey(forumId));

    if (!storedPosts) return [];

    try {
      return JSON.parse(storedPosts);
    } catch (error) {
      console.error("Error leyendo publicaciones:", error);
      return [];
    }
  }

  function getAllMemberships() {
    const memberships = localStorage.getItem(MEMBERSHIPS_STORAGE_KEY);

    if (!memberships) return {};

    try {
      return JSON.parse(memberships);
    } catch (error) {
      console.error("Error leyendo suscripciones:", error);
      return {};
    }
  }

  function getForumMembersCount(forumId) {
    const memberships = getAllMemberships();

    return Object.values(memberships).filter((userMemberships) => {
      return Boolean(userMemberships[forumId]);
    }).length;
  }

  function normalizeHTMLContent(post) {
    return (
      post?.comentario ||
      post?.contenido ||
      post?.content ||
      post?.body ||
      post?.descripcionPost ||
      ""
    );
  }

  function hasRealContent(html) {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = html || "";

    const text = tempElement.textContent
      .replace(/\u00A0/g, " ")
      .trim();

    const hasText = text.length > 0;
    const hasImage = tempElement.querySelector("img[src]") !== null;

    return hasText || hasImage;
  }

  function isDemoOrEmptyPost(post) {
    const title = String(post?.titulo || post?.title || "").trim().toLowerCase();
    const content = normalizeHTMLContent(post);

    const demoTitles = [
      "publicación de ejemplo",
      "publicacion de ejemplo",
      "post de ejemplo",
      "entrada de ejemplo",
      "demo",
      "ejemplo",
      "título",
      "titulo",
      "sin título",
      "sin titulo"
    ];

    const looksLikeDemo = demoTitles.some((demoTitle) =>
      title === demoTitle || title.includes(demoTitle)
    );

    const hasTitle = title.length > 0;
    const hasContent = hasRealContent(content);

    return !hasTitle || !hasContent || looksLikeDemo;
  }

  function getValidJsonPosts(forum) {
    const posts = Array.isArray(forum.posts) ? forum.posts : [];

    return posts.filter((post) => !isDemoOrEmptyPost(post));
  }

  function getValidStoredPosts(forumId) {
    return getStoredPosts(forumId).filter((post) => !isDemoOrEmptyPost(post));
  }

  function getForumTopicsCount(forum) {
    const jsonPosts = getValidJsonPosts(forum);
    const localPosts = getValidStoredPosts(forum.id);

    return jsonPosts.length + localPosts.length;
  }

  function formatNumber(number) {
    return Number(number || 0).toLocaleString("es-MX");
  }

  function showLoginRequiredAlert() {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "Para entrar y participar en los foros necesitas iniciar sesión.",
        confirmButtonText: "Ir a mi cuenta",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#4B1D13",
        cancelButtonColor: "#A0653D",
        background: "#F6EBD9",
        color: "#521F12"
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/account/account.html";
        }
      });

      return;
    }

    const goToLogin = confirm(
      "Para entrar y participar en los foros necesitas iniciar sesión. ¿Quieres ir a la página de cuenta?"
    );

    if (goToLogin) {
      window.location.href = "/account/account.html";
    }
  }

  function goToForum(forumId) {
    if (!isUserLoggedIn()) {
      showLoginRequiredAlert();
      return;
    }

    window.location.href = `/forums/forums.html?genero=${forumId}`;
  }

  try {
    const response = await fetch("/data/forums.json");

    if (!response.ok) {
      throw new Error(`Error al cargar JSON: ${response.status}`);
    }

    const forums = await response.json();

    const highlightedForums = forums
      .map((forum) => ({
        ...forum,
        membersCount: getForumMembersCount(forum.id),
        topicsCount: getForumTopicsCount(forum)
      }))
      .slice(0, 3);

    forumsHomeContainer.innerHTML = highlightedForums
      .map((forum) => {
        return `
          <article class="foro-card-mini">
            <div class="foro-icono">
              ${forum.icono}
            </div>

            <div class="foro-content">
              <h4>${forum.nombre}</h4>

              <p>${forum.descripcion}</p>

              <div class="foro-stats">
                <span>👥 ${formatNumber(forum.membersCount)} miembros activos</span>
                <span>💬 ${formatNumber(forum.topicsCount)} temas</span>
              </div>

              <button 
                type="button" 
                class="home-forum-button"
                data-forum-id="${forum.id}"
              >
                Entrar al foro
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    document.querySelectorAll(".home-forum-button").forEach((button) => {
      button.addEventListener("click", () => {
        const forumId = button.dataset.forumId;
        goToForum(forumId);
      });
    });
  } catch (error) {
    console.error("Error cargando foros en home:", error);

    forumsHomeContainer.innerHTML = `
      <p class="forums-error">
        No pudimos cargar los foros por el momento.
      </p>
    `;
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