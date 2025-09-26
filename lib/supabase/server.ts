import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types/database';

export const createServerClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
  }

  const cookieStore = await cookies();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Server-side doesn't need session persistence
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache',
      },
    },
  });
};

// Service role client for administrative operations
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase service role environment variables. Please check your .env.local file.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Server-side helper functions
export const serverHelpers = {
  // Get user from server-side context
  getServerUser: async () => {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting server user:', error);
      return null;
    }

    return user;
  },

  // Get session from server-side context
  getServerSession: async () => {
    const supabase = await createServerClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting server session:', error);
      return null;
    }

    return session;
  },

  // Get server client instance
  getServerClient: async () => {
    return await createServerClient();
  },

  // Check if request is authenticated
  isServerAuthenticated: async () => {
    const session = await serverHelpers.getServerSession();
    return !!session?.user;
  },

  // Get user ID from server context
  getServerUserId: async () => {
    const user = await serverHelpers.getServerUser();
    return user?.id || null;
  },
};