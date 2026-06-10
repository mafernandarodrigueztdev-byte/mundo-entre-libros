/* ==========================================================================
   PÁGINA DE FOROS - MUNDO ENTRE LIBROS
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  /* ==========================================================================
     SELECTORES PRINCIPALES
     ========================================================================== */

  const forumsHomeView = document.querySelector("#forumsHomeView");
  const forumDetailView = document.querySelector("#forumDetailView");

  const forumsList = document.querySelector("#foros-lista");
  const genreMenu = document.querySelector("#genreMenu");

  const backToForumsBtn = document.querySelector("#backToForumsBtn");
  const loadMorePostsBtn = document.querySelector(".load-more-posts");
  const subscribeForumBtn = document.querySelector("#subscribeForumBtn");

  const forumDetailIcon = document.querySelector("#forumDetailIcon");
  const forumDetailTitle = document.querySelector("#forumDetailTitle");
  const forumDetailDescription = document.querySelector("#forumDetailDescription");

  const summaryMembers = document.querySelector("#summaryMembers");
  const summaryTopics = document.querySelector("#summaryTopics");
  const summaryPoints = document.querySelector("#summaryPoints");

  const recentPostsSection = document.querySelector(".recent-posts-section");
  const recentPostsList = document.querySelector("#recentPostsList");

  const createPostCard = document.querySelector(".create-post-card");
  const forumPostForm = document.querySelector("#forumPostForm");
  const createPostTitle = document.querySelector("#createPostTitle");
  const postTitleInput = document.querySelector("#postTitle");
  const postCommentEditor = document.querySelector("#postCommentEditor");
  const postSubmitButton = forumPostForm?.querySelector(".publish-button");

  const postDetailPanel = document.querySelector("#postDetailPanel");
  const backToPostsBtn = document.querySelector("#backToPostsBtn");
  const postDetailAvatar = document.querySelector("#postDetailAvatar");
  const postDetailTitle = document.querySelector("#postDetailTitle");
  const postDetailMeta = document.querySelector("#postDetailMeta");
  const postDetailBody = document.querySelector("#postDetailBody");

  const repliesList = document.querySelector("#repliesList");
  const replyForm = document.querySelector("#replyForm");
  const replyEditor = document.querySelector("#replyEditor");
  const replyFormTitle = document.querySelector(".reply-form-card h2");
  const replySubmitButton = replyForm?.querySelector(".publish-button");

  /* ==========================================================================
     VARIABLES DE ESTADO
     ========================================================================== */

  let forums = [];
  let selectedForum = null;
  let selectedPost = null;
  let showAllPosts = false;

  let editingPostId = null;
  let editingReplyId = null;

  /* ==========================================================================
     LLAVES DE LOCALSTORAGE
     ========================================================================== */

  const USER_STORAGE_KEY = "mel_logged_user";
  const MEMBERSHIPS_STORAGE_KEY = "mel_forum_memberships";

  /* ==========================================================================
     USUARIO / SESIÓN
     ========================================================================== */

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

  function getCurrentUserId() {
    return getLoggedUser()?.id || null;
  }

  function isUserLoggedIn() {
    return getLoggedUser() !== null;
  }

  /* ==========================================================================
     LOCALSTORAGE: PUBLICACIONES
     ========================================================================== */

  function getForumStorageKey(forumId) {
    return `mel_forum_posts_${forumId}`;
  }

  function getStoredPosts(forumId) {
    const storedPosts = localStorage.getItem(getForumStorageKey(forumId));

    if (!storedPosts) return [];

    try {
      return JSON.parse(storedPosts);
    } catch (error) {
      console.error("Error leyendo publicaciones desde localStorage:", error);
      return [];
    }
  }

  function saveStoredPosts(forumId, posts) {
    localStorage.setItem(getForumStorageKey(forumId), JSON.stringify(posts));
  }

  /* ==========================================================================
     LOCALSTORAGE: RESPUESTAS
     ========================================================================== */

  function getReplyStorageKey(forumId, postId) {
    return `mel_forum_replies_${forumId}_${postId}`;
  }

  function getStoredReplies(forumId, postId) {
    const storedReplies = localStorage.getItem(getReplyStorageKey(forumId, postId));

    if (!storedReplies) return [];

    try {
      return JSON.parse(storedReplies);
    } catch (error) {
      console.error("Error leyendo respuestas desde localStorage:", error);
      return [];
    }
  }

  function saveStoredReplies(forumId, postId, replies) {
    localStorage.setItem(getReplyStorageKey(forumId, postId), JSON.stringify(replies));
  }

  function removeStoredReplies(forumId, postId) {
    localStorage.removeItem(getReplyStorageKey(forumId, postId));
  }

  /* ==========================================================================
     LOCALSTORAGE: SUSCRIPCIONES Y PUNTOS
     ========================================================================== */

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

  function saveAllMemberships(memberships) {
    localStorage.setItem(MEMBERSHIPS_STORAGE_KEY, JSON.stringify(memberships));
  }

  function isUserSubscribedToForum(forumId) {
    const userId = getCurrentUserId();

    if (!userId) return false;

    const memberships = getAllMemberships();

    return Boolean(memberships[userId]?.[forumId]);
  }

  function subscribeUserToForum(forumId) {
    const user = getLoggedUser();

    if (!user) return;

    const memberships = getAllMemberships();

    if (!memberships[user.id]) {
      memberships[user.id] = {};
    }

    if (!memberships[user.id][forumId]) {
      memberships[user.id][forumId] = {
        forumId,
        joinedAt: new Date().toISOString(),
        points: 0
      };
    }

    saveAllMemberships(memberships);
  }

  function unsubscribeUserFromForum(forumId) {
    const userId = getCurrentUserId();

    if (!userId) return;

    const memberships = getAllMemberships();

    if (memberships[userId]?.[forumId]) {
      delete memberships[userId][forumId];

      if (Object.keys(memberships[userId]).length === 0) {
        delete memberships[userId];
      }
    }

    saveAllMemberships(memberships);
  }

  function getForumMembersCount(forumId) {
    const memberships = getAllMemberships();

    return Object.values(memberships).filter((userMemberships) => {
      return Boolean(userMemberships[forumId]);
    }).length;
  }

  function getUserForumPoints(forumId) {
    const userId = getCurrentUserId();

    if (!userId) return 0;

    const memberships = getAllMemberships();

    return memberships[userId]?.[forumId]?.points || 0;
  }

  function updateUserForumPoints(forumId, pointsToAdd) {
    const userId = getCurrentUserId();

    if (!userId) return;

    const memberships = getAllMemberships();

    if (!memberships[userId]?.[forumId]) return;

    const currentPoints = Number(memberships[userId][forumId].points) || 0;

    memberships[userId][forumId].points = Math.max(0, currentPoints + pointsToAdd);

    saveAllMemberships(memberships);
  }

  /* ==========================================================================
     UTILIDADES GENERALES
     ========================================================================== */

  function formatNumber(number) {
    return Number(number || 0).toLocaleString("es-MX");
  }

  function createId() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  function escapeHTML(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getTodayLabel() {
    return new Date().toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
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
    const title = String(post?.titulo || post?.title || "")
      .trim()
      .toLowerCase();

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

    const looksLikeDemo = demoTitles.some((demoTitle) => {
      return title === demoTitle || title.includes(demoTitle);
    });

    const hasTitle = title.length > 0;
    const hasContent = hasRealContent(content);

    return !hasTitle || !hasContent || looksLikeDemo;
  }

  function hasPostContent(post) {
    return !isDemoOrEmptyPost(post);
  }

  function sanitizeRichHTML(html) {
    const template = document.createElement("template");
    template.innerHTML = html || "";

    const allowedTags = [
      "B",
      "STRONG",
      "I",
      "EM",
      "U",
      "UL",
      "OL",
      "LI",
      "A",
      "BR",
      "P",
      "DIV",
      "IMG"
    ];

    function cleanNode(node) {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType !== Node.ELEMENT_NODE) return;

        if (!allowedTags.includes(child.tagName)) {
          child.replaceWith(...child.childNodes);
          return;
        }

        [...child.attributes].forEach((attribute) => {
          const name = attribute.name.toLowerCase();
          const value = attribute.value;

          if (child.tagName === "A" && name === "href") {
            const isSafeLink =
              value.startsWith("http://") ||
              value.startsWith("https://") ||
              value.startsWith("mailto:");

            if (!isSafeLink) {
              child.removeAttribute("href");
            } else {
              child.setAttribute("target", "_blank");
              child.setAttribute("rel", "noopener noreferrer");
            }

            return;
          }

          if (child.tagName === "IMG" && name === "src") {
            const isSafeImage =
              value.startsWith("data:image/") ||
              value.startsWith("http://") ||
              value.startsWith("https://");

            if (!isSafeImage) {
              child.remove();
            }

            return;
          }

          if (child.tagName === "IMG" && name === "alt") {
            return;
          }

          child.removeAttribute(attribute.name);
        });

        cleanNode(child);
      });
    }

    cleanNode(template.content);

    return template.innerHTML.trim();
  }

  function getEditorHTML(editor) {
    if (!editor) return "";

    return sanitizeRichHTML(editor.innerHTML.trim());
  }

  function clearEditor(editor) {
    if (!editor) return;

    editor.innerHTML = "";
  }

  function getValidStoredPosts(forumId) {
    return getStoredPosts(forumId)
      .map((post) => ({
        ...post,
        comentario: normalizeHTMLContent(post)
      }))
      .filter(hasPostContent);
  }

  function getValidJsonPosts(forum) {
    const jsonPosts = Array.isArray(forum.posts) ? forum.posts : [];

    return jsonPosts
      .map((post, index) => ({
        ...post,
        id: post.id || `${forum.id}-json-post-${index}`,
        comentario: normalizeHTMLContent(post),
        source: "json"
      }))
      .filter(hasPostContent);
  }

  function getAllPostsFromForum(forum) {
    const localPosts = getValidStoredPosts(forum.id).map((post, index) => ({
      ...post,
      id: post.id || `${forum.id}-local-post-${index}`,
      source: "local"
    }));

    const jsonPosts = getValidJsonPosts(forum);

    return [...localPosts, ...jsonPosts];
  }

  function getForumTopicsCount(forum) {
    return getAllPostsFromForum(forum).length;
  }

  function getReplyCount(forumId, post) {
    const baseComments = Number(post.comentarios) || 0;
    const storedReplies = getStoredReplies(forumId, post.id);

    return baseComments + storedReplies.length;
  }

  function isCurrentUserOwner(item) {
    const userId = getCurrentUserId();

    return Boolean(userId && item?.userId === userId);
  }

  function findLocalPostById(forumId, postId) {
    return getStoredPosts(forumId).find((post) => post.id === postId);
  }

  /* ==========================================================================
     SWEETALERT
     ========================================================================== */

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

  function showSubscribeRequiredAlert() {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "warning",
        title: "Suscríbete al foro",
        text: "Para publicar o responder necesitas estar suscrita a este foro.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#4B1D13",
        background: "#F6EBD9",
        color: "#521F12"
      });

      return;
    }

    alert("Para publicar o responder necesitas estar suscrita a este foro.");
  }

  function showIncompletePostAlert() {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "error",
        title: "Campos incompletos",
        text: "Completa el título y el contenido antes de publicar.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#4B1D13",
        background: "#F6EBD9",
        color: "#521F12"
      });

      return;
    }

    alert("Completa el título y el contenido antes de publicar.");
  }

  function showIncompleteReplyAlert() {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "error",
        title: "Respuesta vacía",
        text: "Escribe una respuesta antes de enviarla.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#4B1D13",
        background: "#F6EBD9",
        color: "#521F12"
      });

      return;
    }

    alert("Escribe una respuesta antes de enviarla.");
  }

  function showSuccessAlert(title, text) {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "success",
        title,
        text,
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#4B1D13",
        background: "#F6EBD9",
        color: "#521F12"
      });

      return;
    }

    alert(text);
  }

  function showErrorAlert(title, text) {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "error",
        title,
        text,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#4B1D13",
        background: "#F6EBD9",
        color: "#521F12"
      });

      return;
    }

    alert(text);
  }

  async function showConfirmAlert(title, text, confirmButtonText = "Confirmar") {
    if (typeof Swal !== "undefined") {
      const result = await Swal.fire({
        icon: "warning",
        title,
        text,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#4B1D13",
        cancelButtonColor: "#A0653D",
        background: "#F6EBD9",
        color: "#521F12"
      });

      return result.isConfirmed;
    }

    return confirm(text);
  }

  /* ==========================================================================
     EDITOR ENRIQUECIDO
     ========================================================================== */

  function initializeRichEditors() {
    document.querySelectorAll(".editor-toolbar button").forEach((button) => {
      button.addEventListener("click", () => {
        const toolbar = button.closest(".editor-toolbar");
        const editorId = toolbar?.dataset.editorTarget;
        const editor = document.querySelector(`#${editorId}`);

        if (!editor) return;

        editor.focus();

        const command = button.dataset.command;

        if (command === "createLink") {
          const url = prompt("Pega el enlace:");

          if (!url) return;

          const safeUrl =
            url.startsWith("http://") || url.startsWith("https://")
              ? url
              : `https://${url}`;

          document.execCommand("createLink", false, safeUrl);
          return;
        }

        if (command === "insertImage") {
          const inputId = button.dataset.inputId;
          const imageInput = document.querySelector(`#${inputId}`);

          if (!imageInput) return;

          imageInput.dataset.editorTarget = editorId;
          imageInput.click();
          return;
        }

        document.execCommand(command, false, null);
      });
    });

    document.querySelectorAll('input[type="file"][accept="image/*"]').forEach((input) => {
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        const editorId = input.dataset.editorTarget;
        const editor = document.querySelector(`#${editorId}`);

        if (!file || !editor) return;

        const reader = new FileReader();

        reader.onload = () => {
          editor.focus();

          const imageHTML = `<img src="${reader.result}" alt="Imagen agregada por usuario">`;
          document.execCommand("insertHTML", false, imageHTML);

          input.value = "";
        };

        reader.readAsDataURL(file);
      });
    });
  }

  /* ==========================================================================
     RESUMEN DEL FORO
     ========================================================================== */

  function updateForumSummaryPanel(forum) {
    if (!forum) return;

    const membersCount = getForumMembersCount(forum.id);
    const topicsCount = getForumTopicsCount(forum);
    const userPoints = getUserForumPoints(forum.id);
    const isSubscribed = isUserSubscribedToForum(forum.id);

    if (summaryMembers) {
      summaryMembers.textContent = formatNumber(membersCount);
    }

    if (summaryTopics) {
      summaryTopics.textContent = formatNumber(topicsCount);
    }

    if (summaryPoints) {
      summaryPoints.textContent = formatNumber(userPoints);
    }

    if (subscribeForumBtn) {
      subscribeForumBtn.textContent = isSubscribed
        ? "Desuscribirme del foro"
        : "Suscribirme al foro";

      subscribeForumBtn.classList.toggle("is-subscribed", isSubscribed);
      subscribeForumBtn.disabled = false;
    }
  }

  /* ==========================================================================
     CARGA DE FOROS
     ========================================================================== */

  async function loadForums() {
    try {
      const response = await fetch("/data/forums.json");

      if (!response.ok) {
        throw new Error(`Error al cargar JSON: ${response.status}`);
      }

      forums = await response.json();

      renderForumCards();
      renderGenreMenu();

      const params = new URLSearchParams(window.location.search);
      const forumIdFromUrl = params.get("genero");

      if (forumIdFromUrl) {
        if (!isUserLoggedIn()) {
          showForumHome(false);
          showLoginRequiredAlert();
          return;
        }

        showForumDetail(forumIdFromUrl, false);
      }
    } catch (error) {
      console.error("Error cargando foros:", error);

      if (forumsList) {
        forumsList.innerHTML = `
          <p class="forums-error">
            No pudimos cargar los foros por el momento. Intenta más tarde.
          </p>
        `;
      }
    }
  }

  /* ==========================================================================
     RENDER: CARDS DE FOROS
     ========================================================================== */

  function renderForumCards() {
    if (!forumsList) return;

    forumsList.innerHTML = forums
      .map((forum) => {
        const topicsCount = getForumTopicsCount(forum);
        const membersCount = getForumMembersCount(forum.id);

        return `
          <article class="forum-card">
            <div class="forum-card-icon">${forum.icono}</div>

            <div class="forum-card-content">
              <h3>${escapeHTML(forum.nombre)}</h3>

              <p>${escapeHTML(forum.descripcion)}</p>

              <div class="forum-card-stats">
                <span>👥 ${formatNumber(membersCount)} miembros activos</span>
                <span>💬 ${formatNumber(topicsCount)} temas</span>
              </div>

              <button 
                class="forum-enter-button" 
                type="button"
                data-forum-id="${forum.id}"
              >
                Entrar al foro
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    document.querySelectorAll(".forum-enter-button").forEach((button) => {
      button.addEventListener("click", () => {
        if (!isUserLoggedIn()) {
          showLoginRequiredAlert();
          return;
        }

        const forumId = button.dataset.forumId;
        showForumDetail(forumId, true);
      });
    });
  }

  function renderGenreMenu() {
    if (!genreMenu) return;

    genreMenu.innerHTML = forums
      .map((forum) => {
        return `
          <button 
            class="genre-menu-button" 
            type="button"
            data-forum-id="${forum.id}"
          >
            <span>${forum.icono}</span>
            ${escapeHTML(forum.nombre)}
          </button>
        `;
      })
      .join("");

    document.querySelectorAll(".genre-menu-button").forEach((button) => {
      button.addEventListener("click", () => {
        if (!isUserLoggedIn()) {
          showLoginRequiredAlert();
          return;
        }

        const forumId = button.dataset.forumId;
        showForumDetail(forumId, true);
      });
    });
  }

  /* ==========================================================================
     CAMBIO DE VISTAS
     ========================================================================== */

  function showForumHome(updateUrl = true) {
    forumsHomeView?.classList.remove("is-hidden");
    forumDetailView?.classList.add("is-hidden");

    selectedForum = null;
    selectedPost = null;
    showAllPosts = false;

    clearPostEditMode();
    clearReplyEditMode();

    if (updateUrl) {
      history.pushState({}, "", "/forums/forums.html");
    }
  }

  function showForumDetail(forumId, updateUrl = true) {
    if (!isUserLoggedIn()) {
      showLoginRequiredAlert();
      return;
    }

    const forum = forums.find((item) => item.id === forumId);

    if (!forum) {
      showForumHome(false);
      return;
    }

    selectedForum = forum;
    selectedPost = null;
    showAllPosts = false;

    forumsHomeView?.classList.add("is-hidden");
    forumDetailView?.classList.remove("is-hidden");

    showPostsListPanel(false);

    if (forumDetailIcon) {
      forumDetailIcon.textContent = forum.icono;
    }

    if (forumDetailTitle) {
      forumDetailTitle.textContent = `Foro de ${forum.nombre}`;
    }

    if (forumDetailDescription) {
      forumDetailDescription.textContent = forum.descripcion;
    }

    updateForumSummaryPanel(forum);
    renderRecentPosts(forum);
    updateActiveGenreButton(forum.id);

    if (updateUrl) {
      history.pushState({}, "", `/forums/forums.html?genero=${forum.id}`);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function showPostsListPanel(scroll = true) {
    createPostCard?.classList.remove("is-hidden");
    recentPostsSection?.classList.remove("is-hidden");
    postDetailPanel?.classList.add("is-hidden");

    selectedPost = null;
    clearReplyEditMode();

    if (selectedForum) {
      renderRecentPosts(selectedForum);
      updateForumSummaryPanel(selectedForum);
    }

    if (scroll && recentPostsSection) {
      recentPostsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function showPostDetailPanel(post) {
    createPostCard?.classList.add("is-hidden");
    recentPostsSection?.classList.add("is-hidden");
    postDetailPanel?.classList.remove("is-hidden");

    selectedPost = post;
    clearReplyEditMode();

    if (postDetailAvatar) {
      postDetailAvatar.textContent = selectedForum.icono;
    }

    if (postDetailTitle) {
      postDetailTitle.textContent = post.titulo;
    }

    if (postDetailMeta) {
      postDetailMeta.textContent = `${post.autor} · ${post.fecha}`;
    }

    const canManagePost = post.source === "local" && isCurrentUserOwner(post);

    if (postDetailBody) {
      postDetailBody.innerHTML = `
        <div class="post-detail-content">
          ${sanitizeRichHTML(post.comentario)}
        </div>

        ${
          canManagePost
            ? `
              <div class="post-management-actions">
                <button type="button" class="edit-current-post-button">
                  Editar publicación
                </button>

                <button type="button" class="delete-current-post-button">
                  Borrar publicación
                </button>
              </div>
            `
            : ""
        }
      `;

      postDetailBody
        .querySelector(".edit-current-post-button")
        ?.addEventListener("click", () => {
          editPost(post.id);
        });

      postDetailBody
        .querySelector(".delete-current-post-button")
        ?.addEventListener("click", () => {
          deletePost(post.id);
        });
    }

    renderReplies();

    postDetailPanel?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function updateActiveGenreButton(forumId) {
    document.querySelectorAll(".genre-menu-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.forumId === forumId);
    });
  }

  /* ==========================================================================
     RENDER: PUBLICACIONES
     ========================================================================== */

  function renderRecentPosts(forum) {
    if (!recentPostsList) return;

    const allPosts = getAllPostsFromForum(forum);
    const postsToRender = showAllPosts ? allPosts : allPosts.slice(0, 3);

    if (allPosts.length === 0) {
      recentPostsList.innerHTML = `
        <p class="empty-posts-message">
          Aún no hay publicaciones con contenido en este foro. Sé la primera persona en publicar.
        </p>
      `;

      if (loadMorePostsBtn) {
        loadMorePostsBtn.style.display = "none";
      }

      return;
    }

    recentPostsList.innerHTML = postsToRender
      .map((post) => {
        const repliesCount = getReplyCount(forum.id, post);
        const canManagePost = post.source === "local" && isCurrentUserOwner(post);

        return `
          <article class="recent-post-card">
            <div class="post-avatar">${forum.icono}</div>

            <div class="post-content">
              <h3>${escapeHTML(post.titulo)}</h3>
              <p>${escapeHTML(post.autor)} · ${escapeHTML(post.fecha)}</p>
            </div>

            <div class="post-actions">
              <span>💬 ${formatNumber(repliesCount)}</span>

              <button 
                type="button" 
                class="reply-post-button"
                data-post-id="${post.id}"
              >
                Responder
              </button>

              ${
                canManagePost
                  ? `
                    <button 
                      type="button" 
                      class="edit-post-button"
                      data-post-id="${post.id}"
                    >
                      Editar
                    </button>

                    <button 
                      type="button" 
                      class="delete-post-button"
                      data-post-id="${post.id}"
                    >
                      Borrar
                    </button>
                  `
                  : ""
              }
            </div>
          </article>
        `;
      })
      .join("");

    document.querySelectorAll(".reply-post-button").forEach((button) => {
      button.addEventListener("click", () => {
        if (!isUserLoggedIn()) {
          showLoginRequiredAlert();
          return;
        }

        const postId = button.dataset.postId;
        openPostDetail(postId);
      });
    });

    document.querySelectorAll(".edit-post-button").forEach((button) => {
      button.addEventListener("click", () => {
        editPost(button.dataset.postId);
      });
    });

    document.querySelectorAll(".delete-post-button").forEach((button) => {
      button.addEventListener("click", () => {
        deletePost(button.dataset.postId);
      });
    });

    if (loadMorePostsBtn) {
      if (allPosts.length <= 3) {
        loadMorePostsBtn.style.display = "none";
      } else {
        loadMorePostsBtn.style.display = "block";
        loadMorePostsBtn.textContent = showAllPosts
          ? "Ver menos publicaciones ↑"
          : "Ver más publicaciones ↓";
      }
    }
  }

  function openPostDetail(postId) {
    if (!selectedForum) return;

    const allPosts = getAllPostsFromForum(selectedForum);
    const post = allPosts.find((item) => item.id === postId);

    if (!post) return;

    showPostDetailPanel(post);
  }

  /* ==========================================================================
     RENDER: RESPUESTAS
     ========================================================================== */

  function renderReplies() {
    if (!selectedForum || !selectedPost || !repliesList) return;

    const replies = getStoredReplies(selectedForum.id, selectedPost.id);

    if (replies.length === 0) {
      repliesList.innerHTML = `
        <p class="empty-replies-message">
          Aún no hay respuestas. Sé la primera persona en responder esta publicación.
        </p>
      `;
      return;
    }

    repliesList.innerHTML = replies
      .map((reply) => {
        const canManageReply = isCurrentUserOwner(reply);

        return `
          <article class="reply-card">
            <div class="reply-card-header">
              ${escapeHTML(reply.autor)} · ${escapeHTML(reply.fecha)}
            </div>

            <div class="reply-card-body">
              ${sanitizeRichHTML(reply.comentario)}
            </div>

            ${
              canManageReply
                ? `
                  <div class="reply-card-actions">
                    <button 
                      type="button" 
                      class="edit-reply-button"
                      data-reply-id="${reply.id}"
                    >
                      Editar
                    </button>

                    <button 
                      type="button" 
                      class="delete-reply-button"
                      data-reply-id="${reply.id}"
                    >
                      Borrar
                    </button>
                  </div>
                `
                : ""
            }
          </article>
        `;
      })
      .join("");

    document.querySelectorAll(".edit-reply-button").forEach((button) => {
      button.addEventListener("click", () => {
        editReply(button.dataset.replyId);
      });
    });

    document.querySelectorAll(".delete-reply-button").forEach((button) => {
      button.addEventListener("click", () => {
        deleteReply(button.dataset.replyId);
      });
    });
  }

  /* ==========================================================================
     EDICIÓN DE PUBLICACIONES
     ========================================================================== */

  function ensureCancelPostEditButton() {
    let cancelButton = document.querySelector("#cancelPostEditBtn");

    if (cancelButton) return cancelButton;

    cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.id = "cancelPostEditBtn";
    cancelButton.className = "cancel-edit-button";
    cancelButton.textContent = "Cancelar edición";

    postSubmitButton?.insertAdjacentElement("afterend", cancelButton);

    cancelButton.addEventListener("click", () => {
      clearPostEditMode();
    });

    return cancelButton;
  }

  function setPostEditMode(post) {
    editingPostId = post.id;

    if (createPostTitle) {
      createPostTitle.textContent = "Editar publicación";
    }

    if (postSubmitButton) {
      postSubmitButton.textContent = "Guardar cambios";
    }

    if (postTitleInput) {
      postTitleInput.value = post.titulo;
    }

    if (postCommentEditor) {
      postCommentEditor.innerHTML = sanitizeRichHTML(post.comentario);
    }

    ensureCancelPostEditButton();

    createPostCard?.classList.remove("is-hidden");
    recentPostsSection?.classList.remove("is-hidden");
    postDetailPanel?.classList.add("is-hidden");

    createPostCard?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function clearPostEditMode() {
    editingPostId = null;

    if (createPostTitle) {
      createPostTitle.textContent = "Crear publicación";
    }

    if (postSubmitButton) {
      postSubmitButton.textContent = "Publicar";
    }

    if (postTitleInput) {
      postTitleInput.value = "";
    }

    clearEditor(postCommentEditor);

    document.querySelector("#cancelPostEditBtn")?.remove();
  }

  function editPost(postId) {
    if (!selectedForum) return;

    const post = findLocalPostById(selectedForum.id, postId);

    if (!post || !isCurrentUserOwner(post)) {
      showErrorAlert(
        "No disponible",
        "Solo puedes editar publicaciones que tú hayas creado."
      );
      return;
    }

    setPostEditMode(post);
  }

  async function deletePost(postId) {
    if (!selectedForum) return;

    const post = findLocalPostById(selectedForum.id, postId);

    if (!post || !isCurrentUserOwner(post)) {
      showErrorAlert(
        "No disponible",
        "Solo puedes borrar publicaciones que tú hayas creado."
      );
      return;
    }

    const confirmed = await showConfirmAlert(
      "¿Borrar publicación?",
      "Esta acción eliminará la publicación y sus respuestas guardadas localmente.",
      "Sí, borrar"
    );

    if (!confirmed) return;

    const storedPosts = getStoredPosts(selectedForum.id);
    const updatedPosts = storedPosts.filter((item) => item.id !== postId);

    saveStoredPosts(selectedForum.id, updatedPosts);
    removeStoredReplies(selectedForum.id, postId);
    updateUserForumPoints(selectedForum.id, -10);

    clearPostEditMode();

    if (selectedPost?.id === postId) {
      showPostsListPanel(false);
    }

    renderRecentPosts(selectedForum);
    renderForumCards();
    updateForumSummaryPanel(selectedForum);

    showSuccessAlert(
      "Publicación borrada",
      "La publicación fue eliminada correctamente."
    );
  }

  /* ==========================================================================
     EDICIÓN DE RESPUESTAS
     ========================================================================== */

  function ensureCancelReplyEditButton() {
    let cancelButton = document.querySelector("#cancelReplyEditBtn");

    if (cancelButton) return cancelButton;

    cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.id = "cancelReplyEditBtn";
    cancelButton.className = "cancel-edit-button";
    cancelButton.textContent = "Cancelar edición";

    replySubmitButton?.insertAdjacentElement("afterend", cancelButton);

    cancelButton.addEventListener("click", () => {
      clearReplyEditMode();
    });

    return cancelButton;
  }

  function setReplyEditMode(reply) {
    editingReplyId = reply.id;

    if (replyFormTitle) {
      replyFormTitle.textContent = "Editar respuesta";
    }

    if (replySubmitButton) {
      replySubmitButton.textContent = "Guardar cambios";
    }

    if (replyEditor) {
      replyEditor.innerHTML = sanitizeRichHTML(reply.comentario);
    }

    ensureCancelReplyEditButton();

    replyForm?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function clearReplyEditMode() {
    editingReplyId = null;

    if (replyFormTitle) {
      replyFormTitle.textContent = "Responder publicación";
    }

    if (replySubmitButton) {
      replySubmitButton.textContent = "Responder";
    }

    clearEditor(replyEditor);

    document.querySelector("#cancelReplyEditBtn")?.remove();
  }

  function editReply(replyId) {
    if (!selectedForum || !selectedPost) return;

    const replies = getStoredReplies(selectedForum.id, selectedPost.id);
    const reply = replies.find((item) => item.id === replyId);

    if (!reply || !isCurrentUserOwner(reply)) {
      showErrorAlert(
        "No disponible",
        "Solo puedes editar respuestas que tú hayas creado."
      );
      return;
    }

    setReplyEditMode(reply);
  }

  async function deleteReply(replyId) {
    if (!selectedForum || !selectedPost) return;

    const replies = getStoredReplies(selectedForum.id, selectedPost.id);
    const reply = replies.find((item) => item.id === replyId);

    if (!reply || !isCurrentUserOwner(reply)) {
      showErrorAlert(
        "No disponible",
        "Solo puedes borrar respuestas que tú hayas creado."
      );
      return;
    }

    const confirmed = await showConfirmAlert(
      "¿Borrar respuesta?",
      "Esta acción eliminará tu respuesta.",
      "Sí, borrar"
    );

    if (!confirmed) return;

    const updatedReplies = replies.filter((item) => item.id !== replyId);

    saveStoredReplies(selectedForum.id, selectedPost.id, updatedReplies);
    updateUserForumPoints(selectedForum.id, -5);

    clearReplyEditMode();
    renderReplies();
    renderRecentPosts(selectedForum);
    updateForumSummaryPanel(selectedForum);

    showSuccessAlert(
      "Respuesta borrada",
      "La respuesta fue eliminada correctamente."
    );
  }

  /* ==========================================================================
     CREAR O EDITAR PUBLICACIÓN
     ========================================================================== */

  forumPostForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!isUserLoggedIn()) {
      showLoginRequiredAlert();
      return;
    }

    if (!selectedForum) return;

    if (!isUserSubscribedToForum(selectedForum.id)) {
      showSubscribeRequiredAlert();
      return;
    }

    const loggedUser = getLoggedUser();

    const title = postTitleInput?.value.trim() || "";
    const comment = getEditorHTML(postCommentEditor);

    if (!title || !hasRealContent(comment)) {
      showIncompletePostAlert();
      return;
    }

    const storedPosts = getStoredPosts(selectedForum.id);

    if (editingPostId) {
      const postIndex = storedPosts.findIndex((post) => post.id === editingPostId);

      if (postIndex === -1 || !isCurrentUserOwner(storedPosts[postIndex])) {
        showErrorAlert(
          "No disponible",
          "No se pudo editar esta publicación."
        );
        return;
      }

      storedPosts[postIndex] = {
        ...storedPosts[postIndex],
        titulo: title,
        comentario: comment,
        updatedAt: new Date().toISOString()
      };

      saveStoredPosts(selectedForum.id, storedPosts);
      clearPostEditMode();

      renderRecentPosts(selectedForum);
      renderForumCards();
      updateForumSummaryPanel(selectedForum);

      showSuccessAlert(
        "Publicación actualizada",
        "Los cambios se guardaron correctamente."
      );

      return;
    }

    const newPost = {
      id: createId(),
      titulo: title,
      comentario: comment,
      autor: loggedUser.nombre || "Usuario lector",
      userId: loggedUser.id || "user-local",
      fecha: getTodayLabel(),
      comentarios: 0,
      createdAt: new Date().toISOString(),
      source: "local"
    };

    storedPosts.unshift(newPost);
    saveStoredPosts(selectedForum.id, storedPosts);
    updateUserForumPoints(selectedForum.id, 10);

    forumPostForm.reset();
    clearEditor(postCommentEditor);

    renderRecentPosts(selectedForum);
    renderForumCards();
    updateForumSummaryPanel(selectedForum);

    showSuccessAlert(
      "Publicación creada",
      "Tu entrada se guardó correctamente. Sumaste 10 puntos."
    );
  });

  /* ==========================================================================
     CREAR O EDITAR RESPUESTA
     ========================================================================== */

  replyForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!isUserLoggedIn()) {
      showLoginRequiredAlert();
      return;
    }

    if (!selectedForum || !selectedPost) return;

    if (!isUserSubscribedToForum(selectedForum.id)) {
      showSubscribeRequiredAlert();
      return;
    }

    const loggedUser = getLoggedUser();
    const comment = getEditorHTML(replyEditor);

    if (!hasRealContent(comment)) {
      showIncompleteReplyAlert();
      return;
    }

    const replies = getStoredReplies(selectedForum.id, selectedPost.id);

    if (editingReplyId) {
      const replyIndex = replies.findIndex((reply) => reply.id === editingReplyId);

      if (replyIndex === -1 || !isCurrentUserOwner(replies[replyIndex])) {
        showErrorAlert(
          "No disponible",
          "No se pudo editar esta respuesta."
        );
        return;
      }

      replies[replyIndex] = {
        ...replies[replyIndex],
        comentario: comment,
        updatedAt: new Date().toISOString()
      };

      saveStoredReplies(selectedForum.id, selectedPost.id, replies);
      clearReplyEditMode();

      renderReplies();
      renderRecentPosts(selectedForum);

      showSuccessAlert(
        "Respuesta actualizada",
        "Los cambios se guardaron correctamente."
      );

      return;
    }

    const newReply = {
      id: createId(),
      comentario: comment,
      autor: loggedUser.nombre || "Usuario lector",
      userId: loggedUser.id || "user-local",
      fecha: getTodayLabel(),
      createdAt: new Date().toISOString()
    };

    replies.push(newReply);
    saveStoredReplies(selectedForum.id, selectedPost.id, replies);
    updateUserForumPoints(selectedForum.id, 5);

    replyForm.reset();
    clearEditor(replyEditor);

    renderReplies();
    renderRecentPosts(selectedForum);
    updateForumSummaryPanel(selectedForum);

    showSuccessAlert(
      "Respuesta guardada",
      "Tu respuesta se agregó correctamente. Sumaste 5 puntos."
    );
  });

  /* ==========================================================================
     SUSCRIPCIÓN / DESUSCRIPCIÓN
     ========================================================================== */

  subscribeForumBtn?.addEventListener("click", async () => {
    if (!isUserLoggedIn()) {
      showLoginRequiredAlert();
      return;
    }

    if (!selectedForum) return;

    const isSubscribed = isUserSubscribedToForum(selectedForum.id);

    if (!isSubscribed) {
      subscribeUserToForum(selectedForum.id);
      updateForumSummaryPanel(selectedForum);
      renderForumCards();

      showSuccessAlert(
        "Suscripción realizada",
        `Ahora formas parte del foro de ${selectedForum.nombre}.`
      );

      return;
    }

    const confirmed = await showConfirmAlert(
      "¿Desuscribirte del foro?",
      "Dejarás de sumar puntos y no podrás publicar ni responder hasta suscribirte de nuevo. Tus publicaciones y respuestas no se eliminarán.",
      "Sí, desuscribirme"
    );

    if (!confirmed) return;

    unsubscribeUserFromForum(selectedForum.id);
    updateForumSummaryPanel(selectedForum);
    renderForumCards();

    showSuccessAlert(
      "Te desuscribiste del foro",
      `Ya no formas parte del foro de ${selectedForum.nombre}.`
    );
  });

  /* ==========================================================================
     EVENTOS GENERALES
     ========================================================================== */

  backToForumsBtn?.addEventListener("click", () => {
    showForumHome(true);
  });

  backToPostsBtn?.addEventListener("click", () => {
    showPostsListPanel(true);
  });

  loadMorePostsBtn?.addEventListener("click", () => {
    if (!selectedForum) return;

    showAllPosts = !showAllPosts;
    renderRecentPosts(selectedForum);
  });

  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const forumIdFromUrl = params.get("genero");

    if (forumIdFromUrl) {
      if (!isUserLoggedIn()) {
        showForumHome(false);
        showLoginRequiredAlert();
        return;
      }

      showForumDetail(forumIdFromUrl, false);
    } else {
      showForumHome(false);
    }
  });

  /* ==========================================================================
     INICIO
     ========================================================================== */

  initializeRichEditors();
  loadForums();
});