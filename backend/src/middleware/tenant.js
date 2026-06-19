import { Store } from "../models/Store.js";

/**
 * PUBLIC STOREFRONT tenant resolution.
 *
 * Resolves which store a storefront request belongs to from the subdomain,
 * and attaches the active store to req.store. The storeId is taken ONLY from
 * the host — never from the request body — so a visitor cannot read or write
 * another store's data by tampering with the payload.
 *
 * Locally there are no real subdomains, so we also accept an `x-store`
 * header (set by the Next.js dev proxy) as a fallback.
 */
export async function resolveTenant(req, res, next) {
  try {
    const host = req.headers.host || "";
    const sub = host.split(".")[0];
    const subdomain = (req.headers["x-store"] || sub || "").toLowerCase();

    if (!subdomain) {
      return res.status(400).json({ error: "Store could not be resolved" });
    }

    const store = await Store.findOne({ subdomain, status: "active" });
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    req.store = store;
    req.storeId = store._id;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * ADMIN tenant resolution.
 *
 * For owner/admin requests the store is identified by a route param
 * (:storeId) and we verify the authenticated user actually owns it.
 * This is the gate that stops Owner A from touching Owner B's store.
 * Must run AFTER requireAuth.
 */
export async function requireStoreOwner(req, res, next) {
  try {
    const { storeId } = req.params;
    const store = await Store.findOne({ _id: storeId, ownerId: req.user.id });
    if (!store) {
      // 404 (not 403) so we don't reveal that the store exists
      return res.status(404).json({ error: "Store not found" });
    }
    req.store = store;
    req.storeId = store._id;
    next();
  } catch (err) {
    next(err);
  }
}
