import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/actions/auth';
import { isAdmin } from '@/lib/types';

interface HeaderProps {
  email: string;
  role?: string;
}

export function Header({ email, role }: HeaderProps) {
  const admin = isAdmin(email, role);

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold">
            Fleapo Docs
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Documents
            </Link>
            {admin && (
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{email}</span>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
