// Seeds a demo cosmetics store with products so the storefront has content.
// Run: npm run seed   (idempotent — clears and recreates the demo store)
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Store } from "../models/Store.js";
import { Product } from "../models/Product.js";
import { Page } from "../models/Page.js";
import { buildDefaultHomePage } from "./defaultPages.js";

const SUBDOMAIN = "glow-demo";

async function run() {
  await connectDB(process.env.MONGODB_URI);

  let owner = await User.findOne({ email: "demo@my-store.test" });
  if (!owner) {
    owner = new User({ name: "Demo Owner", email: "demo@my-store.test" });
    await owner.setPassword("demo1234");
    await owner.save();
  }

  // wipe any previous demo store + its data
  const old = await Store.findOne({ subdomain: SUBDOMAIN });
  if (old) {
    await Product.deleteMany({ storeId: old._id });
    await Page.deleteMany({ storeId: old._id });
    await old.deleteOne();
  }

  const store = await Store.create({
    ownerId: owner._id,
    name: "Glow Beauty",
    subdomain: SUBDOMAIN,
    storeType: "cosmetics",
    themeId: "glow",
    contactPhone: "+92 300 1234567",
    contactEmail: "hello@glowbeauty.pk",
    settings: { currency: "PKR", whatsapp: "+923001234567" },
  });

  await Page.create({
    storeId: store._id,
    ...buildDefaultHomePage("cosmetics", store.name),
  });

  const items = [
    { title: "Matte Liquid Lipstick", price: 1200, compareAtPrice: 1500, stock: 40 },
    { title: "Hydrating Face Serum", price: 2800, stock: 25 },
    { title: "Velvet Foundation", price: 2200, compareAtPrice: 2600, stock: 30 },
    { title: "Kajal Eyeliner", price: 650, stock: 80 },
    { title: "Rose Glow Highlighter", price: 1800, stock: 18 },
    { title: "Nail Polish Set (6)", price: 1500, stock: 22 },
  ];
  await Product.insertMany(
    items.map((p) => ({ ...p, storeId: store._id, status: "active" }))
  );

  console.log(`\nSeeded store "${store.name}"`);
  console.log(`Visit: http://localhost:3000/store/${SUBDOMAIN}`);
  console.log(`Owner login: demo@my-store.test / demo1234`);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
