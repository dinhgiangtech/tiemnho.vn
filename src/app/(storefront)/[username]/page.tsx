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

  return {
    title: `${profile.displayName} (@${profile.username}) | Tiệm Nhỏ`,
    description: profile.bio,
    openGraph: {
      title: `${profile.displayName} (@${profile.username}) - Bio Storefront`,
      description: profile.bio,
      images: [{ url: profile.avatarUrl || '/default-avatar.svg' }]
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

  return (
    <main className='min-h-screen bg-[#F6F6F8] text-[#161823] w-full'>
      <ResponsiveStorefrontView
        profile={profile}
        products={products}
        paymentConfig={paymentConfig}
      />
    </main>
  );
}
