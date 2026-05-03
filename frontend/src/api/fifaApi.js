const origin = window.location.origin;

let detectedBackend = "";

if (origin.includes(":5173")) {
  detectedBackend = origin.replace(":5173", ":8000");
} else {
  detectedBackend = import.meta.env.VITE_API_URL || origin;
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
