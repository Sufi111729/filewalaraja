import axios from "axios";

function resolveApiBaseUrl() {
  const rawBase = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
  if (import.meta.env.DEV) {
    // In dev, always use Vite proxy: /api -> http://localhost:8080
    return "/api";
  }
  if (!rawBase) return "/api";
  return rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;
}

const aiHttp = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 8000,
  headers: {
    Accept: "application/json"
  }
});

function normalizeHealth(data) {
  return {
    status: data?.status === "UP" ? "UP" : "DOWN",
    features: {
      enhance: !!data?.features?.enhance,
      bgWhitePro: !!data?.features?.bgWhitePro
    },
    version: data?.version || "unknown",
    error: data?.message || ""
  };
}

function toErrorMessage(error, fallback) {
  if (axios.isCancel(error)) return "Request cancelled.";
  const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
  return serverMessage || error?.message || fallback;
}

async function withRetry(fn, retry = 1) {
  let lastError = null;
  for (let i = 0; i <= retry; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retry) await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw lastError;
}

export async function getAiHealth(options = {}) {
  try {
    const result = await withRetry(
      () => aiHttp.get("/ai/health", { timeout: options.timeoutMs ?? 8000, signal: options.signal }),
      options.retry ?? 1
    );
    return normalizeHealth(result.data);
  } catch (error) {
    return {
      status: "DOWN",
      features: { enhance: false, bgWhitePro: false },
      version: "unknown",
      error: toErrorMessage(error, "Health check failed")
    };
  }
}

async function postImageBlob(path, file, options = {}) {
  const form = new FormData();
  // Backend expects: @RequestParam("image")
  form.append("image", file, file.name || "image.jpg");

  if (options.fields && typeof options.fields === "object") {
    Object.entries(options.fields).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      form.append(key, String(value));
    });
  }

  try {
    const response = await aiHttp.post(path, form, {
      timeout: options.timeoutMs ?? 120000,
      signal: options.signal,
      responseType: "blob",
      headers: {
        Accept: "image/*"
      },
      onUploadProgress: (event) => {
        if (!options.onUploadProgress || !event.total) return;
        options.onUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    return response.data;
  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      try {
        const txt = await error.response.data.text();
        throw new Error(txt || "AI request failed.");
      } catch {
        throw new Error("AI request failed.");
      }
    }
    if (error?.name === "CanceledError" || error?.name === "AbortError") {
      throw new DOMException("Request aborted", "AbortError");
    }
    throw new Error(toErrorMessage(error, "Network error while contacting AI service."));
  }
}

export async function healthCheck(options = {}) {
  return getAiHealth(options);
}

export async function enhancePhoto(file, useGfpgan = false, upscale = 2, options = {}) {
  const blob = await postImageBlob("/enhance-photo", file, {
    ...options,
    fields: {
      useGfpgan,
      upscale,
      ...(options.fields || {})
    }
  });
  return blob;
}

export async function bgWhitePro(file, model = "u2net", featherRadius = 8, options = {}) {
  const blob = await postImageBlob("/bg-white-pro", file, {
    ...options,
    fields: {
      model,
      featherRadius,
      ...(options.fields || {})
    }
  });
  return blob;
}
