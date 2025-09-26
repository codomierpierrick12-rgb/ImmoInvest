import { serverHelpers } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PortfolioDashboard from '@/components/portfolio/PortfolioDashboard';

export default async function DashboardPage() {
  // Check if user is authenticated
  const user = await serverHelpers.getServerUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return <PortfolioDashboard userId={user.id} />;
}