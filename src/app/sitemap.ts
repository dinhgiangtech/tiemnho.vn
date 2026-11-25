import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export const revalidate = 3600; // Cập nhật sitemap mỗi 1 tiếng

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tiemnho.shop';

  // 1. Các trang tĩnh cố định
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3
    }
  ];

  try {
    // 2. Trang gian hàng của Creator (/@username)
    const creators = await prisma.user.findMany({
      where: {
        username: { not: null }
      },
      select: {
        username: true,
        updatedAt: true
      },
      take: 500
    });

    const creatorPages: MetadataRoute.Sitemap = creators
      .filter((c) => c.username && c.username.trim() !== '')
      .map((c) => ({
        url: `${baseUrl}/@${c.username}`,
        lastModified: c.updatedAt || new Date(),
        changeFrequency: 'daily',
        priority: 0.8
      }));

    // 3. Chi tiết các sản phẩm đang mở bán công khai
    const products = await prisma.product.findMany({
      where: {
        isPublished: true
      },
      select: {
        id: true,
        updatedAt: true,
        user: {
          select: { username: true }
        }
      },
      take: 1000
    });

    const productPages: MetadataRoute.Sitemap = products
      .filter((p) => p.user?.username)
      .map((p) => ({
        url: `${baseUrl}/@${p.user!.username}/products/${p.id}`,
        lastModified: p.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.7
      }));

    return [...staticPages, ...creatorPages, ...productPages];
  } catch (error) {
    console.warn('[Sitemap Generation Warning]:', error);
    return staticPages;
  }
}
