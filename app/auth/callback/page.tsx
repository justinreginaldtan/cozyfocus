'use client';

/**
 * OAuth Callback Page
 * Handles redirect from OAuth providers (Google, etc.)
 * Exchanges auth code for session
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = async () => {
      try {
        // Get the code from URL (Supabase handles this automatically)
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth Callback] Error:', error);
          setStatus('❌ Authentication failed');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        if (data.session) {
          console.log('[Auth Callback] Success! User:', data.session.user.email);
          setStatus('✅ Authentication successful! Redirecting...');

          // Redirect to main app
          setTimeout(() => router.push('/'), 1000);
        } else {
          setStatus('⚠️ No session found. Redirecting...');
          setTimeout(() => router.push('/'), 2000);
        }
      } catch (err) {
        console.error('[Auth Callback] Exception:', err);
        setStatus('❌ Something went wrong');
        setTimeout(() => router.push('/'), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-twilight flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        {/* Animated loader */}
        <div className="animate-pulse-soft">
          <div className="w-16 h-16 mx-auto rounded-full bg-twilight-ember"></div>
        </div>

        {/* Status message */}
        <p className="text-parchment text-lg">{status}</p>

        {/* Subtle hint */}
        <p className="text-text-faint text-sm">
          You'll be redirected in a moment...
        </p>
      </div>
    </div>
  );
}
