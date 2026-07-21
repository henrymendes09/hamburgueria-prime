import Link from "next/link";
import Image from "next/image";
import { Star, Flame, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="relative z-10 order-2 lg:order-1">
          <span className="stamp inline-block rounded-full bg-flame px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white mb-5">
            Feito na brasa, todos os dias
          </span>
          <h1 className="font-display text-5xl leading-[0.95] text-paper sm:text-6xl lg:text-7xl">
            Fome de algo
            <br />
            <span className="text-flame">de verdade?</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-paper/70 normal-case">
            Smash burgers montados na hora, pão brioche tostado na manteiga e
            batatas crocantes. Peça agora e receba quente, no seu endereço.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link href="/cardapio">Pedir Agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-paper/30 text-paper hover:bg-paper hover:text-ink">
              <Link href="/promocoes">Ver promoções</Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-paper/80">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-gold text-gold" />
              <div className="text-sm">
                <p className="font-bold leading-none">4.9/5</p>
                <p className="text-xs text-paper/50">+2.400 avaliações</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-flame" />
              <div className="text-sm">
                <p className="font-bold leading-none">~35 min</p>
                <p className="text-xs text-paper/50">tempo médio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-flame" />
              <div className="text-sm">
                <p className="font-bold leading-none">100% smash</p>
                <p className="text-xs text-paper/50">na chapa quente</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative order-1 lg:order-2">
          <div className="relative mx-auto aspect-square max-w-md">
            <div className="absolute inset-6 rounded-full bg-flame/20 blur-3xl" />
            <Image
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=80"
              alt="Hambúrguer artesanal Hamburgueria Prime com queijo derretido e bacon"
              fill
              priority
              className="relative object-contain drop-shadow-2xl"
              sizes="(max-width: 1024px) 90vw, 500px"
            />
          </div>
        </div>
      </div>

      <div className="torn-edge-bottom h-6 bg-paper" />
    </section>
  );
}
