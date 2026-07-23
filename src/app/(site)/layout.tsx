import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CartDrawer } from "@/components/site/cart-drawer";
import { AnalyticsTracker } from "@/components/site/analytics-tracker";
import { getPublicRestaurant } from "@/lib/tenant";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const restaurant = await getPublicRestaurant();

  return (
    <div className="flex min-h-screen flex-col">
      <AnalyticsTracker />
      <Header restaurantName={restaurant.name} />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
