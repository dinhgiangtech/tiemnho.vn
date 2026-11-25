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

  const title = `${product.title} - ${profile.displayName} | Tiệm Nhỏ`;
  const description =
    product.subtitle ||
    product.description?.slice(0, 160) ||
    `Sản phẩm ${product.title} của ${profile.displayName} trên Tiệm Nhỏ.`;
  const canonicalUrl = `/@${profile.username}/products/${product.id}`;
  const cover = product.coverImage || profile.avatarUrl || '/logo-store.png';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Tiệm Nhỏ',
      type: 'article',
      locale: 'vi_VN',
      images: [
        {
          url: cover,
          width: 800,
          height: 450,
          alt: product.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [cover]
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

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.subtitle || product.description?.slice(0, 200),
    image: product.coverImage ? [product.coverImage] : undefined,
    brand: {
      '@type': 'Brand',
      name: profile.displayName
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'VND',
      availability:
        product.type === 'PHYSICAL' && product.stock !== undefined && product.stock <= 0
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      url: `https://tiemnho.shop/@${profile.username}/products/${product.id}`
    }
  };

  return (
    <main className='min-h-screen bg-[#F6F6F8] w-full'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailView product={product} profile={profile} paymentConfig={paymentConfig} />
    </main>
  );
}
