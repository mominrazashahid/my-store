import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    images: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "active"],
      default: "active",
    },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  },
  { timestamps: true }
);

// Tenant-scoped index: every list/lookup is filtered by storeId first.
productSchema.index({ storeId: 1, createdAt: -1 });

export const Product = mongoose.model("Product", productSchema);
