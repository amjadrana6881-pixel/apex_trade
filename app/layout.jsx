import './globals.css';
import { AuthProvider } from './context/AuthContext';
import ClientLayout from './components/ClientLayout';

export const metadata = {
  title: 'ApexTrade PRO - Advanced High-Frequency Option & Crypto Trading Platform',
  description: 'Trade institutional crypto options, live forex, gold, and indices with real-time settlement, daily verified signals, automated yields, and instant crypto payouts.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
