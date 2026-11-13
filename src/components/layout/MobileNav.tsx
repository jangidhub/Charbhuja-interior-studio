/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid2x2, Upload, Phone } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const location = useLocation();

  const items = [
    { label: 'Home', path: '/', icon: Home, isHash: false },
    { label: 'Browse', path: '/browse', icon: Grid2x2, isHash: false },
    { label: 'Upload', path: '/upload-idea', icon: Upload, isHash: false },
    { label: 'Contact', path: '/#contact', icon: Phone, isHash: true },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[60px] bg-[#F8F6F2]/95 backdrop-blur-xl border-t border-[#E7E1D9] flex justify-around items-center px-2 pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Mobile Navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.path === '/'
            ? location.pathname === '/' && !location.hash
            : item.path === '/browse'
            ? location.pathname === '/browse' || location.pathname.startsWith('/product/')
            : !item.isHash && location.pathname === item.path;

        return (
          <Link
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] active:scale-95 transition-transform ${
              isActive ? 'text-[#68452D] font-semibold' : 'text-[#77716A] font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
            <span className="text-[11px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
