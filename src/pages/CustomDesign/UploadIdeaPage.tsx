/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, X, CheckCircle2, Phone, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import {
  submitCustomIdeaRequest,
  subscribeStoreSettings,
  DEFAULT_STORE_SETTINGS,
  CustomIdeaSubmission,
} from '../../services/firebase/firestore';
import { uploadCustomDesignFile, UploadedAttachment } from '../../services/firebase/storage';
import { StoreSettings } from '../../types';

export const UploadIdeaPage: React.FC = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [description, setDescription] = useState('');
  const [roomDimensions, setRoomDimensions] = useState('');

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<
    Array<{ name: string; url: string; isPdf: boolean }>
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedReq, setSubmittedReq] = useState<CustomIdeaSubmission | null>(null);

  useEffect(() => {
    const unsub = subscribeStoreSettings((s) => setSettings(s));
    return () => unsub();
  }, []);

  const handleFilesAdded = (newFiles: FileList | File[]) => {
    setErrorMsg('');
    const validList: File[] = [];
    const previews: Array<{ name: string; url: string; isPdf: boolean }> = [];

    Array.from(newFiles).forEach((file) => {
      const isImg = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isPdf = file.type === 'application/pdf';

      if (!isImg && !isPdf) {
        setErrorMsg('Please select photo files (JPG, PNG, WebP) or a PDF.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" is larger than 15 MB.`);
        return;
      }

      validList.push(file);
      previews.push({
        name: file.name,
        url: isImg ? URL.createObjectURL(file) : '',
        isPdf,
      });
    });

    setFilesToUpload((prev) => [...prev, ...validList]);
    setFilePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveFile = (index: number) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg('Please enter your phone number so we can call you.');
      return;
    }
    if (!description.trim() && filesToUpload.length === 0) {
      setErrorMsg('Please describe the furniture you want or upload a reference photo.');
      return;
    }

    setSubmitting(true);
    try {
      const userId = user?.uid || `guest_${Date.now()}`;
      const uploadedAttachments: UploadedAttachment[] = [];

      for (const file of filesToUpload) {
        const uploaded = await uploadCustomDesignFile(file, userId);
        uploadedAttachments.push(uploaded);
      }

      const primaryImage =
        uploadedAttachments.find((a) => a.type.startsWith('image/'))?.url ||
        uploadedAttachments[0]?.url ||
        '';

      const reqId = `IDEA-${Date.now().toString().slice(-6)}`;
      const submission: CustomIdeaSubmission = {
        requestId: reqId,
        userId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: user?.email || '',
        itemType: 'custom',
        description: description.trim() || 'Custom furniture enquiry with reference photo',
        estimatedBudget: 'Estimate Requested',
        imageUrl: primaryImage,
        roomDimensions: roomDimensions.trim() || undefined,
        attachments: uploadedAttachments,
        requestType: 'quote',
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await submitCustomIdeaRequest(submission);
      setSubmittedReq(submission);
    } catch (err: any) {
      console.error('Enquiry submission failed:', err);
      setErrorMsg(err?.message || 'Unable to submit right now. Please call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const telHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`;

  if (submittedReq) {
    return (
      <div className="bg-[#F8F6F2] min-h-[80vh] py-16 px-4">
        <div className="max-w-[560px] mx-auto bg-white border border-[#E7E1D9] rounded-[20px] p-8 sm:p-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-[#F0ECE5] text-[#68452D] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-[#A17A58]">
              Enquiry Reference #{submittedReq.requestId}
            </p>
            <h1 className="font-serif text-[28px] font-bold text-[#29231E]">
              Thank you, {submittedReq.customerName}
            </h1>
            <p className="text-[15px] text-[#77716A] leading-relaxed">
              We have received your furniture enquiry and reference photos. Our workshop team will call you on{' '}
              <strong className="text-[#29231E]">{submittedReq.customerPhone}</strong> to discuss wood, dimensions, and pricing.
            </p>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/browse"
              className="min-h-[46px] px-7 py-3 rounded-full bg-[#68452D] text-white text-[15px] font-semibold inline-flex items-center justify-center hover:bg-[#523724]"
            >
              Browse Furniture
            </Link>
            <a
              href={telHref}
              className="min-h-[46px] px-7 py-3 rounded-full bg-white text-[#68452D] border border-[#68452D] text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#F0ECE5]"
            >
              <Phone className="w-4 h-4" />
              <span>Call Us</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 sm:py-14 px-4">
      <div className="max-w-[640px] mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-[30px] sm:text-[40px] font-bold tracking-[-0.02em] text-[#29231E]">
            Upload Yours
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#77716A] max-w-md mx-auto">
            Found a photo of a sofa, bed, or wardrobe you like? Share it here and we will call you with an estimate.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E7E1D9] rounded-[20px] p-6 sm:p-8 space-y-5"
        >
          {errorMsg && (
            <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-[14px] text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label htmlFor="customerName" className="block text-[14px] font-semibold text-[#29231E] mb-1.5">
              Your Name <span className="text-red-600">*</span>
            </label>
            <input
              id="customerName"
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full min-h-[48px] px-4 py-3 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[12px] text-[16px] text-[#29231E] placeholder-[#9B938B] focus:outline-none focus:border-[#68452D] focus:bg-white"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="customerPhone" className="block text-[14px] font-semibold text-[#29231E] mb-1.5">
              Phone Number <span className="text-red-600">*</span>
            </label>
            <input
              id="customerPhone"
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 98290 00000"
              className="w-full min-h-[48px] px-4 py-3 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[12px] text-[16px] text-[#29231E] placeholder-[#9B938B] focus:outline-none focus:border-[#68452D] focus:bg-white"
            />
          </div>

          {/* Furniture Description */}
          <div>
            <label htmlFor="furnitureDesc" className="block text-[14px] font-semibold text-[#29231E] mb-1.5">
              Furniture Description <span className="text-red-600">*</span>
            </label>
            <textarea
              id="furnitureDesc"
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need (for example: 3-seater wooden sofa, sliding wardrobe, or 6-seater dining table)"
              className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[12px] text-[16px] text-[#29231E] placeholder-[#9B938B] focus:outline-none focus:border-[#68452D] focus:bg-white"
            />
          </div>

          {/* Optional Dimensions */}
          <div>
            <label htmlFor="dimensions" className="block text-[14px] font-semibold text-[#29231E] mb-1.5">
              Approximate Dimensions (Optional)
            </label>
            <input
              id="dimensions"
              type="text"
              value={roomDimensions}
              onChange={(e) => setRoomDimensions(e.target.value)}
              placeholder="e.g. 7 ft wide × 3 ft deep"
              className="w-full min-h-[48px] px-4 py-3 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[12px] text-[16px] text-[#29231E] placeholder-[#9B938B] focus:outline-none focus:border-[#68452D] focus:bg-white"
            />
          </div>

          {/* Upload Reference Images */}
          <div>
            <span className="block text-[14px] font-semibold text-[#29231E] mb-1.5">
              Upload Reference Photos
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFilesAdded(e.target.files);
                e.target.value = '';
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) handleFilesAdded(e.dataTransfer.files);
              }}
              className={`w-full py-8 px-4 rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                isDragging
                  ? 'border-[#68452D] bg-[#F0ECE5]'
                  : 'border-[#D5CBBF] bg-[#F8F6F2] hover:border-[#68452D]'
              }`}
            >
              <Upload className="w-6 h-6 text-[#68452D]" />
              <span className="text-[15px] font-semibold text-[#29231E]">
                Tap to choose photos
              </span>
              <span className="text-[13px] text-[#77716A]">
                Photos from your phone or computer (JPG, PNG, PDF)
              </span>
            </button>

            {filePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {filePreviews.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-[10px] overflow-hidden border border-[#E7E1D9] bg-[#F8F6F2] flex items-center justify-center"
                  >
                    {file.isPdf ? (
                      <div className="p-2 text-center">
                        <FileText className="w-6 h-6 mx-auto text-[#68452D]" />
                        <span className="text-[11px] text-[#77716A] line-clamp-1 mt-1">
                          {file.name}
                        </span>
                      </div>
                    ) : (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-[#29231E]/80 text-white flex items-center justify-center hover:bg-[#68452D]"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[50px] px-6 py-3.5 rounded-full bg-[#68452D] text-white text-[16px] font-semibold hover:bg-[#523724] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting Enquiry...' : 'Submit Enquiry'}
          </button>

          <p className="text-center text-[13px] text-[#77716A]">
            Prefer speaking directly?{' '}
            <a href={telHref} className="font-semibold text-[#68452D] underline underline-offset-2">
              Call {settings.phone}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};
