import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CartDrawer } from "@/components/site/cart-drawer";
import { AnalyticsTracker } from "@/components/site/analytics-tracker";
import { getPublicRestaurant } from "@/lib/tenant";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const restaurant = await getPublicRestaurant();
  const description = restaurant.description || `Peça online na ${restaurant.name}.`;
  return {
    title: { default: restaurant.name, template: `%s | ${restaurant.name}` },
    description,
    openGraph: { title: restaurant.name, description, siteName: restaurant.name, type: "website" },
    manifest: `/api/pwa/manifest?loja=${encodeURIComponent(restaurant.slug)}`,
    icons: {
      icon: `/api/pwa/icon?loja=${encodeURIComponent(restaurant.slug)}`,
      apple: `/api/pwa/icon?loja=${encodeURIComponent(restaurant.slug)}`,
    },
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: restaurant.name.slice(0, 18) },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const restaurant = await getPublicRestaurant();
  const primaryColor = /^#[0-9a-fA-F]{6}$/.test(restaurant.primaryColor)
    ? restaurant.primaryColor
    : "#e01b22";

  return (
    <div className="flex min-h-screen flex-col">
      <style>{`:root{--color-flame:${primaryColor};--color-flame-dark:color-mix(in srgb,${primaryColor} 72%,black);--color-flame-light:color-mix(in srgb,${primaryColor} 72%,white)}`}</style>
      <AnalyticsTracker />
      <Header restaurantName={restaurant.name} restaurantSlug={restaurant.slug} logoUrl={restaurant.logoUrl} primaryColor={primaryColor} />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer restaurant={restaurant} />
    </div>
  );
}
