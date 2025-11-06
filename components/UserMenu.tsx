'use client';

/**
 * UserMenu Component
 * Shows authenticated user's info and sign out option
 * Appears in top-left corner with twilight styling
 */

import { useState, useEffect } from 'react';
import { User, LogOut, Settings } from 'lucide-react';
import { authService } from '@/lib/auth/authService';
import { supabase } from '@/lib/supabaseClient';

interface UserMenuProps {
  displayName: string;
  color: string;
}

export function UserMenu({ displayName, color }: UserMenuProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');
      }
    };

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    window.location.reload(); // Reload to show welcome modal
  };

  // Don't show menu for guest users
  if (!isAuthenticated) return null;

  return (
    <div className="absolute top-4 left-4 z-50">
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-lounge bg-glass-surface border border-glass-border shadow-glass-md hover:bg-glass-surfaceLight transition-all"
      >
        {/* Avatar circle */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-twilight"
          style={{ backgroundColor: color }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>

        {/* Name */}
        <span className="text-sm text-parchment font-medium hidden sm:block">
          {displayName}
        </span>

        {/* Dropdown indicator */}
        <svg
          className={`w-4 h-4 text-parchment transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 backdrop-blur-lounge bg-glass-surface border border-glass-border rounded-glass shadow-glass-lg overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-glass-borderWeak">
            <p className="text-xs uppercase tracking-wider text-text-faint mb-1">
              Signed in as
            </p>
            <p className="text-sm text-parchment font-medium truncate">
              {userEmail}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Settings (future) */}
            <button
              className="w-full px-4 py-2 flex items-center gap-3 text-text-muted hover:bg-glass-surfaceLight hover:text-parchment transition-colors text-left"
              onClick={() => {
                setIsOpen(false);
                // TODO: Open settings
              }}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>

            {/* Sign Out */}
            <button
              className="w-full px-4 py-2 flex items-center gap-3 text-twilight-blush hover:bg-twilight-blush/10 transition-colors text-left"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
