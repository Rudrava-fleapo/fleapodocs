
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthConfirmPage() {
    const router = useRouter();
    const [status, setStatus] = useState('Authenticating...');

    useEffect(() => {
        const handleAuth = async () => {
            const supabase = createClient();

            // 1. Handle Hash Fragment (Implicit Flow from generateLink)
            // The hash looks like: #access_token=...&refresh_token=...&...
            if (window.location.hash) {
                try {
                    // Parse hash manually to be safe
                    const hashParams = new URLSearchParams(window.location.hash.substring(1));
                    const access_token = hashParams.get('access_token');
                    const refresh_token = hashParams.get('refresh_token');

                    if (access_token && refresh_token) {
                        const { error } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });

                        if (!error) {
                            setStatus('Success! Redirecting...');
                            // Give it a moment to sync state
                            setTimeout(() => router.push('/dashboard'), 500);
                            return;
                        } else {
                            console.error('Set session error:', error);
                            setStatus(`Error setting session: ${error.message}`);
                        }
                    }
                } catch (e: any) {
                    console.error('Error parsing hash:', e);
                    setStatus(`Error parsing login data: ${e.message}`);
                }
            }

            // 2. Handle Code (PKCE Flow)
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (!error) {
                    setStatus('Success! Redirecting...');
                    setTimeout(() => router.push('/dashboard'), 500);
                    return;
                } else {
                    setStatus(`Error exchanging code: ${error.message}`);
                }
            }

            // 3. Fallback: Check if already logged in
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                router.push('/dashboard');
            } else {
                // Only show failure if we actually tried to parse something and failed, OR if we had nothing to parse.
                // If we had a hash/code and failed, status is already updated.
                // If we have nothing, we redirect to error.
                if (!window.location.hash && !code) {
                    setStatus('No login data found.');
                    setTimeout(() => router.push('/?error=auth_failed_no_data'), 2000);
                }
            }
        };

        handleAuth();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full text-center">
                <h2 className="text-2xl font-semibold mb-4">Logging In</h2>
                <p className={`text-gray-600 ${status.includes('Error') ? 'text-red-500' : ''}`}>
                    {status}
                </p>
            </div>
        </div>
    );
}
