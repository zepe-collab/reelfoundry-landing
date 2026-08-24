import assert from "node:assert/strict";
import { pbkdf2Sync } from "node:crypto";
import { access } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { defaultSiteContent, mergeSiteContent } from "../src/siteContent.js";

const ORIGIN = "https://example.test";
const TEST_USERNAME = "reelfoundry-admin";
const TEST_PASSWORD = "correct-horse-2026";
const TEST_SALT = "00112233445566778899aabbccddeeff";
const TEST_HASH = pbkdf2Sync(TEST_PASSWORD, Buffer.from(TEST_SALT, "hex"), 100_000, 32, "sha256").toString("hex");

function createD1Mock() {
  const state = { contentJson: null, credential: null, sessions: new Map(), attempts: new Map(), statements: [] };
  return {
    state,
    prepare(sql) {
      let bindings = [];
      const statement = {
        bind(...values) { bindings = values; return statement; },
        async first() {
          state.statements.push({ sql, bindings });
          if (sql.includes("SELECT content_json")) return state.contentJson ? { content_json: state.contentJson } : null;
          if (sql.includes("FROM admin_credentials")) {
            return state.credential ? {
              username: state.credential.username,
              password_salt: state.credential.passwordSalt,
              password_hash: state.credential.passwordHash,
            } : null;
          }
          if (sql.includes("FROM admin_sessions")) {
            const session = state.sessions.get(bindings[0]);
            return session && session.expiresAt > bindings[1] ? { token_hash: bindings[0], expires_at: session.expiresAt } : null;
          }
          if (sql.includes("FROM admin_login_attempts")) {
            const attempt = state.attempts.get(bindings[0]);
            return attempt ? { key_hash: bindings[0], window_started_at: attempt.windowStartedAt, failed_count: attempt.failedCount } : null;
          }
          return null;
        },
        async run() {
          state.statements.push({ sql, bindings });
          if (sql.includes("INSERT INTO content")) state.contentJson = bindings[1];
          if (sql.includes("INSERT INTO admin_credentials")) {
            state.credential ??= { username: bindings[0], passwordSalt: bindings[1], passwordHash: bindings[2], updatedAt: bindings[3] };
          }
          if (sql.includes("INSERT INTO admin_sessions")) state.sessions.set(bindings[0], { expiresAt: bindings[1], createdAt: bindings[2] });
          if (sql.includes("INSERT INTO admin_login_attempts")) {
            state.attempts.set(bindings[0], { windowStartedAt: bindings[1], failedCount: bindings[2], updatedAt: bindings[3] });
          }
          if (sql.includes("DELETE FROM admin_login_attempts")) state.attempts.delete(bindings[0]);
          if (sql.includes("DELETE FROM admin_sessions WHERE")) state.sessions.delete(bindings[0]);
          if (sql.includes("DELETE FROM admin_sessions") && !sql.includes("WHERE")) state.sessions.clear();
          if (sql.includes("UPDATE admin_credentials")) {
            state.credential = { username: bindings[0], passwordSalt: bindings[1], passwordHash: bindings[2], updatedAt: bindings[3] };
          }
          return { success: true };
        },
      };
      return statement;
    },
  };
}

function createAssetsMock(defaultContent = { fallback: true }) {
  const calls = [];
  return {
    calls,
    fetch: async (request) => {
      const url = new URL(request.url);
      calls.push(url.pathname + url.search);
      if (url.pathname === "/content-default.json") return new Response(JSON.stringify(defaultContent), { headers: { "content-type": "application/json" } });
      return new Response("missing", { status: 404 });
    },
  };
}

function createMediaMock() {
  const objects = new Map();
  return {
    objects,
    async put(key, value, options) { objects.set(key, { body: await new Response(value).arrayBuffer(), httpMetadata: options.httpMetadata }); },
    async get(key) { return objects.get(key) || null; },
  };
}

