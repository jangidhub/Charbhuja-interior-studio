/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MobileNav } from '../components/layout/MobileNav';
import { HomePage } from '../pages/Home/HomePage';
import { BrowsePage } from '../pages/Browse/BrowsePage';
import { ProductDetailsPage } from '../pages/ProductDetails/ProductDetailsPage';
import { UploadIdeaPage } from '../pages/CustomDesign/UploadIdeaPage';
import { LoginPage } from '../pages/Auth/LoginPage';
import { AdminDashboardPage } from '../pages/Admin/AdminDashboardPage';

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.replace('#', ''));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F6F2] text-[#29231E]">
      {!isAuthPage && !isAdminPage && <Header />}
      <main className="flex-1">{children}</main>
      {!isAuthPage && !isAdminPage && <Footer />}
      {!isAuthPage && !isAdminPage && <MobileNav />}
    </div>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/product/:productId" element={<ProductDetailsPage />} />
          <Route path="/upload-idea" element={<UploadIdeaPage />} />
          <Route path="/custom-design" element={<UploadIdeaPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/*" element={<AdminDashboardPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};
