import { Metadata } from 'next';
import {
  getProfile,
  getProfileByUsername,
  getProducts,
  getPaymentConfig
} from '@/features/tiemnho/api/service';
import { ResponsiveStorefrontView } from '@/features/tiemnho/components/storefront/responsive-storefront-view';

interface StorefrontPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username).replace(/^@/, '');
  const profile = (await getProfileByUsername(cleanUsername)) || (await getProfile());

  if (profile.username !== cleanUsername && cleanUsername !== 'giangdinh') {
    return { title: 'Không tìm thấy gian hàng | Tiệm Nhỏ' };
  }

  const title = `${profile.displayName} (@${profile.username}) - Gian hàng chính thức | Tiệm Nhỏ`;
  const description =
    profile.bio ||
    `Ghé thăm gian hàng của ${profile.displayName} trên Tiệm Nhỏ để xem và tải các tài nguyên số độc quyền, đặt hàng và liên kết hữu ích.`;
  const canonicalUrl = `/@${profile.username}`;
  const avatar = profile.avatarUrl || '/default-avatar.svg';

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
      type: 'profile',
      locale: 'vi_VN',
      images: [
        {
          url: avatar,
          width: 400,
          height: 400,
          alt: profile.displayName
        }
      ]
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [avatar]
    }
  };
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const cleanUsername = decoded.replace(/^@/, '');

  const [profile, products, paymentConfig] = await Promise.all([
    (async () => (await getProfileByUsername(cleanUsername)) || (await getProfile()))(),
    getProducts({ publishedOnly: true }),
    getPaymentConfig(cleanUsername)
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile.displayName,
      alternateName: `@${profile.username}`,
      description: profile.bio,
      image: profile.avatarUrl || undefined,
      url: `https://tiemnho.shop/@${profile.username}`
    },
    hasPart: {
      '@type': 'ItemList',
      itemListElement: products.map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: p.title,
        description: p.subtitle || p.description?.slice(0, 100),
        url: `https://tiemnho.shop/@${profile.username}/products/${p.id}`
      }))
    }
  };

  return (
    <main className='min-h-screen bg-[#F6F6F8] text-[#161823] w-full'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ResponsiveStorefrontView
        profile={profile}
        products={products}
        paymentConfig={paymentConfig}
      />
    </main>
  );
}
