// Default "home" page layout seeded when a new store is created.
// Content varies by store type so each store starts with something sensible.
// The frontend maps each section `type` to a React component per theme.

const COPY = {
  cosmetics: {
    heading: "Glow Naturally",
    subtext: "Premium cosmetics, delivered across Pakistan.",
    productsTitle: "Best Sellers",
  },
  clothing: {
    heading: "Wear Your Story",
    subtext: "Fresh styles for every season.",
    productsTitle: "New Arrivals",
  },
  electronics: {
    heading: "Tech That Works",
    subtext: "Gadgets and accessories at honest prices.",
    productsTitle: "Featured Products",
  },
};

export function buildDefaultHomePage(storeType, storeName) {
  const c = COPY[storeType] || COPY.cosmetics;
  return {
    slug: "home",
    title: "Home",
    isPublished: true,
    sections: [
      {
        type: "navbar",
        position: 0,
        content: { logo: storeName, links: [{ label: "Home", href: "/" }] },
      },
      {
        type: "hero",
        position: 1,
        content: {
          heading: c.heading,
          subtext: c.subtext,
          image: "",
          ctaText: "Shop Now",
          ctaLink: "#products",
        },
      },
      {
        type: "products",
        position: 2,
        content: { title: c.productsTitle, limit: 8 },
      },
      {
        type: "footer",
        position: 3,
        content: { text: `© ${new Date().getFullYear()} ${storeName}` },
      },
    ],
  };
}
