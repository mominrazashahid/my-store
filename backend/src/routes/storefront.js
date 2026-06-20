import { Router } from "express";
import { resolveTenant } from "../middleware/tenant.js";
import { Page } from "../models/Page.js";
import { ThemeConfig } from "../models/ThemeConfig.js";
import { buildDefaultTheme } from "../utils/defaultTheme.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listStorefrontProducts } from "../controllers/productController.js";
import { createOrder } from "../controllers/orderController.js";
import {
  listPublishedPosts,
  getPublishedPost,
} from "../controllers/blogController.js";

// Public, read-only storefront API. Tenant comes from the subdomain.
const router = Router();
router.use(resolveTenant);

// Basic public store info (name, theme, contact) for rendering.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { name, storeType, themeId, settings, contactPhone, contactEmail, address } =
      req.store;
    const cfg = await ThemeConfig.findOne({ storeId: req.storeId });
    res.json({
      name,
      storeType,
      themeId,
      settings,
      contactPhone,
      contactEmail,
      address,
      theme: cfg?.published || buildDefaultTheme(),
    });
  })
);

// A published page by slug (defaults to "home") with its sections.
router.get(
  "/pages/:slug",
  asyncHandler(async (req, res) => {
    const page = await Page.findOne({
      storeId: req.storeId,
      slug: req.params.slug,
      isPublished: true,
    });
    if (!page) return res.status(404).json({ error: "Page not found" });
    res.json({ page });
  })
);

router.get("/products", listStorefrontProducts);

// Guest COD checkout
router.post("/orders", createOrder);

// Blog (published only)
router.get("/posts", listPublishedPosts);
router.get("/posts/:slug", getPublishedPost);

export default router;
