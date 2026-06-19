import mongoose from "mongoose";

export const STORE_TYPES = ["cosmetics", "clothing", "electronics"];

const storeSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    // subdomain is the tenant key in the URL: <subdomain>.platform.pk
    subdomain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "subdomain may only contain a-z, 0-9 and -"],
    },
    storeType: { type: String, enum: STORE_TYPES, required: true },
    // themeId references a theme defined in frontend code, not the DB
    themeId: { type: String, required: true },
    plan: { type: String, enum: ["free", "paid"], default: "free" },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    contactPhone: { type: String, trim: true },
    contactEmail: { type: String, lowercase: true, trim: true },
    address: {
      line: { type: String, trim: true },
      city: { type: String, trim: true },
      mapUrl: { type: String, trim: true },
    },
    settings: {
      currency: { type: String, default: "PKR" },
      whatsapp: { type: String, trim: true },
      socialLinks: {
        facebook: String,
        instagram: String,
        tiktok: String,
      },
    },
  },
  { timestamps: true }
);

export const Store = mongoose.model("Store", storeSchema);
