import type { ComponentType } from "react";
import type { Product, StoreInfo } from "@/lib/api";

// Every section component receives its own `content` blob plus shared
// store context (products, store info). Each theme implements one
// component per supported section type.
export type SectionContext = {
  content: Record<string, unknown>;
  products: Product[];
  store: StoreInfo;
};

export type SectionComponent = ComponentType<SectionContext>;

export type Theme = {
  id: string;
  name: string;
  storeType: string;
  // class applied to the outer wrapper (holds the theme's CSS variables)
  wrapperClassName: string;
  sections: Record<string, SectionComponent>;
};
