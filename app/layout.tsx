import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stoneverse - Own your property universe',
  description: 'Professional real estate portfolio management platform with French tax optimization, KPI tracking, and investment analysis tools. Simulate. Compare. Decide.',
  keywords: 'real estate, portfolio management, LMNP, SCI IS, French tax optimization, property investment, Stoneverse',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f9fafb',
        color: '#111827',
        margin: 0,
        padding: 0
      }}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}