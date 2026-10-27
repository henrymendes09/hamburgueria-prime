import Image from "next/image";
import { getPublicRestaurant } from "@/lib/tenant";
import { resolveSiteContent } from "@/lib/site-content";

export const metadata = { title: "Sobre nós" };

export default async function SobrePage() {
  const restaurant = await getPublicRestaurant();
  const content = resolveSiteContent(restaurant);
  return <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
    <div className="mb-12 text-center"><span className="text-xs font-bold uppercase tracking-widest" style={{ color: restaurant.primaryColor }}>{content.eyebrow}</span><h1 className="mt-2 break-words font-display text-4xl text-ink sm:text-5xl">{content.title}</h1></div>
    <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
      {content.image && <div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Image src={content.image} alt={content.imageAlt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 500px" /></div>}
      <div className={`min-w-0 space-y-4 break-words text-lg normal-case leading-relaxed text-ash ${!content.image ? "lg:col-span-2" : ""}`}><p className="whitespace-pre-wrap">{content.body}</p>{content.address && <p><strong>{content.addressLabel}:</strong> {content.address}</p>}{content.hours && <p><strong>{content.hoursLabel}:</strong> {content.hours}</p>}</div>
    </div>
  </div>;
}
