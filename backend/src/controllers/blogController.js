import { BlogPost } from "../models/BlogPost.js";
import { slugify, uniqueSlug } from "../utils/slugify.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ---- Admin (scoped by requireStoreOwner) ----

export const listPosts = asyncHandler(async (req, res) => {
  const posts = await BlogPost.find({ storeId: req.storeId }).sort("-createdAt");
  res.json({ posts });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({ _id: req.params.postId, storeId: req.storeId });
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json({ post });
});

export const createPost = asyncHandler(async (req, res) => {
  const { title, excerpt, coverImage, contentMarkdown, status } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  const base = slugify(req.body.slug || title);
  const slug = await uniqueSlug(base, async (s) =>
    Boolean(await BlogPost.exists({ storeId: req.storeId, slug: s }))
  );

  const post = await BlogPost.create({
    storeId: req.storeId,
    title,
    slug,
    excerpt: excerpt || "",
    coverImage: coverImage || "",
    contentMarkdown: contentMarkdown || "",
    status: status === "published" ? "published" : "draft",
    publishedAt: status === "published" ? new Date() : undefined,
  });
  res.status(201).json({ post });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({ _id: req.params.postId, storeId: req.storeId });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const { title, excerpt, coverImage, contentMarkdown, status } = req.body;
  if (title !== undefined) post.title = title;
  if (excerpt !== undefined) post.excerpt = excerpt;
  if (coverImage !== undefined) post.coverImage = coverImage;
  if (contentMarkdown !== undefined) post.contentMarkdown = contentMarkdown;

  // allow editing the slug, keeping it unique (excluding this post)
  if (req.body.slug !== undefined) {
    const base = slugify(req.body.slug);
    post.slug = await uniqueSlug(base, async (s) =>
      Boolean(
        await BlogPost.exists({ storeId: req.storeId, slug: s, _id: { $ne: post._id } })
      )
    );
  }

  if (status !== undefined) {
    post.status = status === "published" ? "published" : "draft";
    if (post.status === "published" && !post.publishedAt) post.publishedAt = new Date();
  }

  await post.save();
  res.json({ post });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOneAndDelete({
    _id: req.params.postId,
    storeId: req.storeId,
  });
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json({ ok: true });
});

// ---- Public storefront (scoped by resolveTenant) ----

export const listPublishedPosts = asyncHandler(async (req, res) => {
  const posts = await BlogPost.find({ storeId: req.storeId, status: "published" })
    .select("title slug coverImage excerpt publishedAt")
    .sort("-publishedAt");
  res.json({ posts });
});

export const getPublishedPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({
    storeId: req.storeId,
    slug: req.params.slug,
    status: "published",
  });
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json({ post });
});
