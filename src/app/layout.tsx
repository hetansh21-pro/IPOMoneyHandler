import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IPO Money Handler - Mobile-First Personal Finance & IPO Manager',
  description: 'Manual personal money tracking with live public Indian IPO data, funds blocking, and allotment calculations.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IPO Money',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('ipo_money_handler_v1');
                  var isDark = false;
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    if (parsed && parsed.themeMode === 'dark') {
                      isDark = true;
                    }
                  }
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#f8fafc] dark:bg-[#0b1120] text-[#0f172a] dark:text-[#f8fafc] antialiased overflow-x-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}
