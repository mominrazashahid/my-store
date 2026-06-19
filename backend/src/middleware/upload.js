import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const UPLOAD_ROOT = path.resolve("uploads");

// Files are stored under uploads/<storeId>/ so they stay tenant-scoped on disk.
// requireStoreOwner runs before this and sets req.storeId.
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(UPLOAD_ROOT, String(req.storeId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP or GIF images are allowed"));
    }
    cb(null, true);
  },
}).single("image");

// Builds the absolute URL the frontend will use as an <img src>.
export function fileUrl(req, storeId, filename) {
  return `${req.protocol}://${req.get("host")}/uploads/${storeId}/${filename}`;
}
