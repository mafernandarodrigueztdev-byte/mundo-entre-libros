// ==========================================
// AUTH.JS - JWT + USUARIO LOGUEADO
// Mundo Entre Libros
// ==========================================

import { apiFetch } from "./api.js";

// ==========================================
// LLAVES DE LOCALSTORAGE
// ==========================================

const TOKEN_KEY = "mel_token";
const USER_KEY = "mel_logged_user";

// Esta llave era la anterior. La limpiamos para evitar conflictos.
const OLD_TOKEN_KEY = "token";

// ==========================================
// TOKEN JWT
// ==========================================

export function guardarToken(token) {
    if (!token) return;

    localStorage.setItem(TOKEN_KEY, token);

    // Limpiamos token viejo si existía
    localStorage.removeItem(OLD_TOKEN_KEY);
}

export function obtenerToken() {
    let token = localStorage.getItem(TOKEN_KEY);

    // Compatibilidad por si antes guardaste "token"
    if (!token) {
        const oldToken = localStorage.getItem(OLD_TOKEN_KEY);

        if (oldToken) {
            localStorage.setItem(TOKEN_KEY, oldToken);
            localStorage.removeItem(OLD_TOKEN_KEY);
            token = oldToken;
        }
    }

    return token;
}

export function eliminarToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(OLD_TOKEN_KEY);
}

// ==========================================
// USUARIO EN LOCALSTORAGE
// ==========================================

export function guardarUsuario(usuario) {
    if (!usuario) return;

    localStorage.setItem(
        USER_KEY,
        JSON.stringify(usuario)
    );
}

export function obtenerUsuarioLocal() {
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedUser) return null;

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Error leyendo usuario local:", error);
        localStorage.removeItem(USER_KEY);
        return null;
    }
}

export function eliminarUsuarioLocal() {
    localStorage.removeItem(USER_KEY);
}

// ==========================================
// USUARIO LOGUEADO DESDE BACKEND
// ==========================================

export async function obtenerUsuario() {
    const token = obtenerToken();

    if (!token) {
        eliminarUsuarioLocal();
        return null;
    }

    try {
        const usuario = await apiFetch("/api/auth/me");

        guardarUsuario(usuario);

        return usuario;

    } catch (error) {
        console.error("Error obteniendo usuario:", error);

        cerrarSesion(false);

        return null;
    }
}

// ==========================================
// VALIDAR SESIÓN
// ==========================================

export function estaLogueado() {
    return obtenerToken() !== null;
}

// ==========================================
// HEADERS OPCIONALES
// apiFetch ya agrega el JWT automáticamente.
// Esta función queda por si algún archivo viejo la usa.
// ==========================================

export function getHeaders() {
    const token = obtenerToken();

    return {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : ""
    };
}

// ==========================================
// CERRAR SESIÓN
// ==========================================

export function cerrarSesion(redirigir = true) {
    eliminarToken();
    eliminarUsuarioLocal();

    const liCerrarSesion = document.getElementById("li-cerrar-sesion");

    if (liCerrarSesion) {
        liCerrarSesion.classList.add("d-none");
    }

    if (redirigir) {
        window.location.href = "/account/account.html";
    }
}

// ==========================================
// NAVBAR / BOTÓN CERRAR SESIÓN
// ==========================================

function actualizarNavbarSesion() {
    const liCerrarSesion = document.getElementById("li-cerrar-sesion");

    if (!liCerrarSesion) return;

    if (estaLogueado()) {
        liCerrarSesion.classList.remove("d-none");
    } else {
        liCerrarSesion.classList.add("d-none");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

    // Mostrar u ocultar botón según exista token
    actualizarNavbarSesion();

    // Si hay token, intentamos refrescar usuario real
    if (estaLogueado()) {
        await obtenerUsuario();
        actualizarNavbarSesion();
    }

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", (e) => {
            e.preventDefault();
            cerrarSesion(true);
        });
    }
});