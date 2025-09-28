import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stoneverse - Maîtrisez votre univers immobilier',
  description: 'Plateforme professionnelle de gestion de portefeuille immobilier avec optimisation fiscale française, suivi des KPI et outils d\'analyse d\'investissement. Simulez. Comparez. Décidez.',
  keywords: 'immobilier, gestion de portefeuille, LMNP, SCI IS, optimisation fiscale française, investissement immobilier, Stoneverse',
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