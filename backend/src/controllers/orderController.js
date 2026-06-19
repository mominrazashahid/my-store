import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * PUBLIC storefront checkout (COD). Tenant comes from resolveTenant (subdomain).
 *
 * Trust nothing from the client except productId + qty. Prices and titles are
 * read from the DB. Stock is decremented atomically PER product using a guarded
 * findOneAndUpdate ({ stock: $gte qty }), so two shoppers can't oversell the
 * same item. If any line fails we compensate (re-increment) the ones already
 * taken and reject — no replica-set transaction required.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { customer, items } = req.body;

  if (!customer?.name || !customer?.phone || !customer?.address || !customer?.city) {
    return res.status(400).json({ error: "name, phone, address and city are required" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Your cart is empty" });
  }

  // normalize + validate quantities
  const wanted = [];
  for (const it of items) {
    const qty = Math.floor(Number(it.qty));
    if (!it.productId || !Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ error: "Invalid cart item" });
    }
    wanted.push({ productId: it.productId, qty });
  }

  const decremented = [];
  const orderItems = [];
  try {
    for (const w of wanted) {
      const product = await Product.findOneAndUpdate(
        { _id: w.productId, storeId: req.storeId, status: "active", stock: { $gte: w.qty } },
        { $inc: { stock: -w.qty } },
        { new: true }
      );
      if (!product) {
        // distinguish "gone" from "not enough stock" for a clearer message
        const exists = await Product.findOne({
          _id: w.productId,
          storeId: req.storeId,
          status: "active",
        }).select("title stock");
        const err = new Error(
          exists
            ? `"${exists.title}" only has ${exists.stock} left in stock`
            : "An item in your cart is no longer available — please refresh the page"
        );
        err.status = 409;
        throw err;
      }
      decremented.push({ id: product._id, qty: w.qty });
      orderItems.push({
        productId: product._id,
        title: product.title, // snapshot
        price: product.price, // snapshot — server price, not client's
        qty: w.qty,
      });
    }

    const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    const order = await Order.create({
      storeId: req.storeId,
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
      },
      items: orderItems,
      total,
      paymentMethod: "COD",
      status: "pending",
    });

    res.status(201).json({
      order: { _id: order._id, total: order.total, status: order.status },
    });
  } catch (err) {
    // compensate any stock we already took
    await Promise.all(
      decremented.map((d) =>
        Product.updateOne({ _id: d.id }, { $inc: { stock: d.qty } })
      )
    );
    throw err;
  }
});

// ---- ADMIN order management (scoped by requireStoreOwner) ----

export const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ storeId: req.storeId }).sort("-createdAt");
  res.json({ orders });
});

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.join(", ")}` });
  }
  const order = await Order.findOneAndUpdate(
    { _id: req.params.orderId, storeId: req.storeId },
    { status },
    { new: true }
  );
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ order });
});
