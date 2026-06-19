import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireStoreOwner } from "../middleware/tenant.js";
import { uploadImage } from "../middleware/upload.js";
import {
  listMyStores,
  createStore,
  getStore,
  updateStore,
  uploadStoreImage,
  getStorePage,
  updateStorePage,
} from "../controllers/storeController.js";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { listOrders, updateOrderStatus } from "../controllers/orderController.js";

// All routes here require a logged-in owner.
const router = Router();
router.use(requireAuth);

router.get("/", listMyStores);
router.post("/", createStore);

// Anything under /:storeId/* first verifies the user owns that store.
router.get("/:storeId", requireStoreOwner, getStore);
router.patch("/:storeId", requireStoreOwner, updateStore);

// Image upload (hero, product images, etc) — returns a public URL.
router.post("/:storeId/upload", requireStoreOwner, uploadImage, uploadStoreImage);

// Pages (page builder)
router.get("/:storeId/pages/:slug", requireStoreOwner, getStorePage);
router.patch("/:storeId/pages/:slug", requireStoreOwner, updateStorePage);

router.get("/:storeId/products", requireStoreOwner, listProducts);
router.post("/:storeId/products", requireStoreOwner, createProduct);
router.patch("/:storeId/products/:productId", requireStoreOwner, updateProduct);
router.delete("/:storeId/products/:productId", requireStoreOwner, deleteProduct);

router.get("/:storeId/orders", requireStoreOwner, listOrders);
router.patch("/:storeId/orders/:orderId", requireStoreOwner, updateOrderStatus);

export default router;
