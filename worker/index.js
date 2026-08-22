const CONTENT_ID = 1;
const MAX_CONTENT_BYTES = 1024 * 1024;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const SESSION_COOKIE = "reelfoundry_admin_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;
// Cloudflare Workers currently caps a single PBKDF2 operation at 100,000 iterations.
const PBKDF2_ITERATIONS = 100_000;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_HASH_BYTES = 32;
const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const textEncoder = new TextEncoder();
const DUMMY_SALT = new Uint8Array(PASSWORD_SALT_BYTES);
const DUMMY_HASH = new Uint8Array(PASSWORD_HASH_BYTES);

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

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function encodeBase64Url(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  if (typeof value !== "string" || !value) return null;
  let normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  normalized += "=".repeat((4 - (normalized.length % 4)) % 4);
  try {
    const binary = atob(normalized);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function decodeSecret(value) {
  if (typeof value !== "string" || !value) return null;
  const hexValue = value.startsWith("hex:") ? value.slice(4) : value;
  if (/^[0-9a-f]+$/i.test(hexValue) && [32, 64].includes(hexValue.length)) {
    const bytes = new Uint8Array(hexValue.length / 2);
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Number.parseInt(hexValue.slice(index * 2, index * 2 + 2), 16);
    }
    return bytes;
  }
  return decodeBase64Url(value);
}

function constantTimeEqual(left, right) {
  const maxLength = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < maxLength; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

function constantTimeTextEqual(left, right) {
  return constantTimeEqual(textEncoder.encode(left), textEncoder.encode(right));
}

async function derivePasswordHash(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    PASSWORD_HASH_BYTES * 8,
  );
  return new Uint8Array(bits);
}

async function hashSessionToken(token) {
  return encodeBase64Url(await crypto.subtle.digest("SHA-256", textEncoder.encode(token)));
}

function normalizedRateLimitUsername(username) {
  return typeof username === "string" ? username.trim().toLowerCase() : "";
}

async function loginRateLimitKey(request, username) {
  const ip = request.headers.get("cf-connecting-ip")?.trim() || "unknown";
  return hashSessionToken(ip + "\n" + normalizedRateLimitUsername(username));
}

async function readLoginAttempt(request, env, username) {
  const keyHash = await loginRateLimitKey(request, username);
  try {
    const row = await env.DB
      .prepare(
        "SELECT key_hash, window_started_at, failed_count FROM admin_login_attempts WHERE key_hash = ?",
      )
      .bind(keyHash)
      .first();
    const startedAt = row ? Date.parse(row.window_started_at) : NaN;
    const withinWindow = Number.isFinite(startedAt) && Date.now() - startedAt < LOGIN_WINDOW_MS;
    return {
      unavailable: false,
      keyHash,
      windowStartedAt: withinWindow ? row.window_started_at : new Date().toISOString(),
      failedCount: withinWindow ? Number(row.failed_count) || 0 : 0,
      blocked: withinWindow && Number(row.failed_count) >= LOGIN_MAX_FAILURES,
    };
  } catch {
    return { unavailable: true, keyHash, blocked: false, failedCount: 0 };
  }
}

async function recordLoginFailure(env, attempt) {
  const now = new Date().toISOString();
  const failedCount = Math.min(attempt.failedCount + 1, LOGIN_MAX_FAILURES);
  await env.DB
    .prepare(
      "INSERT INTO admin_login_attempts (key_hash, window_started_at, failed_count, updated_at) VALUES (?, ?, ?, ?) " +
        "ON CONFLICT(key_hash) DO UPDATE SET window_started_at = excluded.window_started_at, " +
        "failed_count = excluded.failed_count, updated_at = excluded.updated_at",
    )
    .bind(attempt.keyHash, attempt.windowStartedAt || now, failedCount, now)
    .run();
}

async function clearLoginAttempt(env, attempt) {
  await env.DB
    .prepare("DELETE FROM admin_login_attempts WHERE key_hash = ?")
    .bind(attempt.keyHash)
    .run();
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function normalizeCredentialRow(row) {
  if (!row) return null;
  const username = row.username;
  const passwordSalt = row.password_salt ?? row.passwordSalt;
  const passwordHash = row.password_hash ?? row.passwordHash;
  if (
    typeof username !== "string" ||
    typeof passwordSalt !== "string" ||
    typeof passwordHash !== "string"
  ) {
    return null;
  }
  return { username, passwordSalt, passwordHash };
}

async function readCredential(env) {
  if (!env.DB?.prepare) return { unavailable: true, credential: null };
  try {
    const row = await env.DB
      .prepare("SELECT username, password_salt, password_hash FROM admin_credentials WHERE id = 1")
      .first();
    return { unavailable: false, credential: normalizeCredentialRow(row) };
  } catch {
    return { unavailable: true, credential: null };
  }
}

function bootstrapCredential(env) {
  const username = env.ADMIN_BOOTSTRAP_USERNAME;
  const passwordSalt = env.ADMIN_BOOTSTRAP_PASSWORD_SALT;
  const passwordHash = env.ADMIN_BOOTSTRAP_PASSWORD_HASH;
  if (
    typeof username !== "string" ||
    typeof passwordSalt !== "string" ||
    typeof passwordHash !== "string"
  ) {
    return null;
  }
  return { username, passwordSalt, passwordHash };
}

async function saveBootstrapCredential(env, credential) {
  await env.DB
    .prepare(
      "INSERT INTO admin_credentials (id, username, password_salt, password_hash, updated_at) " +
        "VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING",
    )
    .bind(
      credential.username,
      credential.passwordSalt,
      credential.passwordHash,
      new Date().toISOString(),
    )
    .run();
}

function readCookie(request, name) {
  const cookieHeader = request.headers.get("cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

function sessionCookie(request, token) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return (
    SESSION_COOKIE +
    "=" +
    encodeURIComponent(token) +
    "; Max-Age=" +
    SESSION_TTL_SECONDS +
    "; Path=/; HttpOnly; SameSite=Strict" +
    secure
  );
}

function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return (
    SESSION_COOKIE +
    "=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Strict" +
    secure
  );
}

function sameOriginDenied(request) {
  const origin = request.headers.get("origin");
  if (origin && origin === new URL(request.url).origin) return null;
  return jsonResponse({ error: "same_origin_required" }, 403);
}

async function readSession(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || !env.DB?.prepare) return null;

  const tokenHash = await hashSessionToken(token);
  try {
    const row = await env.DB
      .prepare(
        "SELECT token_hash, expires_at FROM admin_sessions WHERE token_hash = ? AND expires_at > ?",
      )
      .bind(tokenHash, new Date().toISOString())
      .first();
    if (!row) return null;

    const result = await readCredential(env);
    if (result.unavailable || !result.credential) return null;
    return { tokenHash, username: result.credential.username };
  } catch {
    return null;
  }
}

async function requireSession(request, env) {
  const session = await readSession(request, env);
  if (!session) return { response: jsonResponse({ error: "admin_required" }, 401) };
  return { session };
}

async function readJsonBody(request, maxBytes = MAX_CONTENT_BYTES) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return { error: "too_large" };

  try {
    const body = await request.arrayBuffer();
    if (body.byteLength > maxBytes) return { error: "too_large" };
    return { value: JSON.parse(new TextDecoder().decode(body)) };
  } catch {
    return { error: "invalid_json" };
  }
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

async function readSavedContent(env) {
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
  const saved = await readSavedContent(env);
  return jsonResponse(saved ?? (await readDefaultContent(request, env)));
}

async function handleSession(request, env) {
  const session = await readSession(request, env);
  return jsonResponse(
    session
      ? { signedIn: true, admin: true, username: session.username }
      : { signedIn: false, admin: false, username: null },
  );
}

function invalidLoginResponse() {
  return jsonResponse({ error: "invalid_credentials" }, 401);
}

async function handleLogin(request, env) {
  const originDenied = sameOriginDenied(request);
  if (originDenied) return originDenied;
  if (!env.DB?.prepare) return jsonResponse({ error: "database_unavailable" }, 503);

  const body = await readJsonBody(request, 16 * 1024);
  const username = typeof body.value?.username === "string" ? body.value.username : "";
  const password = typeof body.value?.password === "string" ? body.value.password : "";
  const attempt = await readLoginAttempt(request, env, username);
  if (attempt.unavailable) return jsonResponse({ error: "database_unavailable" }, 503);
  if (attempt.blocked) return jsonResponse({ error: "too_many_attempts" }, 429);
  const stored = await readCredential(env);
  if (stored.unavailable) return jsonResponse({ error: "database_unavailable" }, 503);

  const candidate = stored.credential || bootstrapCredential(env);
  const salt = decodeSecret(candidate?.passwordSalt) || DUMMY_SALT;
  const expectedHash = decodeSecret(candidate?.passwordHash) || DUMMY_HASH;
  const actualHash = await derivePasswordHash(password, salt);
  const usernameMatches = constantTimeTextEqual(username, candidate?.username || "");
  const passwordMatches = constantTimeEqual(actualHash, expectedHash);
  const valid = Boolean(
    candidate &&
      usernameMatches &&
      passwordMatches &&
      decodeSecret(candidate.passwordHash),
  );

  if (!valid || body.error) {
    try {
      await recordLoginFailure(env, attempt);
    } catch {
      return jsonResponse({ error: "database_unavailable" }, 503);
    }
    return invalidLoginResponse();
  }

  try {
    if (!stored.credential) await saveBootstrapCredential(env, candidate);

    const token = encodeBase64Url(randomBytes(32));
    const tokenHash = await hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
    await env.DB
      .prepare(
        "INSERT INTO admin_sessions (token_hash, expires_at, created_at) VALUES (?, ?, ?)",
      )
      .bind(tokenHash, expiresAt, new Date().toISOString())
      .run();
    await clearLoginAttempt(env, attempt);

    return jsonResponse(
      { ok: true, username: candidate.username },
      200,
      { "set-cookie": sessionCookie(request, token) },
    );
  } catch {
    return jsonResponse({ error: "login_unavailable" }, 503);
  }
}

async function handleLogout(request, env) {
  const originDenied = sameOriginDenied(request);
  if (originDenied) return originDenied;

  const token = readCookie(request, SESSION_COOKIE);
  if (token && env.DB?.prepare) {
    try {
      const tokenHash = await hashSessionToken(token);
      await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").bind(tokenHash).run();
    } catch {
      return jsonResponse({ error: "logout_failed" }, 503);
    }
  }

  return jsonResponse({ ok: true }, 200, { "set-cookie": clearSessionCookie(request) });
}

async function handleSaveContent(request, env) {
  const originDenied = sameOriginDenied(request);
  if (originDenied) return originDenied;
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  if (!env.DB?.prepare) return jsonResponse({ error: "database_unavailable" }, 503);

  const body = await readJsonBody(request);
  if (body.error === "too_large") return jsonResponse({ error: "content_too_large" }, 413);
  if (body.error) return jsonResponse({ error: "invalid_json" }, 400);
  const content = body.value;
  if (!isObject(content)) return jsonResponse({ error: "content_must_be_object" }, 400);

  const contentJson = JSON.stringify(content);
  if (textEncoder.encode(contentJson).byteLength > MAX_CONTENT_BYTES) {
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
  const originDenied = sameOriginDenied(request);
  if (originDenied) return originDenied;
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
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
  if (!extension) return jsonResponse({ error: "unsupported_file_type" }, 415);

  const fileSize = Number(file.size);
  if (!Number.isFinite(fileSize) || fileSize < 0 || fileSize > MAX_UPLOAD_BYTES) {
    return jsonResponse({ error: "file_too_large" }, 413);
  }

  const key = "media-" + crypto.randomUUID() + "." + extension;
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_UPLOAD_BYTES) return jsonResponse({ error: "file_too_large" }, 413);

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

  const url = "/media/" + key;
  return jsonResponse({ ok: true, key, url }, 201);
}

function isValidUsername(username) {
  return (
    typeof username === "string" &&
    username.length >= 3 &&
    username.length <= 64 &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(username)
  );
}

async function handleCredentials(request, env) {
  const originDenied = sameOriginDenied(request);
  if (originDenied) return originDenied;
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  if (!env.DB?.prepare) return jsonResponse({ error: "database_unavailable" }, 503);

  const body = await readJsonBody(request, 16 * 1024);
  if (body.error === "too_large") return jsonResponse({ error: "request_too_large" }, 413);
  if (body.error) return jsonResponse({ error: "invalid_json" }, 400);

  const currentPassword =
    typeof body.value?.currentPassword === "string" ? body.value.currentPassword : "";
  const newUsername =
    typeof body.value?.newUsername === "string" ? body.value.newUsername : "";
  const newPassword =
    typeof body.value?.newPassword === "string" ? body.value.newPassword : "";
  const credentialResult = await readCredential(env);
  const credential = credentialResult.credential;
  if (credentialResult.unavailable || !credential) {
    return jsonResponse({ error: "database_unavailable" }, 503);
  }

  const currentSalt = decodeSecret(credential.passwordSalt) || DUMMY_SALT;
  const currentExpected = decodeSecret(credential.passwordHash) || DUMMY_HASH;
  const currentActual = await derivePasswordHash(currentPassword, currentSalt);
  if (!constantTimeEqual(currentActual, currentExpected)) return invalidLoginResponse();
  if (!isValidUsername(newUsername) || newPassword.length < 12 || newPassword.length > 256) {
    return jsonResponse({ error: "invalid_new_credentials" }, 400);
  }

  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const passwordHash = encodeBase64Url(await derivePasswordHash(newPassword, salt));
  const passwordSalt = encodeBase64Url(salt);
  try {
    await env.DB
      .prepare(
        "UPDATE admin_credentials SET username = ?, password_salt = ?, password_hash = ?, updated_at = ? WHERE id = 1",
      )
      .bind(newUsername, passwordSalt, passwordHash, new Date().toISOString())
      .run();
    await env.DB.prepare("DELETE FROM admin_sessions").run();
  } catch {
    return jsonResponse({ error: "credentials_update_failed" }, 500);
  }

  return jsonResponse(
    { ok: true, relogin: true },
    200,
    { "set-cookie": clearSessionCookie(request) },
  );
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
    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      return handleLogin(request, env);
    }
    if (url.pathname === "/api/admin/logout" && request.method === "POST") {
      return handleLogout(request, env);
    }
    if (url.pathname === "/api/admin/credentials" && request.method === "PUT") {
      return handleCredentials(request, env);
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
