import { Star } from "lucide-react";

type Testimonial = {
  id: string;
  comment: string;
  rating: number;
  user: { name: string; image: string | null };
};

export function Testimonials({ reviews }: { reviews: Testimonial[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="bg-ink py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-flame">Depoimentos</span>
          <h2 className="font-display text-3xl text-paper mt-2 sm:text-4xl">O que dizem sobre a gente</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < review.rating ? "fill-gold text-gold" : "text-white/20"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-paper/80 normal-case leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-flame text-xs font-bold text-white">
                  {review.user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-paper">{review.user.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
