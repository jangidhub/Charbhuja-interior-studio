/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DEFAULT_STORE_SETTINGS,
  subscribeStoreSettings,
} from '../../services/firebase/firestore';
import { StoreSettings } from '../../types';

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    const unsub = subscribeStoreSettings((s) => setSettings(s));
    return () => unsub();
  }, []);

  const telHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`;
  const waHref = `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, '')}`;

  return (
    <footer className="bg-white border-t border-[#E7E1D9] text-[#29231E] pt-12 pb-24 md:pb-12">
      <div className="max-w-[1200px] w-[92%] mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-[#E7E1D9]">
          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img src="/assets/logo.png" alt="Charbhuja Logo" className="h-7 w-auto object-contain" />
              <span className="font-serif text-[19px] font-bold tracking-[-0.02em] text-[#29231E]">
                Charbhuja
              </span>
            </Link>
            <p className="text-[14px] text-[#77716A] leading-relaxed max-w-xs">
              Solid wood. Simple forms. Handcrafted to last and delivered across India.
            </p>
          </div>

          {/* Simple Navigation */}
          <div className="space-y-3">
            <h4 className="font-sans text-[13px] font-semibold uppercase tracking-wider text-[#68452D]">
              Explore
            </h4>
            <ul className="space-y-2 text-[14px] text-[#77716A]">
              <li>
                <Link to="/browse" className="hover:text-[#68452D] transition-colors">
                  Browse Furniture
                </Link>
              </li>
              <li>
                <Link to="/upload-idea" className="hover:text-[#68452D] transition-colors">
                  Upload Your Design
                </Link>
              </li>
              <li>
                <Link to="/#about" className="hover:text-[#68452D] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/#contact" className="hover:text-[#68452D] transition-colors">
                  Contact Information
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Contact */}
          <div className="space-y-3">
            <h4 className="font-sans text-[13px] font-semibold uppercase tracking-wider text-[#68452D]">
              Contact
            </h4>
            <div className="space-y-2 text-[14px] text-[#77716A]">
              <p>
                <a href={telHref} className="hover:text-[#68452D] transition-colors font-semibold text-[#29231E]">
                  {settings.phone}
                </a>
              </p>
              <p>
                <a href={waHref} target="_blank" rel="noreferrer" className="hover:text-[#68452D] transition-colors">
                  WhatsApp Chat
                </a>
              </p>
              <p className="leading-relaxed">{settings.address}</p>
              <p className="text-[13px] text-[#A17A58]">{settings.hours}</p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#77716A]">
          <p>© {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p>
          <Link to="/admin" className="hover:text-[#68452D] transition-colors font-medium">
            Staff Access
          </Link>
        </div>
      </div>
    </footer>
  );
};
