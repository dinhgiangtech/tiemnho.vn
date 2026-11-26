import { getProfile, getProducts, getPaymentConfig } from '@/features/tiemnho/api/service';
import { getSession } from '@/lib/auth';
import { ProLanding } from '@/features/landing/components/pro-landing';

export const metadata = {
  title: 'Tiệm Nhỏ - Nền tảng Bán Hàng & Nhận Tiền Cho Creator Việt Nam',
  description:
    'Biến Link-in-Bio thành cỗ máy bán tài nguyên số & nhận tiền tự động 24/7 bằng VietQR. 0% hoa hồng, tiền về thẳng 100% tài khoản ngân hàng của bạn.',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Tiệm Nhỏ - Nền tảng Bán Hàng & Nhận Tiền Cho Creator Việt Nam',
    description:
      'Biến Link-in-Bio thành cỗ máy bán tài nguyên số & nhận tiền tự động 24/7 bằng VietQR. 0% hoa hồng.',
    url: 'https://tiemnho.shop',
    siteName: 'Tiệm Nhỏ',
    images: [{ url: '/logo-store.png', width: 512, height: 512, alt: 'Tiệm Nhỏ' }],
    type: 'website'
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://tiemnho.shop/#website',
      url: 'https://tiemnho.shop',
      name: 'Tiệm Nhỏ',
      description: 'Nền tảng Bán Hàng & Link-in-Bio Cho Creator Việt Nam',
      inLanguage: 'vi-VN'
    },
    {
      '@type': 'Organization',
      '@id': 'https://tiemnho.shop/#organization',
      name: 'Tiệm Nhỏ',
      url: 'https://tiemnho.shop',
      logo: 'https://tiemnho.shop/logo-store.png'
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://tiemnho.shop/#software',
      name: 'Tiệm Nhỏ',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'VND'
      },
      description:
        'Biến Link-in-Bio thành cỗ máy bán tài nguyên số & nhận tiền tự động 24/7 bằng VietQR. 0% hoa hồng.'
    }
  ]
};

export default async function LandingPage() {
  const session = await getSession();
  const userId = session?.userId;
  const [profile, products, paymentConfig] = await Promise.all([
    getProfile(),
    getProducts(),
    getPaymentConfig()
  ]);
  const storeHandle = profile?.username || 'dinhgiang';

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProLanding
        userId={userId}
        storeHandle={storeHandle}
        profile={profile}
        products={products}
        paymentConfig={paymentConfig}
      />
    </>
  );
}
