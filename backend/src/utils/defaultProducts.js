// Starter sample products seeded when a new store is created, so the
// storefront isn't empty on day one. The owner can edit or delete these.
// Kept small (well under the 20-product free cap). Prices in PKR.

const SAMPLES = {
  cosmetics: [
    { title: "Matte Liquid Lipstick", price: 1200, compareAtPrice: 1500, stock: 40 },
    { title: "Hydrating Face Serum", price: 2800, stock: 25 },
    { title: "Velvet Foundation", price: 2200, compareAtPrice: 2600, stock: 30 },
    { title: "Kajal Eyeliner", price: 650, stock: 80 },
  ],
  clothing: [
    { title: "Embroidered Lawn Suit (3pc)", price: 4500, compareAtPrice: 5500, stock: 20 },
    { title: "Cotton Kurta", price: 2200, stock: 35 },
    { title: "Denim Jacket", price: 3800, stock: 15 },
    { title: "Printed Dupatta", price: 1200, compareAtPrice: 1600, stock: 50 },
  ],
  electronics: [
    { title: "Wireless Earbuds", price: 3500, compareAtPrice: 4200, stock: 30 },
    { title: "20000mAh Power Bank", price: 2800, stock: 40 },
    { title: "Smart Watch", price: 5500, compareAtPrice: 6500, stock: 18 },
    { title: "USB-C Fast Charger", price: 1500, stock: 60 },
  ],
};

export function buildDefaultProducts(storeType, storeId) {
  const items = SAMPLES[storeType] || SAMPLES.cosmetics;
  return items.map((p) => ({ ...p, storeId, status: "active", images: [] }));
}
