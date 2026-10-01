import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IPO Money Handler - Mobile-First Personal Finance & IPO Manager',
  description: 'Manual personal money tracking with live public Indian IPO data, funds blocking, and allotment calculations.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IPO Money',
  },
  icons: {
    icon: '/app-logo.png',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=no',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
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
                  window.addEventListener('unhandledrejection', function(e) {
                    if (!e.reason || e.reason instanceof Event || (typeof e.reason === 'object' && e.reason.toString() === '[object Event]')) {
                      e.preventDefault();
                      e.stopImmediatePropagation();
                    }
                  }, true);

                  window.addEventListener('error', function(e) {
                    if (e.target && e.target !== window && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK' || e.target.tagName === 'AUDIO' || e.target.tagName === 'VIDEO')) {
                      e.preventDefault();
                      e.stopImmediatePropagation();
                      return;
                    }
                    if (e.message === '[object Event]' || !e.error) {
                      e.preventDefault();
                      e.stopImmediatePropagation();
                    }
                  }, true);

                  var stored = localStorage.getItem('ipo_money_handler_v1');
                  var isDark = false;
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    if (parsed && parsed.themeMode === 'dark') {
                      isDark = true;
                    } else if (parsed && parsed.themeMode === 'light') {
                      isDark = false;
                    } else {
                      isDark = prefersDark;
                    }
                  } else {
                    isDark = prefersDark;
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
      <body suppressHydrationWarning className="bg-[#f8fafc] dark:bg-[#0b1120] text-[#0f172a] dark:text-[#f8fafc] antialiased overflow-x-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}
