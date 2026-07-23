import Image from "next/image";
import { getPublicRestaurant } from "@/lib/tenant";

export const metadata = { title: "Sobre nós" };

export default async function SobrePage() {
  const restaurant = await getPublicRestaurant();
  return <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
    <div className="mb-12 text-center"><span className="text-xs font-bold uppercase tracking-widest" style={{ color: restaurant.primaryColor }}>Nossa história</span><h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Sobre a {restaurant.name}</h1></div>
    <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Image src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&q=80" alt={`Hambúrguer da ${restaurant.name}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 500px" /></div>
      <div className="space-y-4 text-lg normal-case leading-relaxed text-ash"><p>{restaurant.description || `${restaurant.name}: uma hamburgueria preparada para atender você com qualidade, agilidade e muito sabor.`}</p>{restaurant.address && <p><strong>Onde estamos:</strong> {restaurant.address}</p>}{restaurant.businessHours && <p><strong>Horário:</strong> {restaurant.businessHours}</p>}</div>
    </div>
  </div>;
}