function createEnv(overrides = {}) {
  return {
    ASSETS: createAssetsMock(),
    DB: createD1Mock(),
    MEDIA: createMediaMock(),
    ADMIN_BOOTSTRAP_USERNAME: TEST_USERNAME,
    ADMIN_BOOTSTRAP_PASSWORD_SALT: TEST_SALT,
    ADMIN_BOOTSTRAP_PASSWORD_HASH: TEST_HASH,
    ...overrides,
  };
}

function stateChangingHeaders(extra = {}) { return { origin: ORIGIN, ...extra }; }

function sessionCookie(response) {
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie, "expected a session cookie");
  return setCookie.split(";", 1)[0];
}

async function login(env, username = TEST_USERNAME, password = TEST_PASSWORD, remember = false) {
  const response = await worker.fetch(new Request(`${ORIGIN}/api/admin/login`, {
    method: "POST",
    headers: stateChangingHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ username, password, remember }),
  }), env);
  return { response, cookie: response.ok ? sessionCookie(response) : null };
}

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request(`${ORIGIN}/assets/app.js`), {
    ASSETS: { fetch: async (request) => { calls.push(new URL(request.url).pathname); return new Response("asset"); } },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for the admin route", async () => {
  const calls = [];
  const response = await worker.fetch(new Request(`${ORIGIN}/admin`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async (request) => { const path = new URL(request.url).pathname; calls.push(path); return new Response(path === "/index.html" ? "app" : "missing", { status: path === "/index.html" ? 200 : 404 }); } },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/admin", "/index.html"]);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [new Request(`${ORIGIN}/api/missing`), new Request(`${ORIGIN}/flow`, { method: "POST", headers: { accept: "text/html" } })]) {
    let calls = 0;
    const response = await worker.fetch(request, { ASSETS: { fetch: async () => { calls += 1; return new Response("missing", { status: 404 }); } } });
    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  }
});

test("returns the default content asset when D1 has no saved row", async () => {
  const ASSETS = createAssetsMock({ brand: "Default ReelFoundry" });
  const response = await worker.fetch(new Request(`${ORIGIN}/api/content`), { ASSETS, DB: createD1Mock() });
  assert.deepEqual(await response.json(), { brand: "Default ReelFoundry" });
  assert.deepEqual(ASSETS.calls, ["/content-default.json"]);
});

test("bootstraps the custom account and authenticates with an HttpOnly cookie", async () => {
  const env = createEnv();
  const { response, cookie } = await login(env);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  assert.match(response.headers.get("set-cookie"), /SameSite=Strict/);
  assert.doesNotMatch(response.headers.get("set-cookie"), /Max-Age=/);
  assert.equal(env.DB.state.credential.username, TEST_USERNAME);
  const session = await worker.fetch(new Request(`${ORIGIN}/api/admin/session`, { headers: { cookie } }), env);
  assert.deepEqual(await session.json(), { signedIn: true, admin: true, username: TEST_USERNAME });
});

test("keeps a remembered admin session on the device for thirty days", async () => {
  const env = createEnv();
  const { response, cookie } = await login(env, TEST_USERNAME, TEST_PASSWORD, true);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /Max-Age=2592000/);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  assert.match(response.headers.get("set-cookie"), /Secure/);
  const session = await worker.fetch(new Request(`${ORIGIN}/api/admin/session`, { headers: { cookie } }), env);
  assert.equal((await session.json()).signedIn, true);
});

test("rejects a wrong password without revealing account details", async () => {
  const { response } = await login(createEnv(), TEST_USERNAME, "definitely-wrong");
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "invalid_credentials" });
});

test("rate-limits the sixth failed login in a fifteen-minute window", async () => {
  const env = createEnv();
  for (let attempt = 0; attempt < 5; attempt += 1) assert.equal((await login(env, TEST_USERNAME, "wrong-password")).response.status, 401);
  const { response } = await login(env, TEST_USERNAME, "wrong-password");
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "too_many_attempts" });
});

