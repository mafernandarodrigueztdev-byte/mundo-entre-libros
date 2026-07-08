/* ============================================================================
   PÁGINA DE FOROS - MUNDO ENTRE LIBROS
   Versión adaptada a Spring Boot + MySQL + JWT
   ---------------------------------------------------------------------------
   Requisitos:
   - Login guarda el JWT en localStorage con la llave: mel_token
   - Backend corriendo en: http://localhost:8080
   - Endpoints usados:
     GET    /api/forums
     GET    /api/posts/forum/{forumId}
     POST   /api/posts
     DELETE /api/posts/{id}
     GET    /api/comments/post/{postId}
     POST   /api/comments
     PUT    /api/comments/{id}
     DELETE /api/comments/{id}
     POST   /api/subscriptions
     DELETE /api/subscriptions/{forumId}
     GET    /api/subscriptions/check/{forumId}
     GET    /api/subscriptions/points/{forumId}
     PUT    /api/subscriptions/points
     GET    /api/subscriptions/members/{forumId}
   ============================================================================ */

const API_URL = "http://localhost:8080";
const TOKEN_STORAGE_KEY = "mel_token";
const USER_STORAGE_KEY = "mel_logged_user";

// ============================================================================
// API GLOBAL CON JWT
// ============================================================================

function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function removeSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorText = "Error en la petición";

    try {
      errorText = await response.text();
    } catch (error) {
      console.error("No se pudo leer el error del backend:", error);
    }

    throw new Error(errorText);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  return await response.text();
}

