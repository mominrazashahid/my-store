import { Product } from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const FREE_LIMIT = Number(process.env.FREE_PLAN_PRODUCT_LIMIT || 20);

// ---- Admin (owner) endpoints: scoped by req.storeId from requireStoreOwner ----

export const listProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ storeId: req.storeId }).sort("-createdAt");
  res.json({ products });
});

export const createProduct = asyncHandler(async (req, res) => {
  // Enforce the free-plan cap before inserting.
  if (req.store.plan === "free") {
    const count = await Product.countDocuments({ storeId: req.storeId });
    if (count >= FREE_LIMIT) {
      return res.status(403).json({
        error: `Free plan is limited to ${FREE_LIMIT} products. Upgrade to add more.`,
        code: "PRODUCT_LIMIT_REACHED",
      });
    }
  }

  const { title, description, price, compareAtPrice, images, stock, status, categoryId } =
    req.body;
  if (!title || price === undefined) {
    return res.status(400).json({ error: "title and price are required" });
  }

  const product = await Product.create({
    storeId: req.storeId,
    title,
    description,
    price,
    compareAtPrice,
    images,
    stock,
    status,
    categoryId,
  });
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  // The storeId filter is what keeps this tenant-safe.
  const product = await Product.findOneAndUpdate(
    { _id: req.params.productId, storeId: req.storeId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({
    _id: req.params.productId,
    storeId: req.storeId,
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ ok: true });
});

// ---- Public storefront endpoint: scoped by req.storeId from resolveTenant ----

export const listStorefrontProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    storeId: req.storeId,
    status: "active",
  }).sort("-createdAt");
  res.json({ products });
});
