import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getProfile,
  getProfileByUsername,
  getProductById,
  getProducts,
  getPaymentConfig
} from '@/features/tiemnho/api/service';
import { ProductDetailView } from '@/features/tiemnho/components/storefront/product-detail-view';

interface ProductPageProps {
  params: Promise<{
    username: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const cleanUsername = decodeURIComponent(username).replace(/^@/, '');
  const profile = (await getProfileByUsername(cleanUsername)) || (await getProfile());

  // Find product by id or slug
  let product = await getProductById(slug);
  if (!product) {
    const allProducts = await getProducts();
    product =
      allProducts.find(
        (p) => p.id === slug || p.title.toLowerCase().replace(/\s+/g, '-') === slug
      ) || null;
  }

  if (!product) {
    return { title: 'Sản phẩm không tồn tại | Tiệm Nhỏ' };
  }

  return {
    title: `${product.title} - ${profile.displayName} | Tiệm Nhỏ`,
    description: product.subtitle || product.description?.slice(0, 160) || profile.bio,
    openGraph: {
      title: `${product.title} - @${profile.username}`,
      description: product.subtitle || product.description?.slice(0, 160),
      images: [{ url: product.coverImage || profile.avatarUrl || '/default-avatar.svg' }]
    }
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { username, slug } = await params;
  const decodedUsername = decodeURIComponent(username).replace(/^@/, '');

  const [profile, paymentConfig, allProducts] = await Promise.all([
    (async () => (await getProfileByUsername(decodedUsername)) || (await getProfile()))(),
    getPaymentConfig(decodedUsername),
    getProducts()
  ]);

  // Find product
  let product = await getProductById(slug);
  if (!product) {
    product =
      allProducts.find(
        (p) => p.id === slug || p.title.toLowerCase().replace(/\s+/g, '-') === slug
      ) || null;
  }

  if (!product) {
    notFound();
  }

  return (
    <main className='min-h-screen bg-[#F6F6F8] w-full'>
      <ProductDetailView product={product} profile={profile} paymentConfig={paymentConfig} />
    </main>
  );
}
