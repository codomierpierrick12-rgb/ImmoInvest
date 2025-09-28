'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import PortfolioDashboard from '@/components/portfolio/PortfolioDashboard';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  // Check if Supabase is configured
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTY1NzEyMDB9.your-anon-key';

  const supabase = isSupabaseConfigured ? createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) : null;
  const router = useRouter();

  const checkUser = useCallback(async () => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        // Demo mode - Supabase not configured
        const fakeUser = {
          id: 'demo-user',
          email: 'demo@stoneverse.app',
          created_at: new Date().toISOString()
        };
        setUser(fakeUser);
      } else {
        // Real Supabase authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/signin');
          return;
        }
        setUser(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      if (!isSupabaseConfigured) {
        // Fallback to demo mode
        const fakeUser = {
          id: 'demo-user',
          email: 'demo@stoneverse.app',
          created_at: new Date().toISOString()
        };
        setUser(fakeUser);
      } else {
        router.push('/auth/signin');
      }
    } finally {
      setLoading(false);
    }
  }, [isSupabaseConfigured, supabase, router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/auth/signin');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stoneverse</h1>
              <p className="text-gray-600 mt-1">
                Bienvenue, {user?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        <PortfolioDashboard userId={user?.id || 'demo-user'} />
      </div>
    </div>
  );
}