/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, MessageCircle, MapPin, Clock, ChevronDown, Compass } from 'lucide-react';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../../data/categories';
import {
  DEFAULT_STORE_SETTINGS,
  subscribeCategories,
  subscribeStoreSettings,
  mapDefaultCategories,
} from '../../services/firebase/firestore';
import { Category, StoreSettings } from '../../types';

export const HomePage: React.FC = () => {
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>(() => mapDefaultCategories());
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    const unsubCats = subscribeCategories((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats.filter((c) => c.isActive !== false));
      }
    });
    const unsubSettings = subscribeStoreSettings((s) => setSettings(s));
    return () => {
      unsubCats();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.replace('#', ''));
      if (target) {
        window.requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
  }, [location.hash]);

  const telHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`;
  const waHref = `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, '')}`;

  return (
    <div className="flex flex-col bg-[#F8F6F2] text-[#29231E]">
      {/* ── 1. MINIMAL HERO SECTION ─────────────────────────────── */}
      <section className="min-h-[calc(100dvh-56px)] flex flex-col justify-between items-center pt-10 sm:pt-14 pb-8 px-4 sm:px-6 text-center bg-[#F8F6F2]">
        <div className="w-full max-w-[960px] mx-auto flex flex-col items-center my-auto">
          <h1 className="font-serif text-[clamp(40px,6.8vw,80px)] font-bold tracking-[-0.03em] leading-[1.06] text-[#29231E] text-balance">
            Furniture,
            <br />
            made to <span className="text-[#68452D] italic font-semibold">stay.</span>
          </h1>

          <p className="mt-4 text-[clamp(17px,2.1vw,22px)] font-medium text-[#77716A] max-w-xl">
            Solid wood. Simple forms. Delivered across India.
          </p>

          {/* Primary & Secondary Buttons */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-[320px] sm:max-w-none">
            <Link
              to="/browse"
              className="w-full sm:w-auto min-h-[46px] px-7 py-3 rounded-full bg-[#68452D] text-white text-[15px] font-semibold inline-flex items-center justify-center transition-all duration-200 hover:bg-[#523724] hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Products
            </Link>

            <Link
              to="/upload-idea"
              className="w-full sm:w-auto min-h-[46px] px-7 py-3 rounded-full bg-white text-[#68452D] border border-[#68452D] text-[15px] font-semibold inline-flex items-center justify-center transition-all duration-200 hover:bg-[#F0ECE5] hover:scale-[1.02] active:scale-[0.98]"
            >
              Upload yours
            </Link>
          </div>

          {/* Horizontal Furniture Category Strip */}
          <div className="w-full max-w-[960px] mt-9 sm:mt-11 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex gap-2.5 sm:gap-3 w-max mx-auto px-2">
              {categories.map((cat) => {
                const defaultIconItem = DEFAULT_CATEGORIES.find((d) => d.slug === cat.slug);
                return (
                  <Link
                    key={cat.categoryId}
                    to={`/browse?cat=${cat.slug}`}
                    className="flex flex-col items-center gap-2 w-[82px] sm:w-[96px] shrink-0 group transition-all"
                  >
                    <div className="w-[82px] sm:w-[96px] h-[54px] sm:h-[60px] bg-white border border-[#E7E1D9] rounded-[12px] flex items-center justify-center p-2 transition-all duration-200 group-hover:border-[#A17A58] group-hover:shadow-[0_6px_16px_rgba(104,69,45,0.10)] group-hover:-translate-y-0.5">
                      {defaultIconItem ? (
                        defaultIconItem.renderIcon()
                      ) : (
                        <Compass className="w-6 h-6 text-[#68452D]" />
                      )}
                    </div>
                    <span className="text-[12px] font-medium text-[#77716A] group-hover:text-[#68452D] text-center line-clamp-1 transition-colors">
                      {cat.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scroll / Browse All Indicator */}
        <Link
          to="/browse"
          className="inline-flex flex-col items-center gap-1.5 text-[#A17A58] hover:text-[#68452D] transition-colors mt-6 gentle-bounce"
          aria-label="Browse all furniture"
        >
          <span className="text-[12px] font-semibold tracking-[0.06em] uppercase">Browse All</span>
          <ChevronDown className="w-4 h-4 stroke-[2.2]" />
        </Link>
      </section>

      {/* ── 2. SMALL ABOUT SECTION ──────────────────────────────── */}
      <section id="about" className="scroll-mt-14 bg-white border-t border-[#E7E1D9] py-20 px-4 sm:px-6">
        <div className="max-w-[720px] mx-auto text-center space-y-5">
          <img
            src="/assets/logo.png"
            alt="Charbhuja Furniture"
            className="h-14 w-auto mx-auto object-contain"
          />
          <h2 className="font-serif text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-[#29231E] text-balance">
            Built directly in our workshop.
          </h2>
          <p className="text-[16px] sm:text-[18px] text-[#77716A] leading-relaxed">
            At {settings.businessName}, every piece is crafted from seasoned solid wood using traditional joinery and durable finishes. Choose from our curated collection, or upload a photo of anything you want made to your room size.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-6 text-[14px] font-semibold text-[#68452D]">
            <span>Seasoned Teak &amp; Sheesham</span>
            <span className="text-[#A17A58]" aria-hidden="true">·</span>
            <span>Made to Your Size</span>
            <span className="text-[#A17A58]" aria-hidden="true">·</span>
            <span>Delivered Across India</span>
          </div>
        </div>
      </section>

      {/* ── 3. CONTACT INFORMATION SECTION ──────────────────────── */}
      <section id="contact" className="scroll-mt-14 bg-[#F8F6F2] border-t border-[#E7E1D9] py-20 px-4 sm:px-6">
        <div className="max-w-[960px] mx-auto">
          <div className="text-center max-w-lg mx-auto mb-10 space-y-2">
            <h2 className="font-serif text-[28px] sm:text-[34px] font-bold tracking-[-0.02em] text-[#29231E]">
              Contact Us
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#77716A]">
              Have a question about size, timber, or pricing? Call or message us directly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Phone */}
            <a
              href={telHref}
              className="bg-white border border-[#E7E1D9] rounded-[16px] p-6 flex flex-col justify-between gap-4 hover:border-[#A17A58] hover:shadow-[0_8px_24px_rgba(104,69,45,0.08)] transition-all min-h-[140px]"
            >
              <div className="flex items-center gap-2.5 text-[#68452D]">
                <Phone className="w-5 h-5" />
                <span className="text-[14px] font-semibold">Call Us</span>
              </div>
              <div>
                <p className="text-[18px] font-bold text-[#29231E] tabular-nums">
                  {settings.phone}
                </p>
                <p className="text-[13px] text-[#77716A] mt-1">Tap to call directly</p>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="bg-white border border-[#E7E1D9] rounded-[16px] p-6 flex flex-col justify-between gap-4 hover:border-[#A17A58] hover:shadow-[0_8px_24px_rgba(104,69,45,0.08)] transition-all min-h-[140px]"
            >
              <div className="flex items-center gap-2.5 text-[#68452D]">
                <MessageCircle className="w-5 h-5" />
                <span className="text-[14px] font-semibold">WhatsApp</span>
              </div>
              <div>
                <p className="text-[18px] font-bold text-[#29231E]">
                  Message on WhatsApp
                </p>
                <p className="text-[13px] text-[#77716A] mt-1">Share photos or ask for an estimate</p>
              </div>
            </a>

            {/* Address */}
            <div className="bg-white border border-[#E7E1D9] rounded-[16px] p-6 flex flex-col justify-between gap-4 min-h-[140px]">
              <div className="flex items-center gap-2.5 text-[#68452D]">
                <MapPin className="w-5 h-5" />
                <span className="text-[14px] font-semibold">Workshop Address</span>
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#29231E] leading-relaxed">
                  {settings.address}
                </p>
                <p className="text-[13px] text-[#77716A] mt-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-[#A17A58]" />
                  <span>{settings.hours}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
