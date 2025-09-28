import PortfolioDashboard from '@/components/portfolio/PortfolioDashboard';

export default async function DashboardPage() {
  // DEMO MODE: Skip authentication for testing
  const demoUserId = 'demo-user-123';

  return <PortfolioDashboard userId={demoUserId} />;
}