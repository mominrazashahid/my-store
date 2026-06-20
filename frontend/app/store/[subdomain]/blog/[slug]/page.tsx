import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/api";
import { StoreChrome } from "@/components/storefront/StoreChrome";
import { Markdown } from "@/components/blog/Markdown";
import styles from "../blog.module.css";

function fmtDate(d?: string) {
  return d
    ? new Date(d).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  const post = await getPost(subdomain, slug);
  if (!post) notFound();

  return (
    <StoreChrome subdomain={subdomain}>
      <article className={styles.wrap}>
        <div className={styles.crumb}>
          <Link href={`/store/${subdomain}/blog`}>← Blog</Link>
        </div>
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.postCover} src={post.coverImage} alt={post.title} />
        ) : null}
        <h1 className={styles.postTitle}>{post.title}</h1>
        <div className={styles.postDate}>{fmtDate(post.publishedAt)}</div>
        <Markdown className={styles.body}>{post.contentMarkdown}</Markdown>
      </article>
    </StoreChrome>
  );
}
