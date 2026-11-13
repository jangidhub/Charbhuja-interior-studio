/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import {
  DEFAULT_STORE_SETTINGS,
  subscribeStoreSettings,
} from '../../services/firebase/firestore';
import { StoreSettings } from '../../types';

export const Header: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useAuthStore();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    const unsub = subscribeStoreSettings((s) => setSettings(s));
    return () => unsub();
  }, []);

  const navLinks = [
    { label: 'Browse', path: '/browse' },
    { label: 'Upload Yours', path: '/upload-idea' },
    { label: 'About', path: '/#about' },
    { label: 'Contact', path: '/#contact' },
  ];

  const telHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`;

  return (
    <header className="sticky top-0 z-50 h-14 bg-[#F8F6F2]/90 backdrop-blur-xl border-b border-[#E7E1D9]">
      <div className="max-w-[1200px] w-[92%] mx-auto h-full px-2 sm:px-4 flex items-center justify-between gap-8">
        {/* Zone 1: Charbhuja Logo & Wordmark */}
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-[#29231E] hover:opacity-85 transition-opacity whitespace-nowrap shrink-0"
        >
          <img
            src="/assets/logo.png"
            alt="Charbhuja Logo"
            className="h-7 sm:h-8 w-auto object-contain block"
          />
          <span className="font-serif text-[19px] sm:text-[20px] font-bold tracking-[-0.02em] text-[#29231E]">
            Charbhuja
          </span>
        </Link>

        {/* Zone 2: Minimal Single-Line Navigation */}
        <nav
          className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#77716A]"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => {
            const isActive =
              link.path === '/browse'
                ? location.pathname === '/browse' || location.pathname.startsWith('/product/')
                : link.path === '/upload-idea'
                ? location.pathname === '/upload-idea'
                : false;

            return (
              <Link
                key={link.label}
                to={link.path}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'text-[#68452D] font-semibold'
                    : 'hover:text-[#29231E]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action (+ Admin shortcut if signed in as verified staff) */}
        <div className="flex items-center gap-3 shrink-0">
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-full border border-[#E7E1D9] bg-white text-[13px] font-medium text-[#29231E] hover:border-[#68452D] hover:text-[#68452D] transition-colors whitespace-nowrap shrink-0"
            >
              Admin
            </Link>
          )}
          <a
            href={telHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#68452D] text-white text-[13px] font-semibold hover:bg-[#523724] transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Call Us</span>
          </a>
        </div>
      </div>
    </header>
  );
};
