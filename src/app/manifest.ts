import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Hamburgueria Prime",
    short_name: "HP Delivery",
    description: "Pedidos, gestão da hamburgueria e entregas em um único aplicativo.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0e0d0c",
    theme_color: "#0e0d0c",
    categories: ["food", "business", "shopping"],
    lang: "pt-BR",
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/pwa-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Fazer pedido",
        short_name: "Pedir",
        description: "Abrir a hamburgueria",
        url: "/",
        icons: [{ src: "/pwa-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Painel da hamburgueria",
        short_name: "Painel",
        description: "Gerenciar pedidos e cardápio",
        url: "/admin",
        icons: [{ src: "/pwa-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Área do entregador",
        short_name: "Entregas",
        description: "Consultar entregas atribuídas",
        url: "/entregador",
        icons: [{ src: "/pwa-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
