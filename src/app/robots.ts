import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/perfil", "/checkout", "/entregador", "/api"] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
