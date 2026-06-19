// Standalone end-to-end smoke test against a running server on :4000.
const BASE = "http://localhost:4000";

async function call(method, path, { token, store, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (store) headers["x-store"] = store;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("  ok -", msg);
}

const run = async () => {
  const A = (await call("POST", "/api/auth/register", {
    body: { name: "Ali", email: `a${Date.now()}@t.com`, password: "secret123" },
  })).data.token;
  const B = (await call("POST", "/api/auth/register", {
    body: { name: "Bilal", email: `b${Date.now()}@t.com`, password: "secret123" },
  })).data.token;
  assert(A && B, "both owners registered + got JWT");

  const sub = `ali-${Date.now()}`;
  const created = await call("POST", "/api/stores", {
    token: A,
    body: { name: "Ali Cosmetics", subdomain: sub, storeType: "cosmetics", themeId: "glow" },
  });
  assert(created.status === 201, "owner A created a store");
  const storeId = created.data.store._id;

  const prod = await call("POST", `/api/stores/${storeId}/products`, {
    token: A,
    body: { title: "Matte Lipstick", price: 1200, stock: 50 },
  });
  assert(prod.status === 201, "owner A added a product");

  const front = await call("GET", "/api/storefront/products", { store: sub });
  assert(front.data.products?.length === 1, "storefront lists the product via subdomain");

  const page = await call("GET", "/api/storefront/pages/home", { store: sub });
  const types = (page.data.page?.sections || []).map((s) => s.type).join(",");
  assert(types === "navbar,hero,products,footer", "home page seeded with sections: " + types);

  const leak = await call("GET", `/api/stores/${storeId}/products`, { token: B });
  assert(leak.status === 404, "ISOLATION: owner B is blocked from owner A's store (404)");

  console.log("\nALL PASSED");
};

run().catch((e) => {
  console.error("\n" + e.message);
  process.exit(1);
});
