import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

categorySchema.index({ storeId: 1, name: 1 }, { unique: true });

export const Category = mongoose.model("Category", categorySchema);
