/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Phone,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  getProductById,
  submitCustomIdeaRequest,
  subscribeStoreSettings,
  DEFAULT_STORE_SETTINGS,
} from '../../services/firebase/firestore';
import { INITIAL_PRODUCTS } from '../../data/products';
import { useAuthStore } from '../../store/useAuthStore';
import { Product, StoreSettings } from '../../types';

export const ProductDetailsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Simple Product Enquiry state (no registration required)
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [enquiryNote, setEnquiryNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');
  const [enquirySuccessId, setEnquirySuccessId] = useState<string | null>(null);

  useEffect(() => {
    const unsubSettings = subscribeStoreSettings((s) => setSettings(s));
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setActiveImageIndex(0);
    setEnquiryOpen(false);
    setEnquirySuccessId(null);

    getProductById(productId)
      .then((data) => {
        if (data) {
          setProduct(data);
        } else {
          const fallback = INITIAL_PRODUCTS.find((p) => p.productId === productId);
          if (fallback) setProduct(fallback);
        }
      })
      .catch(() => {
        const fallback = INITIAL_PRODUCTS.find((p) => p.productId === productId);
        if (fallback) setProduct(fallback);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      setEnquiryError('Please enter your name and phone number so we can call you back.');
      return;
    }

    setSubmitting(true);
    setEnquiryError('');

    try {
      const reqId = `ENQ-${Date.now().toString().slice(-6)}`;
      await submitCustomIdeaRequest({
        requestId: reqId,
        userId: user?.uid || `guest_${Date.now()}`,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: user?.email || '',
        itemType: product.categoryId || 'furniture',
        category: product.categoryName,
        productId: product.productId,
        productName: product.name,
        description: enquiryNote.trim()
          ? `Product Enquiry for ${product.name}: ${enquiryNote.trim()}`
          : `Customer requested details and pricing for ${product.name}`,
        estimatedBudget:
          product.price > 0 ? `₹${product.price.toLocaleString('en-IN')}` : 'On Enquiry',
        imageUrl: product.images?.[0] || '',
        requestType: 'product_enquiry',
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setEnquirySuccessId(reqId);
      setCustomerName('');
      setCustomerPhone('');
      setEnquiryNote('');
    } catch (err: any) {
      setEnquiryError(err?.message || 'Could not send enquiry. Please call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#F8F6F2] min-h-screen py-12">
        <div className="max-w-[1100px] w-[92%] mx-auto px-2 sm:px-4">
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 aspect-[4/3] bg-[#F0ECE5] rounded-[18px]" />
            <div className="lg:col-span-5 space-y-4">
              <div className="h-8 w-3/4 bg-[#F0ECE5] rounded" />
              <div className="h-6 w-1/3 bg-[#F0ECE5] rounded" />
              <div className="h-24 bg-[#F0ECE5] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#F8F6F2] min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="font-serif text-[26px] font-bold text-[#29231E]">Product not found</h1>
          <p className="text-[15px] text-[#77716A]">
            This furniture piece may have been updated or removed.
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#68452D] text-white text-[14px] font-semibold min-h-[44px] hover:bg-[#523724]"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0 ? product.images : ['/assets/logo.png'];
  const currentImage = images[activeImageIndex] || images[0];
  const telHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`;
  const waText = encodeURIComponent(`Hello Charbhuja Furniture, I would like to enquire about: ${product.name}`);
  const waHref = `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, '')}?text=${waText}`;

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-7 sm:py-10">
      <div className="max-w-[1100px] w-[92%] mx-auto px-1 sm:px-4">
        {/* Simple Back Link */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[14px] font-medium text-[#77716A] hover:text-[#68452D] transition-colors mb-6 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Large Photographs */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative rounded-[18px] overflow-hidden bg-white border border-[#E7E1D9] aspect-[4/3]">
              <img
                src={currentImage}
                alt={`${product.name} - Photo ${activeImageIndex + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-[#29231E] border border-[#E7E1D9] flex items-center justify-center transition-transform hover:scale-105"
                aria-label="View larger photo"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-[#29231E] border border-[#E7E1D9] flex items-center justify-center"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-[#29231E] border border-[#E7E1D9] flex items-center justify-center"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-16 rounded-[10px] overflow-hidden bg-white border-2 shrink-0 transition-opacity ${
                      activeImageIndex === idx
                        ? 'border-[#68452D] opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Clean Product Details & Simple Actions */}
          <div className="lg:col-span-5 bg-white border border-[#E7E1D9] rounded-[20px] p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[#A17A58]">
                {product.categoryName}
              </p>
              <h1 className="font-serif text-[26px] sm:text-[32px] font-bold text-[#29231E] leading-tight">
                {product.name}
              </h1>
              <p className="text-[22px] font-bold text-[#68452D] tabular-nums pt-1">
                {product.price > 0
                  ? `${product.startingPrice ? 'Starting from ' : ''}₹${product.price.toLocaleString('en-IN')}`
                  : 'Price on enquiry'}
              </p>
            </div>

            <p className="text-[15px] text-[#77716A] leading-relaxed">{product.description}</p>

            {/* Dimensions & Material */}
            <div className="border-t border-b border-[#E7E1D9] py-4 space-y-3 text-[14px]">
              <div className="flex justify-between gap-4">
                <span className="text-[#77716A] shrink-0">Dimensions</span>
                <span className="font-medium text-[#29231E] text-right tabular-nums">
                  {product.dimensions.width} × {product.dimensions.depth} × {product.dimensions.height}{' '}
                  {product.dimensions.unit}
                </span>
              </div>
              {product.materials && product.materials.length > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#77716A] shrink-0">Material</span>
                  <span className="font-medium text-[#29231E] text-right">
                    {product.materials.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Primary Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setEnquiryOpen((prev) => !prev)}
                className="w-full min-h-[48px] px-6 py-3 rounded-full bg-[#68452D] text-white text-[15px] font-semibold hover:bg-[#523724] transition-colors"
              >
                Enquire About This Product
              </button>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={telHref}
                  className="min-h-[48px] px-4 py-3 rounded-full bg-white text-[#68452D] border border-[#68452D] text-[14px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#F0ECE5] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Us</span>
                </a>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[48px] px-4 py-3 rounded-full bg-white text-[#29231E] border border-[#E7E1D9] text-[14px] font-semibold inline-flex items-center justify-center gap-2 hover:border-[#A17A58] hover:bg-[#F8F6F2] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#68452D]" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Simple Inline Enquiry Form (Zero registration) */}
            {enquirySuccessId ? (
              <div className="p-4 rounded-[14px] bg-[#F8F6F2] border border-[#E7E1D9] space-y-2 text-[14px]">
                <div className="flex items-center gap-2 font-semibold text-[#68452D]">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Enquiry Sent (#{enquirySuccessId})</span>
                </div>
                <p className="text-[#77716A]">
                  Thank you. Our workshop team will call you shortly with details for {product.name}.
                </p>
              </div>
            ) : (
              enquiryOpen && (
                <form
                  onSubmit={handleEnquirySubmit}
                  className="pt-4 border-t border-[#E7E1D9] space-y-3.5"
                >
                  <p className="text-[14px] font-semibold text-[#29231E]">
                    Leave your number and we will call you back
                  </p>

                  {enquiryError && (
                    <p className="text-[13px] text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                      {enquiryError}
                    </p>
                  )}

                  <div>
                    <label className="block text-[13px] font-medium text-[#77716A] mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full min-h-[46px] px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px] text-[16px] sm:text-[14px] text-[#29231E] focus:outline-none focus:border-[#68452D] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#77716A] mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 98290 00000"
                      className="w-full min-h-[46px] px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px] text-[16px] sm:text-[14px] text-[#29231E] focus:outline-none focus:border-[#68452D] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#77716A] mb-1">
                      Any Size or Wood Preference (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={enquiryNote}
                      onChange={(e) => setEnquiryNote(e.target.value)}
                      placeholder="e.g. Need in 7 ft width or natural polish"
                      className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px] text-[16px] sm:text-[14px] text-[#29231E] focus:outline-none focus:border-[#68452D] focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[48px] px-5 py-3 rounded-full bg-[#68452D] text-white text-[14px] font-semibold hover:bg-[#523724] disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send Enquiry'}
                  </button>
                </form>
              )
            )}
          </div>
        </div>
      </div>

      {/* Simple Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#29231E]/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
            aria-label="Close photo view"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={currentImage}
            alt={product.name}
            className="max-w-full max-h-[88vh] object-contain rounded-[12px]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
