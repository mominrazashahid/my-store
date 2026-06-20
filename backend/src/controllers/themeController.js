import { ThemeConfig } from "../models/ThemeConfig.js";
import { buildDefaultTheme } from "../utils/defaultTheme.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Lazily ensure a config exists (covers stores created before themes existed).
async function ensureConfig(storeId) {
  let cfg = await ThemeConfig.findOne({ storeId });
  if (!cfg) {
    const theme = buildDefaultTheme();
    cfg = await ThemeConfig.create({ storeId, draft: theme, published: theme });
  }
  return cfg;
}

// Admin: the editable draft.
export const getDraftTheme = asyncHandler(async (req, res) => {
  const cfg = await ensureConfig(req.storeId);
  res.json({ theme: cfg.draft });
});

// Admin: overwrite the draft (full theme object).
export const updateDraftTheme = asyncHandler(async (req, res) => {
  const { theme } = req.body;
  if (!theme || typeof theme !== "object") {
    return res.status(400).json({ error: "theme object is required" });
  }
  const cfg = await ensureConfig(req.storeId);
  cfg.draft = theme;
  cfg.markModified("draft");
  await cfg.save();
  res.json({ theme: cfg.draft });
});

// Admin: reset the draft back to the default theme (publish still required to go live).
export const resetTheme = asyncHandler(async (req, res) => {
  const cfg = await ensureConfig(req.storeId);
  cfg.draft = buildDefaultTheme();
  cfg.markModified("draft");
  await cfg.save();
  res.json({ theme: cfg.draft });
});

// Admin: publish — copy draft -> published.
export const publishTheme = asyncHandler(async (req, res) => {
  const cfg = await ensureConfig(req.storeId);
  cfg.published = cfg.draft;
  cfg.markModified("published");
  await cfg.save();
  res.json({ theme: cfg.published });
});
