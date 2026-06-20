import mongoose from "mongoose";

// One document per store holding both the editable draft and the live
// published theme. Publish copies draft -> published. Theme data is schemaless
// (Mixed) because its shape evolves with the editor's section schemas.
const themeConfigSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      unique: true,
    },
    draft: { type: mongoose.Schema.Types.Mixed, required: true },
    published: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true, minimize: false }
);

export const ThemeConfig = mongoose.model("ThemeConfig", themeConfigSchema);
