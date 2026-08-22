import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";

function createD1Mock() {
  let contentJson = null;
  const statements = [];

  return {
    statements,
    get content() {
      return contentJson ? JSON.parse(contentJson) : null;
    },
    prepare(sql) {
      let bindings = [];
      const statement = {
        bind(...values) {
          bindings = values;
          return statement;
        },
        async first() {
          statements.push({ sql, bindings });
          if (sql.includes("SELECT content_json")) {
            return contentJson ? { content_json: contentJson } : null;
          }
          return null;
        },
        async run() {
          statements.push({ sql, bindings });
          if (sql.includes("INSERT INTO content")) contentJson = bindings[1];
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
      if (url.pathname === "/content-default.json") {
        return new Response(JSON.stringify(defaultContent), {
          headers: { "content-type": "application/json" },
        });
      }
      return new Response("missing", { status: 404 });
    },
  };
}

function adminHeaders() {
  return {
    "oai-authenticated-user-id": "admin-user",
    "oai-authenticated-user-email": "admin@example.com",
  };
}

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for an unknown app route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? "app" : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
  ]) {
    let calls = 0;
    const response = await worker.fetch(request, {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    });

    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  }
});

test("returns the default content asset when D1 has no saved row", async () => {
  const ASSETS = createAssetsMock({ brand: "Default ReelFoundry" });
  const response = await worker.fetch(new Request("https://example.test/api/content"), {
    ASSETS,
    DB: createD1Mock(),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { brand: "Default ReelFoundry" });
  assert.deepEqual(ASSETS.calls, ["/content-default.json"]);
});

test("reports the authenticated session and only grants admin to the configured user", async () => {
  const ASSETS = createAssetsMock();
  const response = await worker.fetch(
    new Request("https://example.test/api/admin/session", {
      headers: {
        "oai-authenticated-user-id": "admin-user",
        "oai-authenticated-user-email": "owner@example.com",
      },
    }),
    { ASSETS, ADMIN_USER_ID: "admin-user" },
  );

  assert.deepEqual(await response.json(), {
    signedIn: true,
    admin: true,
    email: "owner@example.com",
  });

  const nonAdmin = await worker.fetch(
    new Request("https://example.test/api/admin/session", {
      headers: { "oai-authenticated-user-id": "someone-else" },
    }),
    { ASSETS, ADMIN_USER_ID: "admin-user" },
  );
  assert.deepEqual(await nonAdmin.json(), {
    signedIn: true,
    admin: false,
    email: null,
  });
});

test("rejects content writes from non-admin users", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/admin/content", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "nope" }),
    }),
    { ASSETS: createAssetsMock(), DB: createD1Mock(), ADMIN_USER_ID: "admin-user" },
  );

  assert.equal(response.status, 403);
});

test("saves and reads content through the singleton D1 row", async () => {
  const ASSETS = createAssetsMock({ brand: "Fallback" });
  const DB = createD1Mock();
  const saved = { brand: "Saved ReelFoundry", hero: { title: "New title" } };
  const putResponse = await worker.fetch(
    new Request("https://example.test/api/admin/content", {
      method: "PUT",
      headers: { ...adminHeaders(), "content-type": "application/json" },
      body: JSON.stringify(saved),
    }),
    { ASSETS, DB, ADMIN_USER_ID: "admin-user" },
  );

  assert.equal(putResponse.status, 200);
  assert.deepEqual((await putResponse.json()).content, saved);

  const getResponse = await worker.fetch(new Request("https://example.test/api/content"), {
    ASSETS,
    DB,
    ADMIN_USER_ID: "admin-user",
  });
  assert.deepEqual(await getResponse.json(), saved);
  assert.equal(ASSETS.calls.length, 0);
});

test("uploads an image to R2 and serves it with cache metadata", async () => {
  const objects = new Map();
  const MEDIA = {
    async put(key, value, options) {
      objects.set(key, {
        body: await new Response(value).arrayBuffer(),
        httpMetadata: options.httpMetadata,
      });
    },
    async get(key) {
      return objects.get(key) || null;
    },
  };
  const ASSETS = createAssetsMock();
  const DB = createD1Mock();
  const form = new FormData();
  form.append("file", new Blob(["png-bytes"], { type: "image/png" }), "cover.png");

  const uploadResponse = await worker.fetch(
    new Request("https://example.test/api/admin/upload", {
      method: "POST",
      headers: adminHeaders(),
      body: form,
    }),
    { ASSETS, DB, MEDIA, ADMIN_USER_ID: "admin-user" },
  );

  assert.equal(uploadResponse.status, 201);
  const upload = await uploadResponse.json();
  assert.match(upload.url, /^\/media\/media-[0-9a-f-]+\.png$/);
  assert.equal(objects.size, 1);

  const mediaResponse = await worker.fetch(new Request(`https://example.test${upload.url}`), {
    ASSETS,
    MEDIA,
  });
  assert.equal(mediaResponse.status, 200);
  assert.equal(mediaResponse.headers.get("content-type"), "image/png");
  assert.match(mediaResponse.headers.get("cache-control"), /immutable/);
  assert.equal(await mediaResponse.text(), "png-bytes");
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});
