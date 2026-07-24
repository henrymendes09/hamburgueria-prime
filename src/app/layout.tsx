import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hamburgueria Prime — Delivery de hambúrguer artesanal",
    template: "%s | Hamburgueria Prime",
  },
  description:
    "Hambúrgueres artesanais, combos, batatas e sobremesas com entrega rápida. Peça agora na Hamburgueria Prime.",
  keywords: [
    "hamburgueria",
    "delivery de hambúrguer",
    "lanchonete",
    "combo hambúrguer",
    "hambúrguer artesanal",
  ],
  authors: [{ name: "Hamburgueria Prime" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Hamburgueria Prime",
    title: "Hamburgueria Prime — Delivery de hambúrguer artesanal",
    description:
      "Hambúrgueres artesanais, combos, batatas e sobremesas com entrega rápida.",
    url: siteUrl,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Hamburgueria Prime" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hamburgueria Prime — Delivery de hambúrguer artesanal",
    description: "Hambúrgueres artesanais com entrega rápida.",
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HP Delivery",
  },
  icons: {
    icon: "/pwa-icon.svg",
    apple: "/pwa-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e0d0c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
