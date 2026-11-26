import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import { fontVariables } from '@/components/themes/font.config';
import { DEFAULT_THEME, THEMES } from '@/components/themes/theme.config';
import ThemeProvider from '@/components/themes/theme-provider';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import NextTopLoader from 'nextjs-toploader';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Newsreader, Plus_Jakarta_Sans } from 'next/font/google';
import '../styles/globals.css';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap'
});

const fontNewsreader = Newsreader({
  subsets: ['vietnamese', 'latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  variable: '--font-newsreader',
  display: 'swap'
});

const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b'
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tiemnho.shop'),
  title: {
    default: 'Tiệm Nhỏ - Nền tảng Bán Hàng & Link-in-Bio Cho Creator Việt Nam',
    template: '%s | Tiệm Nhỏ'
  },
  description:
    'Biến Link-in-Bio thành cỗ máy bán tài nguyên số & nhận tiền tự động 24/7 bằng VietQR. 0% hoa hồng, tiền về thẳng 100% tài khoản ngân hàng của bạn.',
  keywords: [
    'tiệm nhỏ',
    'tiemnho',
    'tiemnho.shop',
    'tiemnho.vn',
    'link in bio',
    'bán tài liệu số',
    'creator economy việt nam',
    'vietqr tự động',
    'bán ebook',
    'stan store việt nam',
    'bán khóa học',
    'nhận tiền qua vietqr'
  ],
  authors: [{ name: 'Tiệm Nhỏ Team', url: 'https://tiemnho.shop' }],
  creator: 'Tiệm Nhỏ',
  publisher: 'Tiệm Nhỏ',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Tiệm Nhỏ - Nền tảng Bán Hàng & Link-in-Bio Cho Creator',
    description:
      'Biến Link-in-Bio thành cỗ máy bán tài nguyên số & nhận tiền tự động 24/7 bằng VietQR. 0% hoa hồng, tiền về thẳng tài khoản ngân hàng.',
    siteName: 'Tiệm Nhỏ',
    type: 'website',
    locale: 'vi_VN',
    url: 'https://tiemnho.shop',
    images: [
      {
        url: '/logo-store.png',
        width: 512,
        height: 512,
        alt: 'Tiệm Nhỏ - Nền tảng Bán Hàng Cho Creator'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tiệm Nhỏ - Nền tảng Bán Hàng & Link-in-Bio Cho Creator',
    description:
      'Biến Link-in-Bio thành cỗ máy bán tài nguyên số & nhận tiền tự động 24/7 bằng VietQR. 0% hoa hồng.',
    images: ['/logo-store.png']
  }
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const isValidTheme = THEMES.some((t) => t.value === activeThemeValue);
  const themeToApply = isValidTheme ? activeThemeValue! : DEFAULT_THEME;

  return (
    <html
      lang='vi'
      suppressHydrationWarning
      data-theme={themeToApply}
      className={cn(fontSans.variable, fontNewsreader.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Set meta theme color
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `
          }}
        />
      </head>
      <body
        className={cn(
          'bg-background overflow-x-hidden overscroll-none font-sans antialiased',
          fontSans.variable,
          fontNewsreader.variable,
          fontVariables
        )}
      >
        <NextTopLoader color='var(--primary)' showSpinner={false} />
        <NuqsAdapter>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <Providers activeThemeValue={themeToApply}>
              <Toaster />
              {children}
            </Providers>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
