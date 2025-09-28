'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }

      if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        // Demo mode - simulate account creation
        setSuccess('Compte créé avec succès en mode démo !');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        // Real Supabase authentication
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          setSuccess('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.');
          setTimeout(() => {
            router.push('/auth/signin');
          }, 3000);
        }
      }
    } catch (err) {
      setError('Erreur lors de la création du compte. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Stoneverse</h2>
          <p className="mt-2 text-sm text-gray-600">
            Gestion de patrimoine immobilier
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Créer votre compte</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <Input
                label="Adresse email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Entrez votre email"
              />

              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Entrez votre mot de passe"
                helperText="Au moins 6 caractères"
              />

              <Input
                label="Confirmer le mot de passe"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirmez votre mot de passe"
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                Créer le compte
              </Button>

              <div className="text-center">
                <a
                  href="/auth/signin"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Déjà un compte ? Se connecter
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}