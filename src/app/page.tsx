import { LoginForm } from '@/components/auth/login-form';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <LoginForm />
    </main>
  );
}
