'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isAllowedDomain } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { signInWithMagicLink } from '@/lib/actions/login';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!isAllowedDomain(email)) {
      setMessage({ type: 'error', text: 'Only @fleapo.com email addresses are allowed.' });
      return;
    }

    setLoading(true);

    try {
      const result = await signInWithMagicLink(email);

      if (result.success) {
        setMessage({ type: 'success', text: 'Check your email for the magic link!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send login link' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Fleapo Documents</CardTitle>
        <CardDescription>
          Sign in with your @fleapo.com email to access company documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@fleapo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
                }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
