// Priority: 
// 1. Environment variable (set in Render dashboard as VITE_API_URL)
// 2. Development localhost detection
// 3. Current origin (last resort)

const VITE_API_URL = import.meta.env.VITE_API_URL;
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

let detectedBackend = "";

if (VITE_API_URL) {
  detectedBackend = VITE_API_URL;
} else if (isLocalhost) {
  detectedBackend = "http://localhost:8000";
} else {
  detectedBackend = window.location.origin;
}

export const API_BASE = detectedBackend.replace(/\/+$/, "");

console.log("[FIFA API] Using backend:", API_BASE);

export async function apiGet(path) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      console.error("[apiGet] HTTP error", res.status, data);
      throw new Error(`GET ${url} failed: ${res.status}`);
    }

    return data;
  } catch (err) {
    console.error("[apiGet] Network error:", err);
    throw err;
  }
}

export async function apiPost(path, body = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      console.error("[apiPost] HTTP error", res.status, data);
      throw new Error(`POST ${url} failed: ${res.status}`);
    }

    return data;
  } catch (err) {
    console.error("[apiPost] Network error:", err);
    throw err;
  }
}