test("requires an authenticated session for content writes", async () => {
  const response = await worker.fetch(new Request(`${ORIGIN}/api/admin/content`, {
    method: "PUT",
    headers: stateChangingHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ title: "nope" }),
  }), createEnv());
  assert.equal(response.status, 401);
});

test("saves and reads content through the singleton D1 row", async () => {
  const env = createEnv();
  const { cookie } = await login(env);
  const saved = { brand: "Saved ReelFoundry", hero: { title: "New title" } };
  const putResponse = await worker.fetch(new Request(`${ORIGIN}/api/admin/content`, {
    method: "PUT",
    headers: stateChangingHeaders({ cookie, "content-type": "application/json" }),
    body: JSON.stringify(saved),
  }), env);
  assert.equal(putResponse.status, 200);
  assert.deepEqual(await (await worker.fetch(new Request(`${ORIGIN}/api/content`), env)).json(), saved);
});

test("uploads an image and serves it from R2", async () => {
  const env = createEnv();
  const { cookie } = await login(env);
  const form = new FormData();
  form.append("file", new Blob(["png-bytes"], { type: "image/png" }), "cover.png");
  const uploadResponse = await worker.fetch(new Request(`${ORIGIN}/api/admin/upload`, { method: "POST", headers: stateChangingHeaders({ cookie }), body: form }), env);
  assert.equal(uploadResponse.status, 201);
  const upload = await uploadResponse.json();
  assert.match(upload.url, /^\/media\/media-[0-9a-f-]+\.png$/);
  const mediaResponse = await worker.fetch(new Request(`${ORIGIN}${upload.url}`), env);
  assert.equal(mediaResponse.headers.get("content-type"), "image/png");
  assert.equal(await mediaResponse.text(), "png-bytes");
});

test("changes the single account and invalidates every old session", async () => {
  const env = createEnv();
  const { cookie } = await login(env);
  const response = await worker.fetch(new Request(`${ORIGIN}/api/admin/credentials`, {
    method: "PUT",
    headers: stateChangingHeaders({ cookie, "content-type": "application/json" }),
    body: JSON.stringify({ currentPassword: TEST_PASSWORD, newUsername: "studio-owner", newPassword: "a-new-password-2026" }),
  }), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, relogin: true });
  const oldSession = await worker.fetch(new Request(`${ORIGIN}/api/admin/session`, { headers: { cookie } }), env);
  assert.equal((await oldSession.json()).signedIn, false);
  assert.equal((await login(env, TEST_USERNAME, TEST_PASSWORD)).response.status, 401);
  assert.equal((await login(env, "studio-owner", "a-new-password-2026")).response.status, 200);
});

test("logout removes the active session", async () => {
  const env = createEnv();
  const { cookie } = await login(env);
  const response = await worker.fetch(new Request(`${ORIGIN}/api/admin/logout`, { method: "POST", headers: stateChangingHeaders({ cookie }) }), env);
  assert.equal(response.status, 200);
  const session = await worker.fetch(new Request(`${ORIGIN}/api/admin/session`, { headers: { cookie } }), env);
  assert.equal((await session.json()).signedIn, false);
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});

test("fills complete product stories while preserving saved admin edits", () => {
  const merged = mergeSiteContent({
    products: {
      items: [
        {},
        {
          story: {
            title: "后台修改后的故事标题",
            prompts: ["新的第一句", "新的第二句"],
            steps: [{ title: "新步骤一" }],
            bullets: ["新要点一", "新要点二", "新要点三"],
          },
        },
      ],
    },
  });

  const story = merged.products.items[1].story;
  assert.equal(story.title, "后台修改后的故事标题");
  assert.deepEqual(story.prompts, ["新的第一句", "新的第二句"]);
  assert.equal(story.steps[0].title, "新步骤一");
  assert.equal(story.steps[0].text, defaultSiteContent.products.items[1].story.steps[0].text);
  assert.equal(story.steps.length, 3);
  assert.deepEqual(story.bullets, ["新要点一", "新要点二", "新要点三"]);
});
