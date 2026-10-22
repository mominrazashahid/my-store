import type { ReactNode } from "react";
import { getTheme } from "@/themes";
import { PlatformFooter } from "@/components/platform/PlatformFooter";
import { PlatformHeader } from "@/components/platform/PlatformHeader";
import { ThemedStore } from "./ThemedStore";
import type { StoreInfo, StorePage } from "@/types/storefront";

// Every store page sits inside StoreBuilder's own header and footer. Between
// them come the page content and the store's contact details, styled by the
// store's theme.
export function StoreChrome({
  store,
  page,
  children,
}: {
  store: StoreInfo;
  page: StorePage;
  children: ReactNode;
}) {
  const theme = getTheme(store.themeId);
  const footer = page.sections.find((s) => s.type === "footer");
  const StoreInfoSection = theme.sections.footer;

  return (
    <>
      <PlatformHeader />
      <ThemedStore store={store}>
        {children}
        {StoreInfoSection ? <StoreInfoSection content={footer?.content ?? {}} products={[]} store={store} /> : null}
      </ThemedStore>
      <PlatformFooter />
    </>
  );
}
