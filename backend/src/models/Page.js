import mongoose from "mongoose";

// A section is a renderable block on a page. `content` is intentionally
// schemaless (Mixed) because each section type has a different shape —
// this is exactly what MongoDB is good at.
const sectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      // extend this list as you add section components in the frontend
      enum: ["navbar", "hero", "products", "richText", "footer", "banner"],
    },
    position: { type: Number, required: true },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true }
);

const pageSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    slug: { type: String, required: true, trim: true }, // e.g. "home", "about"
    title: { type: String, required: true, trim: true },
    isPublished: { type: Boolean, default: true },
    sections: { type: [sectionSchema], default: [] },
  },
  { timestamps: true }
);

pageSchema.index({ storeId: 1, slug: 1 }, { unique: true });

export const Page = mongoose.model("Page", pageSchema);
