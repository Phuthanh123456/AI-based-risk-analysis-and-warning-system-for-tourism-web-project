const normalize = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim().replace(/\s+/g, " ");
const keyFor = (query, lat, lon) => `${normalize(query)}|${Number.isFinite(lat) ? lat.toFixed(1) : ""}|${Number.isFinite(lon) ? lon.toFixed(1) : ""}`;
const abortError = () => new DOMException("Search cancelled", "AbortError");

export function createLocationSearchClient({ baseUrl = "", fetcher = (...args) => fetch(...args), budgetMs = 3400 } = {}) {
  const cache = new Map(), pending = new Map();
  function peek(query, lat, lon) {
    const value = cache.get(keyFor(query, lat, lon));
    return value && Date.now() - value.time < 600000 ? value.result : null;
  }
  async function search(query, lat, lon, signal) {
    if (signal?.aborted) throw abortError();
    const hit = peek(query, lat, lon);
    if (hit) return hit;
    const key = keyFor(query, lat, lon);
    let record = pending.get(key);
    if (!record) {
      const controller = new AbortController();
      record = { controller, users: 0 };
      const timer = setTimeout(() => controller.abort(), budgetMs);
      record.promise = (async () => {
        const params = new URLSearchParams({ q: query });
        if (Number.isFinite(lat) && Number.isFinite(lon)) { params.set("lat", lat); params.set("lon", lon); }
        let result;
        for (let attempt = 0; attempt < 2; attempt++) {
          const response = await fetcher(`${baseUrl}/api/locations/search?${params}`, { signal: controller.signal });
          if (!response.ok) throw new Error("Search unavailable");
          result = await response.json();
          if (result.status !== "busy" || attempt) break;
          await new Promise((resolve, reject) => {
            const done = () => { clearTimeout(wait); controller.signal.removeEventListener("abort", stopped); resolve(); };
            const stopped = () => { clearTimeout(wait); controller.signal.removeEventListener("abort", stopped); reject(abortError()); };
            const wait = setTimeout(done, Math.min(result.retry_after_ms || 450, 600));
            if (controller.signal.aborted) stopped();
            else controller.signal.addEventListener("abort", stopped, { once: true });
          });
        }
        if (result.status === "ok" && result.items?.length) {
          if (cache.size >= 200) cache.delete(cache.keys().next().value);
          cache.set(key, { time: Date.now(), result });
        }
        return result;
      })().finally(() => clearTimeout(timer));
      pending.set(key, record);
      record.promise.then(() => { if (pending.get(key) === record) pending.delete(key); }, () => { if (pending.get(key) === record) pending.delete(key); });
    }
    record.users++;
    return new Promise((resolve, reject) => {
      let finished = false;
      const release = () => {
        if (finished) return false;
        finished = true;
        signal?.removeEventListener("abort", stopped);
        record.users--;
        if (!record.users) { record.controller.abort(); if (pending.get(key) === record) pending.delete(key); }
        return true;
      };
      const stopped = () => { if (release()) reject(abortError()); };
      signal?.addEventListener("abort", stopped, { once: true });
      if (signal?.aborted) stopped();
      record.promise.then((result) => { if (release()) resolve(result); }, (error) => { if (release()) reject(error); });
    });
  }
  return { peek, search };
}
