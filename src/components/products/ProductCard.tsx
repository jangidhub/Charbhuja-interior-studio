/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imgError, setImgError] = useState(false);
  const primaryImage = product.images?.[0];

  return (
    <Link
      to={`/product/${product.productId}`}
      className="group bg-white border border-[#E7E1D9] rounded-[16px] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-[#A17A58]/60 hover:shadow-[0_10px_28px_rgba(41,35,30,0.08)]"
    >
      {/* Photograph */}
      <div className="aspect-[4/3] w-full bg-[#F0ECE5] overflow-hidden flex items-center justify-center">
        {primaryImage && !imgError ? (
          <img
            src={primaryImage}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#F0ECE5] text-[#77716A]">
            <img src="/assets/logo.png" alt="" className="h-8 w-auto opacity-35 mb-1.5" />
            <span className="text-[12px] font-medium">{product.name}</span>
          </div>
        )}
      </div>

      {/* Product Name & Price */}
      <div className="p-3.5 sm:p-4 flex flex-col gap-1.5">
        <h3 className="font-serif text-[15px] sm:text-[16px] font-semibold text-[#29231E] leading-snug line-clamp-2 group-hover:text-[#68452D] transition-colors">
          {product.name}
        </h3>

        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12px] text-[#77716A] truncate">{product.categoryName}</span>
          <span className="text-[14px] font-semibold text-[#68452D] tabular-nums whitespace-nowrap shrink-0">
            {product.price > 0
              ? `${product.startingPrice ? 'From ' : ''}₹${product.price.toLocaleString('en-IN')}`
              : 'Price on enquiry'}
          </span>
        </div>
      </div>
    </Link>
  );
};
