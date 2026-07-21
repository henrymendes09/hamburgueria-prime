import Image from "next/image";
import { Flame, Award, Users, Leaf } from "lucide-react";

export const metadata = {
  title: "Sobre nós",
  description: "Conheça a história da Hamburgueria Prime.",
};

const VALUES = [
  { icon: Flame, title: "Sempre na brasa", text: "Carne smash grelhada na chapa a mais de 200°C para selar o sabor." },
  { icon: Leaf, title: "Ingredientes frescos", text: "Compras diárias direto de fornecedores locais selecionados." },
  { icon: Award, title: "Receita premiada", text: "Reconhecida entre as melhores hamburguerias artesanais da região." },
  { icon: Users, title: "Time apaixonado", text: "Cada lanche é montado com cuidado por quem ama o que faz." },
];

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-flame">Nossa história</span>
        <h1 className="font-display text-4xl text-ink mt-2 sm:text-5xl">Sobre a Hamburgueria Prime</h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:items-center mb-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&q=80"
            alt="Hambúrguer artesanal sendo montado na cozinha da Hamburgueria Prime"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 500px"
          />
        </div>
        <div className="space-y-4 text-ash normal-case leading-relaxed">
          <p>
            A Hamburgueria Prime nasceu de uma obsessão simples: fazer o melhor smash
            burger da cidade. Começamos em uma cozinha pequena, testando pontos de
            carne, temperos e tipos de pão até chegar na combinação perfeita.
          </p>
          <p>
            Hoje, cada hambúrguer que sai da nossa chapa carrega o mesmo cuidado do
            primeiro dia: carne grelhada na hora, queijo derretido no ponto certo e
            pão brioche tostado na manteiga.
          </p>
          <p>
            Mais do que uma lanchonete, somos um lugar feito para quem leva comida a
            sério — e não abre mão de qualidade nem na correria do delivery.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map((value) => (
          <div key={value.title} className="rounded-2xl border-2 border-ink/5 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-flame/10 text-flame">
              <value.icon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base text-ink normal-case">{value.title}</h3>
            <p className="text-sm text-ash mt-2 normal-case">{value.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
