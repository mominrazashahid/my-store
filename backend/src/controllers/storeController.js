import { Store, STORE_TYPES } from "../models/Store.js";
import { Page } from "../models/Page.js";
import { Product } from "../models/Product.js";
import { buildDefaultHomePage } from "../utils/defaultPages.js";
import { buildDefaultProducts } from "../utils/defaultProducts.js";
import { fileUrl } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Single store the owner is working on (req.store set by requireStoreOwner).
export const getStore = asyncHandler(async (req, res) => {
  res.json({ store: req.store });
});

// List the stores owned by the authenticated user.
export const listMyStores = asyncHandler(async (req, res) => {
  const stores = await Store.find({ ownerId: req.user.id }).sort("-createdAt");
  res.json({ stores });
});

// Create a new store + seed its default home page.
export const createStore = asyncHandler(async (req, res) => {
  const { name, subdomain, storeType, themeId } = req.body;

  if (!name || !subdomain || !storeType || !themeId) {
    return res
      .status(400)
      .json({ error: "name, subdomain, storeType, themeId are required" });
  }
  if (!STORE_TYPES.includes(storeType)) {
    return res
      .status(400)
      .json({ error: `storeType must be one of: ${STORE_TYPES.join(", ")}` });
  }

  const taken = await Store.findOne({ subdomain: subdomain.toLowerCase() });
  if (taken) {
    return res.status(409).json({ error: "That subdomain is taken" });
  }

  const store = await Store.create({
    ownerId: req.user.id,
    name,
    subdomain,
    storeType,
    themeId,
  });

  await Page.create({ storeId: store._id, ...buildDefaultHomePage(storeType, name) });

  // Seed a few starter products so the new storefront isn't empty.
  await Product.insertMany(buildDefaultProducts(storeType, store._id));

  res.status(201).json({ store });
});

// Update store-level settings (contact, whatsapp, theme, etc).
export const updateStore = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "themeId",
    "contactPhone",
    "contactEmail",
    "address",
    "settings",
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.store[key] = req.body[key];
  }
  await req.store.save();
  res.json({ store: req.store });
});

// Returns an uploaded image's public URL. Tenant-scoped via requireStoreOwner.
export const uploadStoreImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });
  res.status(201).json({ url: fileUrl(req, req.storeId, req.file.filename) });
});

// ---- Pages (the page builder) ----

export const getStorePage = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ storeId: req.storeId, slug: req.params.slug });
  if (!page) return res.status(404).json({ error: "Page not found" });
  res.json({ page });
});

// Replace a page's sections (owner edits hero text/image, navbar, etc).
export const updateStorePage = asyncHandler(async (req, res) => {
  const { sections, isPublished, title } = req.body;
  const update = {};
  if (Array.isArray(sections)) update.sections = sections;
  if (isPublished !== undefined) update.isPublished = isPublished;
  if (title !== undefined) update.title = title;

  const page = await Page.findOneAndUpdate(
    { storeId: req.storeId, slug: req.params.slug },
    update,
    { new: true, runValidators: true }
  );
  if (!page) return res.status(404).json({ error: "Page not found" });
  res.json({ page });
});
