import Link from "next/link";

const CATEGORIES = [
  { slug: "hamburguer", name: "Hambúrguer", icon: "🍔" },
  { slug: "combos", name: "Combos", icon: "🍟" },
  { slug: "batatas", name: "Batatas", icon: "🥔" },
  { slug: "bebidas", name: "Bebidas", icon: "🥤" },
  { slug: "sobremesas", name: "Sobremesas", icon: "🍰" },
];

export function CategoryStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/cardapio?categoria=${cat.slug}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-ink/5 bg-white p-4 text-center transition-all hover:-translate-y-1 hover:border-flame hover:shadow-lg"
          >
            <span className="text-3xl">{cat.icon}</span>
            <span className="text-xs font-bold uppercase tracking-wide text-ink">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
