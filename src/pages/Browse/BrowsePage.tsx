/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { ProductCard } from '../../components/products/ProductCard';
import {
  subscribeProducts,
  subscribeCategories,
  mapDefaultCategories,
} from '../../services/firebase/firestore';
import { INITIAL_PRODUCTS } from '../../data/products';
import { Product, Category } from '../../types';

export const BrowsePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('cat') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(() => mapDefaultCategories());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    const unsubscribe = subscribeProducts((data) => {
      if (data && data.length > 0) {
        setProducts(data);
      }
      setLoading(false);
    });

    const unsubCategories = subscribeCategories((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats.filter((c) => c.isActive !== false));
      }
    });

    return () => {
      unsubscribe();
      unsubCategories();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (product.isActive === false) return false;
        if (selectedCategory !== 'all' && product.categoryId !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = product.name?.toLowerCase().includes(q);
          const matchesCategory = product.categoryName?.toLowerCase().includes(q);
          const matchesMaterial = product.materials?.some((m) => m.toLowerCase().includes(q));
          if (!matchesName && !matchesCategory && !matchesMaterial) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }, [products, selectedCategory, searchQuery]);

  const handleCategorySelect = (slug: string) => {
    if (slug === 'all') {
      searchParams.delete('cat');
    } else {
      searchParams.set('cat', slug);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchQuery('');
    searchParams.delete('cat');
    searchParams.delete('q');
    setSearchParams(searchParams);
  };

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-7 sm:py-10">
      <div className="max-w-[1200px] w-[92%] mx-auto px-1 sm:px-4">
        {/* Header & Simple Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h1 className="font-serif text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-[#29231E]">
            Browse Furniture
          </h1>

          <div className="flex items-center gap-2 bg-white border border-[#E7E1D9] rounded-full px-4 py-2.5 w-full sm:max-w-[300px] min-h-[44px] focus-within:border-[#68452D]">
            <Search className="w-4 h-4 text-[#A17A58] shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sofas, beds, tables..."
              className="w-full bg-transparent text-[16px] sm:text-[14px] text-[#29231E] placeholder-[#9B938B] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#77716A] hover:text-[#68452D] p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-7 no-scrollbar">
          <button
            type="button"
            onClick={() => handleCategorySelect('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-medium border transition-colors whitespace-nowrap min-h-[38px] ${
              selectedCategory === 'all'
                ? 'bg-[#68452D] text-white border-[#68452D]'
                : 'bg-white text-[#77716A] border-[#E7E1D9] hover:text-[#68452D] hover:border-[#A17A58]'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.categoryId}
              type="button"
              onClick={() => handleCategorySelect(cat.slug)}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-medium border transition-colors whitespace-nowrap min-h-[38px] ${
                selectedCategory === cat.slug
                  ? 'bg-[#68452D] text-white border-[#68452D]'
                  : 'bg-white text-[#77716A] border-[#E7E1D9] hover:text-[#68452D] hover:border-[#A17A58]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-[16px] border border-[#E7E1D9] overflow-hidden"
              >
                <div className="aspect-[4/3] bg-[#F0ECE5]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-[#F0ECE5] rounded" />
                  <div className="h-3.5 w-1/2 bg-[#F0ECE5] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white rounded-[18px] border border-[#E7E1D9] space-y-4">
            <h2 className="font-serif text-[22px] font-bold text-[#29231E]">
              No matching furniture found
            </h2>
            <p className="text-[15px] text-[#77716A] max-w-md mx-auto">
              Want something specific made to your room size? Upload a photo and tell us what you need.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-2.5 rounded-full border border-[#68452D] text-[#68452D] text-[14px] font-semibold hover:bg-[#F0ECE5] min-h-[44px]"
              >
                Show All Furniture
              </button>
              <Link
                to="/upload-idea"
                className="px-6 py-2.5 rounded-full bg-[#68452D] text-white text-[14px] font-semibold hover:bg-[#523724] min-h-[44px] inline-flex items-center"
              >
                Upload Your Design
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
