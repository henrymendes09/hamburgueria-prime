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
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const restaurant = await getPublicRestaurant();

  return (
    <div className="flex min-h-screen flex-col">
      <AnalyticsTracker />
      <Header restaurantName={restaurant.name} restaurantSlug={restaurant.slug} logoUrl={restaurant.logoUrl} primaryColor={restaurant.primaryColor} />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer restaurant={restaurant} />
    </div>
  );
}
