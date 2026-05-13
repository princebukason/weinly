import { MetadataRoute } from "next";
import { FABRIC_CATEGORIES } from "@/lib/categories";

function labelToSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://weinly.com";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/fabrics`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/suppliers`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/ready-stock`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/auth`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryPages: MetadataRoute.Sitemap = FABRIC_CATEGORIES.map((cat) => ({
    url: `${base}/fabrics/${cat.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const subcategoryPages: MetadataRoute.Sitemap = FABRIC_CATEGORIES.flatMap((cat) =>
    cat.subcategories.map((sub) => ({
      url: `${base}/fabrics/${cat.id}/${labelToSlug(sub)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  );

  return [...staticPages, ...categoryPages, ...subcategoryPages];
}