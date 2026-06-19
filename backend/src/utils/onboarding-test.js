// Simulates the browser onboarding flow against the running backend,
// including the Origin header (CORS) the browser would send.
const API = "http://localhost:4000";
const ORIGIN = "http://localhost:3000";

async function call(path, body, token) {
  const headers = { "Content-Type": "application/json", Origin: ORIGIN };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + path, { method: "POST", headers, body: JSON.stringify(body) });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const run = async () => {
  const stamp = Date.now();
  const sub = `clothing-${stamp}`;

  // Step 1: register (account)
  const reg = await call("/api/auth/register", {
    name: "Sara Khan",
    email: `sara${stamp}@test.com`,
    password: "secret123",
  });
  if (reg.status !== 201) throw new Error("register failed: " + JSON.stringify(reg.data));
  console.log("  ok - account created");

  // Step 2+3: create store (type clothing, theme glow)
  const store = await call(
    "/api/stores",
    { name: "Sara Boutique", subdomain: sub, storeType: "clothing", themeId: "glow" },
    reg.data.token
  );
  if (store.status !== 201) throw new Error("createStore failed: " + JSON.stringify(store.data));
  console.log("  ok - store created:", store.data.store.subdomain);

  // The user now lands on /store/<sub>. Verify the storefront API serves it.
  const front = await fetch(`${API}/api/storefront/pages/home`, {
    headers: { "x-store": sub },
  });
  const page = await front.json();
  const types = (page.page?.sections || []).map((s) => s.type).join(",");
  if (types !== "navbar,hero,products,footer") throw new Error("home page not seeded: " + types);
  console.log("  ok - public storefront live with seeded home page");

  console.log("\nONBOARDING FLOW PASSED");
};

run().catch((e) => {
  console.error("\nFAIL:", e.message);
  process.exit(1);
});
