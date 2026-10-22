// Uploads one image for a store and returns its public URL.
// Uses fetch (not an Inertia visit) because the result is data, not a page.
// Laravel's CSRF check reads the XSRF-TOKEN cookie echoed back as a header.

function xsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function uploadImage(storeId: number, file: File): Promise<string> {
  const body = new FormData();
  body.append("image", file);

  const res = await fetch(`/admin/stores/${storeId}/uploads`, {
    method: "POST",
    body,
    headers: { Accept: "application/json", "X-XSRF-TOKEN": xsrfToken() },
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const firstError = data.errors ? Object.values(data.errors as Record<string, string[]>)[0]?.[0] : null;
    throw new Error(firstError || data.message || `Upload failed (${res.status})`);
  }
  return data.url as string;
}
