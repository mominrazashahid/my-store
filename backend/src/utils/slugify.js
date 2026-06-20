// "My First Post!" -> "my-first-post"
export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Ensure a slug is unique within a store by appending -2, -3, ... if needed.
// `exists` is an async (slug) => boolean.
export async function uniqueSlug(base, exists) {
  let slug = base || "post";
  let n = 2;
  while (await exists(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}
