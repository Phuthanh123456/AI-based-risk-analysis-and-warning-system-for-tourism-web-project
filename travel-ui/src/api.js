// Keep relative URLs in local development so Vite's proxy is used. In a
// production build, point this at the deployed FastAPI service. This keeps the
// frontend independent from short-lived Railway/Render domains.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function _url(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

async function _handleResponse(r) {
  const data = await r.json().catch((error) => {
    if (error.name === "AbortError") throw error;
    return {};
  });
  if (!r.ok) {
    const msg =
      data?.detail ||
      data?.message ||
      data?.error ||
      `Server returned ${r.status} ${r.statusText}`;
    throw new Error(msg);
  }
  return data;
}

function _networkError(networkErr) {
  const server = API_BASE || "backend local (http://127.0.0.1:8000)";
  return new Error(
    `Không kết nối được server ${server}. Vui lòng kiểm tra backend đang chạy (${networkErr.message}).`
  );
}

async function request(path, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  let response;
  try {
    response = await fetch(_url(path), { ...options, signal: controller.signal });
    return await _handleResponse(response);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Tra cứu mất quá nhiều thời gian. Vui lòng thử lại sau ít phút.");
    }
    if (!response) throw _networkError(error);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet(path, token) {
  return request(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPost(path, body, token) {
  return request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });
}

export async function apiDelete(path, token) {
  return request(path, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
