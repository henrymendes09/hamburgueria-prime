import Image from "next/image";

export function CategoryIcon({ slug, icon, large = false }: { slug: string; icon: string; large?: boolean }) {
  const image = slug === "combos" ? "/images/combo-category.svg" : slug === "batatas" || slug === "porcoes" ? "/images/portions-category.svg" : null;
  if (image) {
    return <Image src={image} alt="" aria-hidden="true" width={120} height={80} className={large ? "h-10 w-16 object-contain" : "inline-block h-5 w-8 shrink-0 object-contain align-middle"} />;
  }
  return <span aria-hidden="true" className={large ? "flex h-10 items-center text-3xl" : undefined}>{icon}</span>;
}
