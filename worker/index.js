const CONTENT_ID = 1;
const MAX_CONTENT_BYTES = 1024 * 1024;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

function jsonResponse(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function authState(request, env) {
  const userId = request.headers.get("oai-authenticated-user-id");
  const email = request.headers.get("oai-authenticated-user-email");

  return {
    userId,
    email,
    signedIn: Boolean(userId || email),
    admin: typeof env.ADMIN_USER_ID === "string" && Boolean(userId) && userId === env.ADMIN_USER_ID,
  };
}

function requireAdmin(request, env) {
  if (!authState(request, env).admin) {
    return jsonResponse({ error: "admin_required" }, 403);
  }
  return null;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readDefaultContent(request, env) {
  try {
    const defaultUrl = new URL("/content-default.json", request.url);
    const response = await env.ASSETS.fetch(new Request(defaultUrl, { method: "GET" }));
    if (!response.ok) return {};

    const value = JSON.parse(await response.text());
    return isObject(value) ? value : {};
  } catch {
    return {};
  }
}

async function readSavedContent(request, env) {
  if (!env.DB?.prepare) return null;

  try {
    const row = await env.DB
      .prepare("SELECT content_json FROM content WHERE id = ?")
      .bind(CONTENT_ID)
      .first();
    const contentJson = row?.content_json ?? row?.contentJson;
    if (typeof contentJson !== "string") return null;

    const value = JSON.parse(contentJson);
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

async function handleContent(request, env) {
  const saved = await readSavedContent(request, env);
  return jsonResponse(saved ?? (await readDefaultContent(request, env)));
}

async function handleSession(request, env) {
  const { signedIn, admin, email } = authState(request, env);
  return jsonResponse({ signedIn, admin, email: email || null });
}

async function handleSaveContent(request, env) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB?.prepare) return jsonResponse({ error: "database_unavailable" }, 503);

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_CONTENT_BYTES) {
    return jsonResponse({ error: "content_too_large" }, 413);
  }

  let content;
  try {
    const body = await request.arrayBuffer();
    if (body.byteLength > MAX_CONTENT_BYTES) {
      return jsonResponse({ error: "content_too_large" }, 413);
    }
    content = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  if (!isObject(content)) {
    return jsonResponse({ error: "content_must_be_object" }, 400);
  }

  const contentJson = JSON.stringify(content);
  if (new TextEncoder().encode(contentJson).byteLength > MAX_CONTENT_BYTES) {
    return jsonResponse({ error: "content_too_large" }, 413);
  }

  try {
    await env.DB
      .prepare(
        "INSERT INTO content (id, content_json, updated_at) VALUES (?, ?, ?) " +
          "ON CONFLICT(id) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at",
      )
      .bind(CONTENT_ID, contentJson, new Date().toISOString())
      .run();
  } catch {
    return jsonResponse({ error: "content_save_failed" }, 500);
  }

  return jsonResponse({ ok: true, content });
}

async function handleUpload(request, env) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.MEDIA?.put) return jsonResponse({ error: "media_storage_unavailable" }, 503);

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES + 1024 * 1024) {
    return jsonResponse({ error: "file_too_large" }, 413);
  }

  let file;
  try {
    const form = await request.formData();
    file = form.get("file");
  } catch {
    return jsonResponse({ error: "invalid_multipart" }, 400);
  }

  if (!file || typeof file.arrayBuffer !== "function") {
    return jsonResponse({ error: "file_required" }, 400);
  }

  const contentType = String(file.type || "").toLowerCase();
  const extension = IMAGE_TYPES.get(contentType);
  if (!extension) {
    return jsonResponse({ error: "unsupported_file_type" }, 415);
  }

  const fileSize = Number(file.size);
  if (!Number.isFinite(fileSize) || fileSize < 0 || fileSize > MAX_UPLOAD_BYTES) {
    return jsonResponse({ error: "file_too_large" }, 413);
  }

  const key = `media-${crypto.randomUUID()}.${extension}`;
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return jsonResponse({ error: "file_too_large" }, 413);
  }

  const httpMetadata = {
    cacheControl: "public, max-age=31536000, immutable",
    contentType,
  };

  try {
    await env.MEDIA.put(key, bytes, { httpMetadata });
    if (env.DB?.prepare) {
      await env.DB
        .prepare(
          "INSERT INTO media (key, filename, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?) " +
            "ON CONFLICT(key) DO UPDATE SET filename = excluded.filename, content_type = excluded.content_type, " +
            "size_bytes = excluded.size_bytes, created_at = excluded.created_at",
        )
        .bind(key, String(file.name || "upload"), contentType, bytes.byteLength, new Date().toISOString())
        .run();
    }
  } catch {
    return jsonResponse({ error: "upload_failed" }, 500);
  }

  const url = `/media/${key}`;
  return jsonResponse({ ok: true, key, url }, 201);
}

async function handleMedia(request, env, key) {
  if (!env.MEDIA?.get) return new Response("Not found", { status: 404 });

  let decodedKey;
  try {
    decodedKey = decodeURIComponent(key);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!decodedKey || decodedKey.includes("/") || decodedKey.includes("\\") || decodedKey.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  let object;
  try {
    object = await env.MEDIA.get(decodedKey);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!object?.body) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  const contentType = object.httpMetadata?.contentType;
  if (contentType) headers.set("content-type", contentType);
  headers.set(
    "cache-control",
    object.httpMetadata?.cacheControl || "public, max-age=31536000, immutable",
  );
  if (object.httpEtag || object.etag) headers.set("etag", object.httpEtag || object.etag);

  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/content" && request.method === "GET") {
      return handleContent(request, env);
    }
    if (url.pathname === "/api/admin/session" && request.method === "GET") {
      return handleSession(request, env);
    }
    if (url.pathname === "/api/admin/content" && request.method === "PUT") {
      return handleSaveContent(request, env);
    }
    if (url.pathname === "/api/admin/upload" && request.method === "POST") {
      return handleUpload(request, env);
    }
    if (url.pathname.startsWith("/media/") && ["GET", "HEAD"].includes(request.method)) {
      return handleMedia(request, env, url.pathname.slice("/media/".length));
    }

    const response = await env.ASSETS.fetch(request);
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/")) {
      return response;
    }
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
