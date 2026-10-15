import { Metadata } from 'next';
import { getProfile, getProducts, getPaymentConfig } from '@/features/tiemnho/api/service';
import { StorefrontView } from '@/features/tiemnho/components/storefront/storefront-view';
import { notFound } from 'next/navigation';

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
      title: `${profile.displayName} - Bio Storefront`,
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

  // For MVP/Demo: Support @giangdinh or any demo username
  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background flex justify-center py-4 px-2 sm:px-4'>
      <StorefrontView profile={profile} products={products} paymentConfig={paymentConfig} />
    </main>
  );
}
