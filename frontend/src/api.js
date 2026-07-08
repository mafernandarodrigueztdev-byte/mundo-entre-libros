// ==========================================
// URL DEL BACKEND
// ==========================================

export const API_URL = "http://localhost:8080";


// ==========================================
// OBTENER TOKEN JWT
// ==========================================

function getToken() {
    return localStorage.getItem("mel_token");
}


// ==========================================
// PETICIONES AL BACKEND
// ==========================================

export async function apiFetch(endpoint, options = {}) {

    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    // Agregar JWT si existe
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(API_URL + endpoint, {
        ...options,
        headers
    });

    // Si hubo error
    if (!response.ok) {

        let errorMessage = "Error en la petición";

        try {
            errorMessage = await response.text();
        } catch (e) {}

        throw new Error(errorMessage);
    }

    // Si no hay contenido
    if (response.status === 204) {
        return null;
    }

    // Respuesta JSON
    return await response.json();
}