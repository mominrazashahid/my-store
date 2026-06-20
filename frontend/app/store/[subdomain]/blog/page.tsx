import Link from "next/link";
import { getStore, getPosts } from "@/lib/api";
import { notFound } from "next/navigation";
import { StoreChrome } from "@/components/storefront/StoreChrome";
import styles from "./blog.module.css";

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";
}

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const [store, posts] = await Promise.all([getStore(subdomain), getPosts(subdomain)]);
  if (!store) notFound();

  return (
    <StoreChrome subdomain={subdomain}>
      <div className={styles.wrap}>
        <div className={styles.crumb}>
          <Link href={`/store/${subdomain}`}>← {store.name}</Link>
        </div>
        <h1 className={styles.pageTitle}>Blog</h1>

        {posts.length === 0 ? (
          <p className={styles.empty}>No posts yet. Check back soon!</p>
        ) : (
          <div className={styles.grid}>
            {posts.map((p) => (
              <Link
                key={p._id}
                href={`/store/${subdomain}/blog/${p.slug}`}
                className={styles.card}
              >
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.cover} src={p.coverImage} alt={p.title} />
                ) : (
                  <div className={styles.coverEmpty} />
                )}
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{p.title}</h2>
                  {p.excerpt ? <p className={styles.excerpt}>{p.excerpt}</p> : null}
                  <span className={styles.date}>{fmtDate(p.publishedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StoreChrome>
  );
}
