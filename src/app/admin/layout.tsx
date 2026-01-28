import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { isAdmin, isAllowedDomain } from '@/lib/types';
import { Header } from '@/components/header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user?.email || !isAllowedDomain(user.email)) {
    redirect('/');
  }

  if (!isAdmin(user.email, user.app_metadata?.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header email={user.email} role={user.app_metadata?.role} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
