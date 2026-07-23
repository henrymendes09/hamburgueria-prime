import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/cardapio`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/promocoes`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/sobre`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contato`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
