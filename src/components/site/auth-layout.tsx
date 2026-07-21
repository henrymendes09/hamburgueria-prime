import Image from "next/image";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl gap-0 lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=900&q=80"
          alt="Hambúrguer artesanal Hamburgueria Prime"
          fill
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-ink/50 flex items-end p-10">
          <p className="font-display text-3xl text-paper leading-tight">
            Sua próxima refeição favorita está a um clique.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl text-ink">{title}</h1>
          <p className="text-sm text-ash normal-case mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
