// The default theme config seeded for every new store. Values mirror the
// original hardcoded "glow" look so existing stores are unchanged visually.
//
// Shape:
//   tokens   = global, shared across all breakpoints (colors, fonts, radius)
//   sections = per-element. `shared` props apply on every device; `responsive`
//              props ({ desktop, tablet, mobile }) are the "key properties"
//              (sizes, spacing, columns, visibility) overridable per breakpoint.

export function buildDefaultTheme() {
  return {
    tokens: {
      colors: {
        primary: "#e84f8c",
        accent: "#c43a72",
        bg: "#fff7fb",
        surface: "#ffffff",
        text: "#211a1d",
        muted: "#8a7a82",
        border: "#f1dbe6",
      },
      fonts: {
        heading: "Poppins",
        body: "Segoe UI",
      },
      radius: 18,
    },
    sections: {
      navbar: {
        shared: { bg: "#ffffff", linkColor: "#211a1d" },
        responsive: {
          desktop: { padY: 16, padX: 32, visible: true },
          tablet: { padY: 14, padX: 22 },
          mobile: { padY: 12, padX: 16 },
        },
      },
      hero: {
        shared: { textColor: "#ffffff", overlay: 0.45 },
        responsive: {
          desktop: { headingSize: 52, minHeight: 460, padY: 80, visible: true },
          tablet: { headingSize: 40, minHeight: 400, padY: 64 },
          mobile: { headingSize: 30, minHeight: 340, padY: 48 },
        },
      },
      productCard: {
        shared: { bg: "#ffffff", borderColor: "#f1dbe6", radius: 18 },
        responsive: {
          desktop: { columns: 4, gap: 26, visible: true },
          tablet: { columns: 3, gap: 20 },
          mobile: { columns: 2, gap: 14 },
        },
      },
      footer: {
        shared: { bg: "#2a1a22", textColor: "#f3e3eb" },
        responsive: {
          desktop: { padY: 44, visible: true },
          tablet: { padY: 36 },
          mobile: { padY: 28 },
        },
      },
    },
  };
}
