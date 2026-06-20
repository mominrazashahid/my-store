import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    coverImage: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    contentMarkdown: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Unique slug per store; fast lookups for the public blog.
blogPostSchema.index({ storeId: 1, slug: 1 }, { unique: true });
blogPostSchema.index({ storeId: 1, status: 1, publishedAt: -1 });

export const BlogPost = mongoose.model("BlogPost", blogPostSchema);
