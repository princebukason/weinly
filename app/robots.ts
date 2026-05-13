import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/supplier/dashboard"],
      },
    ],
    sitemap: "https://weinly.com/sitemap.xml",
  };
}