/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const profile = await signInWithGoogle();
      if (profile.isServerVerifiedAdmin) {
        navigate('/admin');
      } else {
        setAuthError(
          'This Google account does not have administrator permissions. Customers can browse and send enquiries directly without signing in.'
        );
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-4">
      <Link
        to="/"
        className="fixed top-5 left-5 w-10 h-10 rounded-full bg-white border border-[#E7E1D9] flex items-center justify-center text-[#29231E] hover:border-[#A17A58] transition-all"
        aria-label="Back to storefront"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="w-full max-w-[400px] bg-white border border-[#E7E1D9] rounded-[20px] p-8 sm:p-9 shadow-[0_6px_28px_rgba(41,35,30,0.06)] space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-[#29231E]">
          <img src="/assets/logo.png" alt="Charbhuja" className="h-7 w-auto" />
          <span className="font-serif text-[19px] font-bold tracking-[-0.02em]">Charbhuja</span>
        </Link>

        <div>
          <h1 className="font-serif text-[26px] font-bold tracking-[-0.02em] text-[#29231E]">
            Staff Sign In
          </h1>
          <p className="text-[14px] text-[#77716A] mt-1">
            Administrator access for managing products, enquiries, orders, and store settings.
          </p>
        </div>

        {authError && (
          <div className="p-3 rounded-[10px] bg-red-50 text-[13px] text-[#c0392b] leading-snug">
            {authError}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full min-h-[46px] py-3 px-4 rounded-full border border-[#68452D] bg-[#68452D] hover:bg-[#523724] text-[14px] font-semibold text-white transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.3 30.1 0 24 0 14.8 0 7 5.4 3 13.3l7.8 6C13 13.5 18 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"
              />
              <path
                fill="#FBBC05"
                d="M10.8 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7L2.5 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.3-5.9z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.1 0 11.3-2 15-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.5 2.3-6 0-11-4-12.8-9.4l-8 6.1C7 43.5 15 48 24 48z"
              />
            </svg>
          </span>
          <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>

        <div className="pt-2 border-t border-[#E7E1D9] flex items-center justify-center gap-1.5 text-[12px] text-[#77716A]">
          <ShieldCheck className="w-4 h-4 text-[#68452D]" />
          <span>Verified Firebase Administrator access only</span>
        </div>
      </div>
    </div>
  );
};