// ============================================================================
// INICIO
// ============================================================================

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
  let currentUser = null;
  let showAllPosts = false;
  let editingReplyId = null;

  const postsCache = new Map();
  const commentsCache = new Map();
  const membersCache = new Map();
  const pointsCache = new Map();
  const subscriptionCache = new Map();

  /* ==========================================================================
     SESIÓN / USUARIO
     ========================================================================== */

  async function loadCurrentUser() {
    if (!getToken()) {
      currentUser = null;
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }

    try {
      currentUser = await apiFetch("/api/auth/me");
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      return currentUser;
    } catch (error) {
      console.error("Sesión inválida o expirada:", error);
      currentUser = null;
      removeSession();
      return null;
    }
  }

  function isUserLoggedIn() {
    return Boolean(getToken() && currentUser);
  }

  function getCurrentUserId() {
    return currentUser?.idUser ?? currentUser?.id ?? null;
  }

  function isCurrentUserOwner(item) {
    const userId = Number(getCurrentUserId());
    const itemUserId = Number(item?.userId);

    return Boolean(userId && itemUserId && userId === itemUserId);
  }

  /* ==========================================================================
     NORMALIZADORES
     ========================================================================== */

  function normalizeForum(rawForum) {
    return {
      ...rawForum,
      id: rawForum.idForum ?? rawForum.id,
      nombre: rawForum.nombre ?? rawForum.name ?? "Foro",
      descripcion: rawForum.descripcion ?? rawForum.description ?? "",
      icono: rawForum.icono ?? rawForum.icon ?? "📚",
      posts: Array.isArray(rawForum.posts) ? rawForum.posts : []
    };
  }

  function normalizePost(rawPost) {
    return {
      ...rawPost,
      id: rawPost.id ?? rawPost.idPost,
      forumId: rawPost.forumId,
      userId: rawPost.userId,
      titulo: rawPost.titulo ?? rawPost.titlePost ?? rawPost.title ?? "Sin título",
      comentario: normalizeHTMLContent(rawPost),
      autor: rawPost.autor ?? rawPost.author ?? "Usuario lector",
      fecha: formatDate(rawPost.fecha ?? rawPost.createdAt),
      rawFecha: rawPost.fecha ?? rawPost.createdAt,
      comentarios: Number(rawPost.comentarios) || 0,
      source: "backend"
    };
  }

  function normalizeReply(rawReply) {
    return {
      ...rawReply,
      id: rawReply.id ?? rawReply.idComment,
      postId: rawReply.postId,
      userId: rawReply.userId,
      comentario: rawReply.content ?? rawReply.comentario ?? "",
      autor: rawReply.autor ?? rawReply.author ?? "Usuario lector",
      fecha: formatDate(rawReply.fecha ?? rawReply.createdAt),
      rawFecha: rawReply.fecha ?? rawReply.createdAt,
      source: "backend"
    };
  }

  /* ==========================================================================
     UTILIDADES GENERALES
     ========================================================================== */

  function formatNumber(number) {
    return Number(number || 0).toLocaleString("es-MX");
  }

  function escapeHTML(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    if (!value) return "Fecha no disponible";

    const cleanedValue = String(value).replace(/(\.\d{3})\d+/, "$1");
    const date = new Date(cleanedValue);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function normalizeHTMLContent(post) {
    return (
      post?.comentario ||
      post?.content ||
      post?.contenido ||
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

  function setButtonLoading(button, isLoading, loadingText, normalText) {
    if (!button) return;

    button.disabled = isLoading;
    button.textContent = isLoading ? loadingText : normalText;
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
        text: "Para publicar o responder necesitas estar suscrito a este foro.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#4B1D13",
        background: "#F6EBD9",
        color: "#521F12"
      });

      return;
    }

    alert("Para publicar o responder necesitas estar suscrito a este foro.");
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
     BACKEND: FOROS
     ========================================================================== */

  async function getForumsFromBackend() {
    const data = await apiFetch("/api/forums");
    return data.map(normalizeForum);
  }

  async function getForumsFromJsonFallback() {
    const response = await fetch("/data/forums.json");

    if (!response.ok) {
      throw new Error(`Error al cargar JSON: ${response.status}`);
    }

    const data = await response.json();
    return data.map(normalizeForum);
  }

  async function loadForums() {
    try {
      try {
        forums = await getForumsFromBackend();
      } catch (backendError) {
        console.warn("No se pudieron cargar foros desde backend. Usando JSON local:", backendError);
        forums = await getForumsFromJsonFallback();
      }

      await renderForumCards();
      renderGenreMenu();

      const params = new URLSearchParams(window.location.search);
      const forumIdFromUrl = params.get("genero");

      if (forumIdFromUrl) {
        if (!isUserLoggedIn()) {
          showForumHome(false);
          showLoginRequiredAlert();
          return;
        }

        await showForumDetail(forumIdFromUrl, false);
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
     BACKEND: SUSCRIPCIONES Y PUNTOS
     ========================================================================== */

  async function isUserSubscribedToForum(forumId, refresh = false) {
    if (!isUserLoggedIn()) return false;

    const key = String(forumId);

    if (!refresh && subscriptionCache.has(key)) {
      return subscriptionCache.get(key);
    }

    try {
      const result = await apiFetch(`/api/subscriptions/check/${forumId}`);
      subscriptionCache.set(key, Boolean(result));
      return Boolean(result);
    } catch (error) {
      console.error("Error verificando suscripción:", error);
      subscriptionCache.set(key, false);
      return false;
    }
  }

  async function subscribeUserToForum(forumId) {
    await apiFetch("/api/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        forumId: Number(forumId)
      })
    });

    subscriptionCache.set(String(forumId), true);
    pointsCache.delete(String(forumId));
    membersCache.delete(String(forumId));
  }

  async function unsubscribeUserFromForum(forumId) {
    await apiFetch(`/api/subscriptions/${forumId}`, {
      method: "DELETE"
    });

    subscriptionCache.set(String(forumId), false);
    pointsCache.delete(String(forumId));
    membersCache.delete(String(forumId));
  }

  async function getForumMembersCount(forumId, refresh = false) {
    const key = String(forumId);

    if (!refresh && membersCache.has(key)) {
      return membersCache.get(key);
    }

    try {
      const count = await apiFetch(`/api/subscriptions/members/${forumId}`);
      membersCache.set(key, Number(count) || 0);
      return Number(count) || 0;
    } catch (error) {
      console.error("Error obteniendo miembros:", error);
      membersCache.set(key, 0);
      return 0;
    }
  }

  async function getUserForumPoints(forumId, refresh = false) {
    if (!isUserLoggedIn()) return 0;

    const key = String(forumId);

    if (!refresh && pointsCache.has(key)) {
      return pointsCache.get(key);
    }

    try {
      const points = await apiFetch(`/api/subscriptions/points/${forumId}`);
      pointsCache.set(key, Number(points) || 0);
      return Number(points) || 0;
    } catch (error) {
      pointsCache.set(key, 0);
      return 0;
    }
  }

  async function updateUserForumPoints(forumId, pointsToAdd) {
    if (!isUserLoggedIn()) return;

    try {
      await apiFetch("/api/subscriptions/points", {
        method: "PUT",
        body: JSON.stringify({
          forumId: Number(forumId),
          points: Number(pointsToAdd)
        })
      });

      pointsCache.delete(String(forumId));
    } catch (error) {
      console.error("No se pudieron actualizar puntos:", error);
    }
  }

  /* ==========================================================================
     BACKEND: PUBLICACIONES
     ========================================================================== */

  async function getPostsByForum(forumId, refresh = false) {
    const key = String(forumId);

    if (!refresh && postsCache.has(key)) {
      return postsCache.get(key);
    }

    try {
      const posts = await apiFetch(`/api/posts/forum/${forumId}`);
      const normalizedPosts = posts.map(normalizePost).filter((post) => hasRealContent(post.comentario));
      postsCache.set(key, normalizedPosts);
      return normalizedPosts;
    } catch (error) {
      console.error("Error obteniendo publicaciones:", error);
      postsCache.set(key, []);
      return [];
    }
  }

  async function getForumTopicsCount(forum) {
    const posts = await getPostsByForum(forum.id);
    return posts.length;
  }

  async function createPost(forumId, titlePost, content) {
    const savedPost = await apiFetch("/api/posts", {
      method: "POST",
      body: JSON.stringify({
        forumId: Number(forumId),
        titlePost,
        content
      })
    });

    postsCache.delete(String(forumId));
    return normalizePost(savedPost);
  }

  async function deletePostFromBackend(postId) {
    await apiFetch(`/api/posts/${postId}`, {
      method: "DELETE"
    });

    if (selectedForum) {
      postsCache.delete(String(selectedForum.id));
    }

    commentsCache.delete(String(postId));
  }

  async function findPostById(postId) {
    if (!selectedForum) return null;

    const posts = await getPostsByForum(selectedForum.id);
    return posts.find((post) => String(post.id) === String(postId)) || null;
  }

  /* ==========================================================================
     BACKEND: COMENTARIOS / RESPUESTAS
     ========================================================================== */

  async function getRepliesByPost(postId, refresh = false) {
    const key = String(postId);

    if (!refresh && commentsCache.has(key)) {
      return commentsCache.get(key);
    }

    try {
      const comments = await apiFetch(`/api/comments/post/${postId}`);
      const normalizedComments = comments.map(normalizeReply);
      commentsCache.set(key, normalizedComments);
      return normalizedComments;
    } catch (error) {
      console.error("Error obteniendo respuestas:", error);
      commentsCache.set(key, []);
      return [];
    }
  }

  async function getReplyCount(post) {
    const replies = await getRepliesByPost(post.id);
    return replies.length;
  }

  async function createReply(postId, content) {
    const savedReply = await apiFetch("/api/comments", {
      method: "POST",
      body: JSON.stringify({
        postId: Number(postId),
        content
      })
    });

    commentsCache.delete(String(postId));
    return normalizeReply(savedReply);
  }

  async function updateReply(replyId, content) {
    const updatedReply = await apiFetch(`/api/comments/${replyId}`, {
      method: "PUT",
      body: JSON.stringify({
        content
      })
    });

    if (selectedPost) {
      commentsCache.delete(String(selectedPost.id));
    }

    return normalizeReply(updatedReply);
  }

  async function deleteReplyFromBackend(replyId) {
    await apiFetch(`/api/comments/${replyId}`, {
      method: "DELETE"
    });

    if (selectedPost) {
      commentsCache.delete(String(selectedPost.id));
    }
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

  async function updateForumSummaryPanel(forum) {
    if (!forum) return;

    const [membersCount, topicsCount, userPoints, isSubscribed] = await Promise.all([
      getForumMembersCount(forum.id),
      getForumTopicsCount(forum),
      getUserForumPoints(forum.id),
      isUserSubscribedToForum(forum.id)
    ]);

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
     RENDER: CARDS DE FOROS
     ========================================================================== */

  async function renderForumCards() {
    if (!forumsList) return;

    let html = "";

    for (const forum of forums) {
      const [topicsCount, membersCount] = await Promise.all([
        getForumTopicsCount(forum),
        getForumMembersCount(forum.id)
      ]);

      html += `
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
    }

    forumsList.innerHTML = html;

    document.querySelectorAll(".forum-enter-button").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!isUserLoggedIn()) {
          showLoginRequiredAlert();
          return;
        }

        const forumId = button.dataset.forumId;
        await showForumDetail(forumId, true);
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
      button.addEventListener("click", async () => {
        if (!isUserLoggedIn()) {
          showLoginRequiredAlert();
          return;
        }

        const forumId = button.dataset.forumId;
        await showForumDetail(forumId, true);
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

  async function showForumDetail(forumId, updateUrl = true) {
    if (!isUserLoggedIn()) {
      showLoginRequiredAlert();
      return;
    }

    const forum = forums.find((item) => String(item.id) === String(forumId));

    if (!forum) {
      showForumHome(false);
      return;
    }

    selectedForum = forum;
    selectedPost = null;
    showAllPosts = false;

    forumsHomeView?.classList.add("is-hidden");
    forumDetailView?.classList.remove("is-hidden");

    await showPostsListPanel(false);

    if (forumDetailIcon) {
      forumDetailIcon.textContent = forum.icono;
    }

    if (forumDetailTitle) {
      forumDetailTitle.textContent = `Foro de ${forum.nombre}`;
    }

    if (forumDetailDescription) {
      forumDetailDescription.textContent = forum.descripcion;
    }

    await updateForumSummaryPanel(forum);
    updateActiveGenreButton(forum.id);

    if (updateUrl) {
      history.pushState({}, "", `/forums/forums.html?genero=${forum.id}`);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function showPostsListPanel(scroll = true) {
    createPostCard?.classList.remove("is-hidden");
    recentPostsSection?.classList.remove("is-hidden");
    postDetailPanel?.classList.add("is-hidden");

    selectedPost = null;
    clearReplyEditMode();

    if (selectedForum) {
      await renderRecentPosts(selectedForum);
      await updateForumSummaryPanel(selectedForum);
    }

    if (scroll && recentPostsSection) {
      recentPostsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  async function showPostDetailPanel(post) {
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

    const canDeletePost = isCurrentUserOwner(post);

    if (postDetailBody) {
      postDetailBody.innerHTML = `
        <div class="post-detail-content">
          ${sanitizeRichHTML(post.comentario)}
        </div>

        ${
          canDeletePost
            ? `
              <div class="post-management-actions">
                <button type="button" class="delete-current-post-button">
                  Borrar publicación
                </button>
              </div>
            `
            : ""
        }
      `;

      postDetailBody
        .querySelector(".delete-current-post-button")
        ?.addEventListener("click", () => {
          deletePost(post.id);
        });
    }

    await renderReplies();

    postDetailPanel?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function updateActiveGenreButton(forumId) {
    document.querySelectorAll(".genre-menu-button").forEach((button) => {
      button.classList.toggle("is-active", String(button.dataset.forumId) === String(forumId));
    });
  }

  /* ==========================================================================
     RENDER: PUBLICACIONES
     ========================================================================== */

  async function renderRecentPosts(forum) {
    if (!recentPostsList) return;

    const allPosts = await getPostsByForum(forum.id);
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

    let html = "";

    for (const post of postsToRender) {
      const repliesCount = await getReplyCount(post);
      const canDeletePost = isCurrentUserOwner(post);

      html += `
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
              canDeletePost
                ? `
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
    }

    recentPostsList.innerHTML = html;

    document.querySelectorAll(".reply-post-button").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!isUserLoggedIn()) {
          showLoginRequiredAlert();
          return;
        }

        const postId = button.dataset.postId;
        await openPostDetail(postId);
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

  async function openPostDetail(postId) {
    if (!selectedForum) return;

    const allPosts = await getPostsByForum(selectedForum.id);
    const post = allPosts.find((item) => String(item.id) === String(postId));

    if (!post) return;

    await showPostDetailPanel(post);
  }

  /* ==========================================================================
     RENDER: RESPUESTAS
     ========================================================================== */

  async function renderReplies() {
    if (!selectedForum || !selectedPost || !repliesList) return;

    const replies = await getRepliesByPost(selectedPost.id);

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
      button.addEventListener("click", async () => {
        await editReply(button.dataset.replyId);
      });
    });

    document.querySelectorAll(".delete-reply-button").forEach((button) => {
      button.addEventListener("click", async () => {
        await deleteReply(button.dataset.replyId);
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

  function clearPostEditMode() {
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

  async function editReply(replyId) {
    if (!selectedPost) return;

    const replies = await getRepliesByPost(selectedPost.id);
    const reply = replies.find((item) => String(item.id) === String(replyId));

    if (!reply || !isCurrentUserOwner(reply)) {
      showErrorAlert(
        "No disponible",
        "Solo puedes editar respuestas que tú hayas creado."
      );
      return;
    }

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

  async function deletePost(postId) {
    if (!selectedForum) return;

    const post = await findPostById(postId);

    if (!post || !isCurrentUserOwner(post)) {
      showErrorAlert(
        "No disponible",
        "Solo puedes borrar publicaciones que tú hayas creado."
      );
      return;
    }

    const confirmed = await showConfirmAlert(
      "¿Borrar publicación?",
      "Esta acción eliminará la publicación y sus respuestas.",
      "Sí, borrar"
    );

    if (!confirmed) return;

    try {
      await deletePostFromBackend(postId);
      await updateUserForumPoints(selectedForum.id, -10);

      clearPostEditMode();

      if (String(selectedPost?.id) === String(postId)) {
        await showPostsListPanel(false);
      } else {
        await renderRecentPosts(selectedForum);
        await updateForumSummaryPanel(selectedForum);
      }

      await renderForumCards();

      showSuccessAlert(
        "Publicación borrada",
        "La publicación fue eliminada correctamente."
      );
    } catch (error) {
      console.error(error);
      showErrorAlert(
        "Error",
        "No se pudo eliminar la publicación."
      );
    }
  }

  async function deleteReply(replyId) {
    if (!selectedForum || !selectedPost) return;

    const replies = await getRepliesByPost(selectedPost.id);
    const reply = replies.find((item) => String(item.id) === String(replyId));

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

    try {
      await deleteReplyFromBackend(replyId);
      await updateUserForumPoints(selectedForum.id, -5);

      clearReplyEditMode();
      await renderReplies();
      await renderRecentPosts(selectedForum);
      await updateForumSummaryPanel(selectedForum);

      showSuccessAlert(
        "Respuesta borrada",
        "La respuesta fue eliminada correctamente."
      );
    } catch (error) {
      console.error(error);
      showErrorAlert(
        "Error",
        "No se pudo eliminar la respuesta."
      );
    }
  }

  /* ==========================================================================
     CREAR PUBLICACIÓN
     ========================================================================== */

  forumPostForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isUserLoggedIn()) {
      showLoginRequiredAlert();
      return;
    }

    if (!selectedForum) return;

    const isSubscribed = await isUserSubscribedToForum(selectedForum.id, true);

    if (!isSubscribed) {
      showSubscribeRequiredAlert();
      return;
    }

    const title = postTitleInput?.value.trim() || "";
    const comment = getEditorHTML(postCommentEditor);

    if (!title || !hasRealContent(comment)) {
      showIncompletePostAlert();
      return;
    }

    try {
      setButtonLoading(postSubmitButton, true, "Publicando...", "Publicar");

      await createPost(selectedForum.id, title, comment);
      await updateUserForumPoints(selectedForum.id, 10);

      forumPostForm.reset();
      clearEditor(postCommentEditor);
      clearPostEditMode();

      await renderRecentPosts(selectedForum);
      await renderForumCards();
      await updateForumSummaryPanel(selectedForum);

      showSuccessAlert(
        "Publicación creada",
        "Tu entrada se guardó correctamente. Sumaste 10 puntos."
      );
    } catch (error) {
      console.error(error);
      showErrorAlert(
        "Error",
        "No fue posible crear la publicación."
      );
    } finally {
      setButtonLoading(postSubmitButton, false, "Publicando...", "Publicar");
    }
  });

  /* ==========================================================================
     CREAR O EDITAR RESPUESTA
     ========================================================================== */

  replyForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isUserLoggedIn()) {
      showLoginRequiredAlert();
      return;
    }

    if (!selectedForum || !selectedPost) return;

    const isSubscribed = await isUserSubscribedToForum(selectedForum.id, true);

    if (!isSubscribed) {
      showSubscribeRequiredAlert();
      return;
    }

    const comment = getEditorHTML(replyEditor);

    if (!hasRealContent(comment)) {
      showIncompleteReplyAlert();
      return;
    }

    try {
      setButtonLoading(replySubmitButton, true, "Guardando...", editingReplyId ? "Guardar cambios" : "Responder");

      if (editingReplyId) {
        await updateReply(editingReplyId, comment);
        clearReplyEditMode();

        await renderReplies();
        await renderRecentPosts(selectedForum);

        showSuccessAlert(
          "Respuesta actualizada",
          "Los cambios se guardaron correctamente."
        );

        return;
      }

      await createReply(selectedPost.id, comment);
      await updateUserForumPoints(selectedForum.id, 5);

      replyForm.reset();
      clearEditor(replyEditor);

      await renderReplies();
      await renderRecentPosts(selectedForum);
      await updateForumSummaryPanel(selectedForum);

      showSuccessAlert(
        "Respuesta guardada",
        "Tu respuesta se agregó correctamente. Sumaste 5 puntos."
      );
    } catch (error) {
      console.error(error);
      showErrorAlert(
        "Error",
        "No fue posible guardar la respuesta."
      );
    } finally {
      setButtonLoading(replySubmitButton, false, "Guardando...", editingReplyId ? "Guardar cambios" : "Responder");
    }
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

    const isSubscribed = await isUserSubscribedToForum(selectedForum.id, true);

    if (!isSubscribed) {
      try {
        subscribeForumBtn.disabled = true;
        await subscribeUserToForum(selectedForum.id);

        await updateForumSummaryPanel(selectedForum);
        await renderForumCards();

        showSuccessAlert(
          "Suscripción realizada",
          `Ahora formas parte del foro de ${selectedForum.nombre}.`
        );
      } catch (error) {
        console.error(error);
        showErrorAlert(
          "Error",
          "No se pudo realizar la suscripción."
        );
      } finally {
        subscribeForumBtn.disabled = false;
      }

      return;
    }

    const confirmed = await showConfirmAlert(
      "¿Desuscribirte del foro?",
      "Dejarás de sumar puntos y no podrás publicar ni responder hasta suscribirte de nuevo. Tus publicaciones y respuestas no se eliminarán.",
      "Sí, desuscribirme"
    );

    if (!confirmed) return;

    try {
      subscribeForumBtn.disabled = true;
      await unsubscribeUserFromForum(selectedForum.id);

      await updateForumSummaryPanel(selectedForum);
      await renderForumCards();

      showSuccessAlert(
        "Te desuscribiste del foro",
        `Ya no formas parte del foro de ${selectedForum.nombre}.`
      );
    } catch (error) {
      console.error(error);
      showErrorAlert(
        "Error",
        "No se pudo cancelar la suscripción."
      );
    } finally {
      subscribeForumBtn.disabled = false;
    }
  });

  /* ==========================================================================
     EVENTOS GENERALES
     ========================================================================== */

  backToForumsBtn?.addEventListener("click", () => {
    showForumHome(true);
  });

  backToPostsBtn?.addEventListener("click", async () => {
    await showPostsListPanel(true);
  });

  loadMorePostsBtn?.addEventListener("click", async () => {
    if (!selectedForum) return;

    showAllPosts = !showAllPosts;
    await renderRecentPosts(selectedForum);
  });

  window.addEventListener("popstate", async () => {
    const params = new URLSearchParams(window.location.search);
    const forumIdFromUrl = params.get("genero");

    if (forumIdFromUrl) {
      if (!isUserLoggedIn()) {
        showForumHome(false);
        showLoginRequiredAlert();
        return;
      }

      await showForumDetail(forumIdFromUrl, false);
    } else {
      showForumHome(false);
    }
  });

  /* ==========================================================================
     INICIO
     ========================================================================== */

  await loadCurrentUser();
  initializeRichEditors();
  await loadForums();
});