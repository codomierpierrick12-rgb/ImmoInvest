# Stoneverse - Plateforme de Gestion Immobilière

> Own your property universe. Simulate. Compare. Decide.

Stoneverse est une plateforme moderne de gestion de patrimoine immobilier développée avec Next.js 15, React 19 et Supabase.

## 🚀 Fonctionnalités

### 📊 Tableau de Bord Complet
- **Vue d'ensemble** : KPIs financiers principaux et avancés
- **Gestion des biens** : Ajout, modification, suppression de propriétés
- **Entités légales** : Gestion LMNP, LMP, SCI IR/IS, SARL, SAS
- **Transactions** : Suivi des loyers, dépenses, remboursements
- **Comparateur** : Analyse comparative des investissements
- **Optimisation fiscale** : Simulation et recommandations
- **Alertes** : Notifications automatiques
- **Rapports** : Analyses détaillées et export

### 💰 KPIs Financiers Avancés
- **IRR** (Taux de Rendement Interne)
- **DSCR** (Debt Service Coverage Ratio)
- **LTV** (Loan-to-Value)
- **Cap Rate** (Taux de Capitalisation)
- **Cash-on-Cash Return**
- **Equity Multiple**
- **Yield on Cost**
- **Break Even Ratio**
- Et plus encore...

## 🛠️ Technologies

- **Frontend** : Next.js 15.5.4, React 19.1.0, TypeScript 5
- **Styling** : TailwindCSS 4, Radix UI
- **Backend** : Supabase 2.58.0 (PostgreSQL, Auth, RLS)
- **Déploiement** : Vercel
- **Package Manager** : npm

## 📦 Installation

### Prérequis
- Node.js 20+
- npm ou yarn
- Compte Supabase (optionnel pour le mode démo)

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/votre-username/immo-invest-app.git
cd immo-invest-app

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local

# Démarrer en mode développement
npm run dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
