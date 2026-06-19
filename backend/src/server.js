import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import storeRoutes from "./routes/stores.js";
import storefrontRoutes from "./routes/storefront.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true }));
app.use(express.json());

// Serve uploaded images. crossOrigin so the Next.js frontend can load them.
const UPLOAD_DIR = path.resolve("uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  },
  express.static(UPLOAD_DIR)
);

app.get("/health", (req, res) => res.json({ ok: true }));

// Owner/admin API (JWT-protected, ownership-checked)
app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);

// Public storefront API (tenant resolved from subdomain)
app.use("/api/storefront", storefrontRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[error]", err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 4000;

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("[db] failed to connect:", err.message);
    process.exit(1);
  });
