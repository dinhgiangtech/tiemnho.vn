import { Metadata } from 'next';
import { getProfile, getProducts, getPaymentConfig } from '@/features/tiemnho/api/service';
import { TikTokStorefrontView } from '@/features/tiemnho/components/storefront/tiktok-storefront-view';

interface StorefrontPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username).replace(/^@/, '');
  const profile = await getProfile();

  if (profile.username !== cleanUsername && cleanUsername !== 'giangdinh') {
    return { title: 'Không tìm thấy gian hàng | Tiệm Nhỏ' };
  }

  return {
    title: `${profile.displayName} (@${profile.username}) | Tiệm Nhỏ`,
    description: profile.bio,
    openGraph: {
      title: `${profile.displayName} (@${profile.username}) - Bio Storefront`,
      description: profile.bio,
      images: [{ url: profile.avatarUrl }]
    }
  };
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const cleanUsername = decoded.replace(/^@/, '');

  const [profile, products, paymentConfig] = await Promise.all([
    getProfile(),
    getProducts({ publishedOnly: true }),
    getPaymentConfig()
  ]);

  return (
    <main className='min-h-screen bg-[#F8F8F8] sm:bg-[#F1F1F2] flex justify-center py-0 sm:py-6'>
      <TikTokStorefrontView profile={profile} products={products} paymentConfig={paymentConfig} />
    </main>
  );
}
