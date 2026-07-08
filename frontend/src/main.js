/* ==========================================================================
   HOME - FOROS DESTACADOS
   Backend real:
   - Foros desde /api/forums
   - Temas desde /api/posts/forum/{forumId}
   - Miembros activos desde localStorage
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const forumsHomeContainer = document.querySelector("#foros-populares");

  if (!forumsHomeContainer) return;

  const API_URL = window.location.port === "5173"
    ? "http://localhost:8080"
    : "";

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

  function getForumId(forum) {
    return forum.idForum ?? forum.id ?? forum.forumId;
  }

  function getForumName(forum) {
    return forum.nombre ?? forum.name ?? "Foro sin nombre";
  }

  function getForumDescription(forum) {
    return forum.descripcion ?? forum.description ?? "Sin descripción disponible.";
  }

  function getForumIcon(forum) {
    return forum.icono ?? forum.icon ?? "📚";
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
      console.error("Error leyendo publicaciones locales:", error);
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
      return Boolean(userMemberships?.[forumId]);
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

  function getValidStoredPosts(forumId) {
    return getStoredPosts(forumId).filter((post) => !isDemoOrEmptyPost(post));
  }

  async function getBackendPostsCount(forumId) {
    try {
      const response = await fetch(`${API_URL}/api/posts/forum/${forumId}`);

      if (!response.ok) {
        return 0;
      }

      const posts = await response.json();

      if (!Array.isArray(posts)) {
        return 0;
      }

      return posts.filter((post) => !isDemoOrEmptyPost(post)).length;

    } catch (error) {
      console.error(`Error cargando posts del foro ${forumId}:`, error);
      return 0;
    }
  }

  async function getForumTopicsCount(forumId) {
    const backendCount = await getBackendPostsCount(forumId);
    const localPosts = getValidStoredPosts(forumId);

    return backendCount + localPosts.length;
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

  async function cargarForos() {
    const response = await fetch(`${API_URL}/api/forums`);

    if (!response.ok) {
      throw new Error(`Error al cargar foros: ${response.status}`);
    }

    return await response.json();
  }

  try {
    const forums = await cargarForos();

    if (!Array.isArray(forums) || forums.length === 0) {
      forumsHomeContainer.innerHTML = `
        <p class="forums-error">
          No hay foros disponibles por el momento.
        </p>
      `;
      return;
    }

    const primerosTresForos = forums.slice(0, 3);

    const highlightedForums = await Promise.all(
      primerosTresForos.map(async (forum) => {
        const forumId = getForumId(forum);

        return {
          id: forumId,
          nombre: getForumName(forum),
          descripcion: getForumDescription(forum),
          icono: getForumIcon(forum),
          membersCount: getForumMembersCount(forumId),
          topicsCount: await getForumTopicsCount(forumId)
        };
      })
    );

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

/* ==========================================================================
   LIBROS DESTACADOS
   ========================================================================== */

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

        if (!card) {
            return {
                anchoCard: 0,
                maxScroll: 0
            };
        }

        const anchoCard = card.offsetWidth + gap;
        const maxScroll = trackLibros.scrollWidth - ventanaLibros.clientWidth;

        return { anchoCard, maxScroll };
    }

    function moverLibros() {
        const { anchoCard, maxScroll } = obtenerMedidas();

        if (anchoCard === 0) return;

        let desplazamiento = posicionLibro * anchoCard;

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

        if (anchoCard === 0) return;

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