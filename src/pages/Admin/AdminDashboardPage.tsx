/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit3,
  Upload,
  X,
  Search,
  LogOut,
  Phone,
  MessageCircle,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import {
  subscribeProducts,
  subscribeCategories,
  subscribeAllIdeaRequests,
  subscribeAllOrders,
  subscribeStoreSettings,
  saveStoreSettings,
  DEFAULT_STORE_SETTINGS,
  addProduct,
  updateProduct,
  removeProduct,
  updateCustomIdeaStatus,
  updateOrderStatusWithNote,
  updateOrderPaymentStatus,
  createManualOrder,
  saveCategory,
  deleteCategory,
  seedDefaultCategories,
  seedDefaultProducts,
  CustomIdeaSubmission,
} from '../../services/firebase/firestore';
import { uploadProductImage } from '../../services/firebase/storage';
import {
  Product,
  Order,
  Category,
  StoreSettings,
  MeasurementUnit,
  ProductType,
} from '../../types';

type AdminTab = 'products' | 'enquiries' | 'orders' | 'settings';

export const AdminDashboardPage: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    isLoading: authLoading,
    signInWithGoogle,
    logout,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [enquiries, setEnquiries] = useState<CustomIdeaSubmission[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const [authError, setAuthError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Product Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: 'sofas',
    price: '',
    startingPrice: false,
    description: '',
    width: '180',
    depth: '85',
    height: '78',
    unit: 'cm' as MeasurementUnit,
    materialsText: 'CP Teak, Natural Linen',
    productType: 'made_to_order' as ProductType,
    isActive: true,
    isFeatured: false,
    images: [] as string[],
  });
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Enquiry Update Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<CustomIdeaSubmission | null>(null);
  const [enquiryStatusInput, setEnquiryStatusInput] =
    useState<CustomIdeaSubmission['status']>('under_review');
  const [enquiryQuoteInput, setEnquiryQuoteInput] = useState('');
  const [enquiryNotesInput, setEnquiryNotesInput] = useState('');
  const [savingEnquiry, setSavingEnquiry] = useState(false);

  // Order Update & Create Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusInput, setOrderStatusInput] = useState<Order['orderStatus']>('confirmed');
  const [orderPaymentInput, setOrderPaymentInput] =
    useState<Order['paymentStatus']>('pending_confirmation');
  const [orderNoteInput, setOrderNoteInput] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    itemName: '',
    amount: '',
    address: '',
    note: '',
  });

  // Settings & Categories
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Attach Firestore listeners strictly after server-backed admin verification succeeds
  useEffect(() => {
    if (authLoading || !isAuthenticated || !isAdmin || !user?.uid) {
      return;
    }

    const unsubProducts = subscribeProducts((data) => setProducts(data));
    const unsubCategories = subscribeCategories((data) => setCategories(data));
    const unsubRequests = subscribeAllIdeaRequests((data) => {
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setEnquiries(sorted);
    });
    const unsubOrders = subscribeAllOrders((data) => setOrders(data));
    const unsubSettings = subscribeStoreSettings((s) => {
      setStoreSettings(s);
      setSettingsForm(s);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubRequests();
      unsubOrders();
      unsubSettings();
    };
  }, [authLoading, isAuthenticated, isAdmin, user?.uid]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#29231E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[13px] text-[#77716A]">Verifying administrator access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-4">
        <div className="max-w-[400px] w-full bg-white rounded-[20px] border border-[#E7E1D9] p-8 text-center space-y-5 shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
          <img src="/assets/logo.png" alt="Charbhuja" className="h-10 w-auto mx-auto" />
          <div className="space-y-1.5">
            <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#29231E]">
              {isAuthenticated ? 'Administrator Access Required' : 'Staff Admin Portal'}
            </h1>
            <p className="text-[14px] text-[#77716A] leading-relaxed">
              {isAuthenticated
                ? `Signed in as ${user?.email || 'guest'}. Only verified Charbhuja staff can manage products, enquiries, orders, and settings.`
                : 'Sign in with your authorized Google account to manage Charbhuja Furniture.'}
            </p>
          </div>

          {authError && (
            <p className="p-3 rounded-[10px] bg-red-50 text-[13px] text-[#c0392b]">{authError}</p>
          )}

          {!isAuthenticated ? (
            <button
              type="button"
              onClick={async () => {
                setAuthError(null);
                try {
                  await signInWithGoogle();
                } catch (err: any) {
                  setAuthError(err?.message || 'Google sign-in could not be completed.');
                }
              }}
              className="w-full min-h-[46px] py-3 px-4 rounded-full bg-[#68452D] text-white text-[14px] font-semibold hover:opacity-85"
            >
              Sign in with Google
            </button>
          ) : (
            <button
              type="button"
              onClick={() => logout()}
              className="w-full min-h-[46px] py-3 px-4 rounded-full border border-[#E7E1D9] text-[#29231E] text-[14px] font-medium hover:bg-black/[0.03]"
            >
              Sign out & Switch Account
            </button>
          )}

          <Link to="/" className="block text-[13px] text-[#77716A] hover:text-[#29231E]">
            ← Return to Website
          </Link>
        </div>
      </div>
    );
  }

  // ── HANDLERS: PRODUCTS ────────────────────────────────────────
  const openCreateProduct = () => {
    setProductModalMode('create');
    setEditingProductId(null);
    setProductForm({
      name: '',
      categoryId: categories[0]?.slug || 'sofas',
      price: '',
      startingPrice: false,
      description: '',
      width: '180',
      depth: '85',
      height: '78',
      unit: 'cm',
      materialsText: 'CP Teak, Natural Linen',
      productType: 'made_to_order',
      isActive: true,
      isFeatured: false,
      images: [],
    });
    setProductModalOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setProductModalMode('edit');
    setEditingProductId(p.productId);
    setProductForm({
      name: p.name,
      categoryId: p.categoryId,
      price: p.price ? String(p.price) : '',
      startingPrice: Boolean(p.startingPrice),
      description: p.description || '',
      width: String(p.dimensions?.width || 180),
      depth: String(p.dimensions?.depth || 85),
      height: String(p.dimensions?.height || 78),
      unit: p.dimensions?.unit || 'cm',
      materialsText: (p.materials || []).join(', '),
      productType: p.productType || 'made_to_order',
      isActive: p.isActive !== false,
      isFeatured: Boolean(p.isFeatured),
      images: p.images || [],
    });
    setProductModalOpen(true);
  };

  const handleProductFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const targetId = editingProductId || `prod_${Date.now()}`;
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadProductImage(file, targetId);
        newUrls.push(url);
      }
      setProductForm((prev) => ({ ...prev, images: [...prev.images, ...newUrls] }));
    } catch (err: any) {
      showNotice('error', err?.message || 'Could not upload image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      showNotice('error', 'Product name is required.');
      return;
    }
    setSavingProduct(true);
    try {
      const cat = categories.find((c) => c.slug === productForm.categoryId);
      const parsedPrice = Number(productForm.price) || 0;
      const materials = productForm.materialsText
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const payload: Product = {
        productId: editingProductId || `prod_${Date.now()}`,
        name: productForm.name.trim(),
        slug: productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: productForm.description.trim() || 'Handcrafted solid wood furniture.',
        categoryId: productForm.categoryId,
        categoryName: cat ? cat.name : productForm.categoryId,
        price: parsedPrice,
        startingPrice: productForm.startingPrice,
        dimensions: {
          width: Number(productForm.width) || 180,
          depth: Number(productForm.depth) || 85,
          height: Number(productForm.height) || 78,
          unit: productForm.unit,
        },
        materials: materials.length > 0 ? materials : ['Solid Hardwood'],
        finishes: ['Natural Satin'],
        productType: productForm.productType,
        isActive: productForm.isActive,
        isFeatured: productForm.isFeatured,
        inStock: true,
        images: productForm.images,
      };

      if (productModalMode === 'create') {
        await addProduct(payload);
        showNotice('success', `Added "${payload.name}" to catalog.`);
      } else if (editingProductId) {
        await updateProduct(editingProductId, payload);
        showNotice('success', `Updated "${payload.name}".`);
      }
      setProductModalOpen(false);
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleProductVisibility = async (p: Product) => {
    try {
      await updateProduct(p.productId, { isActive: !p.isActive });
      showNotice('success', `"${p.name}" is now ${!p.isActive ? 'visible' : 'hidden'}.`);
    } catch (err: any) {
      showNotice('error', err?.message || 'Could not update product visibility.');
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await removeProduct(deletingProduct.productId);
      showNotice('success', `Deleted "${deletingProduct.name}".`);
      setDeletingProduct(null);
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to delete product.');
    }
  };

  // ── HANDLERS: ENQUIRIES ───────────────────────────────────────
  const openEnquiryModal = (req: CustomIdeaSubmission) => {
    setSelectedEnquiry(req);
    setEnquiryStatusInput(req.status);
    setEnquiryQuoteInput(req.quotedAmount || '');
    setEnquiryNotesInput(req.internalNotes || '');
  };

  const handleSaveEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setSavingEnquiry(true);
    try {
      await updateCustomIdeaStatus(
        selectedEnquiry.requestId,
        enquiryStatusInput,
        enquiryQuoteInput.trim() || undefined,
        enquiryNotesInput.trim() || undefined
      );
      showNotice('success', `Updated enquiry #${selectedEnquiry.requestId}.`);
      setSelectedEnquiry(null);
    } catch (err: any) {
      showNotice('error', err?.message || 'Could not update enquiry.');
    } finally {
      setSavingEnquiry(false);
    }
  };

  const handleConvertEnquiryToOrder = async (req: CustomIdeaSubmission) => {
    const numericPrice = parseInt((req.quotedAmount || req.estimatedBudget || '0').replace(/[^\d]/g, ''), 10) || 0;
    try {
      const order = await createManualOrder({
        customerName: req.customerName,
        customerPhone: req.customerPhone,
        customerEmail: req.customerEmail,
        itemName: req.productName || req.description.slice(0, 60) || 'Custom Furniture Piece',
        amount: numericPrice,
        note: `Created from enquiry #${req.requestId}`,
        productId: req.productId,
      });
      await updateCustomIdeaStatus(req.requestId, 'in_production');
      showNotice('success', `Order #${order.orderNumber} created for ${req.customerName}.`);
      setSelectedEnquiry(null);
      setActiveTab('orders');
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to convert enquiry into order.');
    }
  };

  // ── HANDLERS: ORDERS ──────────────────────────────────────────
  const openOrderModal = (ord: Order) => {
    setSelectedOrder(ord);
    setOrderStatusInput(ord.orderStatus);
    setOrderPaymentInput(ord.paymentStatus);
    setOrderNoteInput('');
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSavingOrder(true);
    try {
      await updateOrderStatusWithNote(
        selectedOrder.orderId,
        orderStatusInput,
        orderNoteInput.trim() || undefined
      );
      if (orderPaymentInput !== selectedOrder.paymentStatus) {
        await updateOrderPaymentStatus(selectedOrder.orderId, orderPaymentInput);
      }
      showNotice('success', `Updated order #${selectedOrder.orderNumber}.`);
      setSelectedOrder(null);
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to update order.');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.customerName.trim() || !newOrderForm.customerPhone.trim() || !newOrderForm.itemName.trim()) {
      showNotice('error', 'Name, phone number, and furniture item are required.');
      return;
    }
    setSavingOrder(true);
    try {
      const order = await createManualOrder({
        customerName: newOrderForm.customerName,
        customerPhone: newOrderForm.customerPhone,
        itemName: newOrderForm.itemName,
        amount: Number(newOrderForm.amount) || 0,
        address: newOrderForm.address,
        note: newOrderForm.note,
      });
      showNotice('success', `Recorded order #${order.orderNumber}.`);
      setNewOrderModalOpen(false);
      setNewOrderForm({ customerName: '', customerPhone: '', itemName: '', amount: '', address: '', note: '' });
    } catch (err: any) {
      showNotice('error', err?.message || 'Could not record order.');
    } finally {
      setSavingOrder(false);
    }
  };

  // ── HANDLERS: SETTINGS & CATEGORIES ───────────────────────────
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveStoreSettings(settingsForm);
      showNotice('success', 'Storefront contact settings saved.');
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '');
      await saveCategory({
        categoryId: slug || `cat_${Date.now()}`,
        name: newCategoryName.trim(),
        slug: slug || `cat_${Date.now()}`,
        isActive: true,
        sortOrder: categories.length + 1,
      });
      setNewCategoryName('');
      showNotice('success', `Added category "${newCategoryName.trim()}".`);
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to add category.');
    } finally {
      setSavingCategory(false);
    }
  };

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    if (productCategoryFilter !== 'all' && p.categoryId !== productCategoryFilter) return false;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredEnquiries = enquiries.filter((r) =>
    enquiryStatusFilter === 'all' ? true : r.status === enquiryStatusFilter
  );

  const filteredOrders = orders.filter((o) => {
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerSnapshot?.name || o.customerName || '').toLowerCase().includes(q) ||
      (o.customerSnapshot?.phoneNumber || o.customerPhone || '').includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#29231E]">
      {/* Sticky Admin Header */}
      <header className="sticky top-0 z-40 h-14 bg-[#F8F6F2]/85 backdrop-blur-xl border-b border-[#E7E1D9]">
        <div className="max-w-[1200px] w-[92%] mx-auto h-full px-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/assets/logo.png" alt="Charbhuja" className="h-7 w-auto" />
            <span className="text-[17px] font-semibold tracking-[-0.02em]">
              Charbhuja Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-1.5 rounded-full bg-white border border-[#E7E1D9] text-[13px] font-medium text-[#29231E] hover:bg-black/[0.03]"
            >
              View Website
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E7E1D9] text-[13px] font-medium text-[#77716A] hover:text-[#29231E]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] w-[92%] mx-auto py-8 px-2 space-y-6">
        {notice && (
          <div
            className={`px-4 py-3 rounded-[12px] border text-[13px] flex items-center justify-between ${
              notice.type === 'success'
                ? 'bg-white border-[#E7E1D9] text-[#29231E]'
                : 'bg-red-50 border-red-200 text-[#c0392b]'
            }`}
          >
            <span className="font-medium">{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} className="p-1 opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Admin Tabs: Products, Enquiries, Orders, Settings */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              { id: 'products', label: `Products (${products.length})` },
              { id: 'enquiries', label: `Enquiries (${enquiries.length})` },
              { id: 'orders', label: `Orders (${orders.length})` },
              { id: 'settings', label: 'Settings' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors min-h-[40px] ${
                activeTab === tab.id
                  ? 'bg-[#68452D] text-white'
                  : 'bg-white text-[#77716A] border border-[#E7E1D9] hover:text-[#29231E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: PRODUCTS ─────────────────────────────────── */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            <div className="bg-white border border-[#E7E1D9] rounded-[16px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="flex items-center gap-2 bg-[#F8F6F2] border border-[#E7E1D9] rounded-full px-3.5 py-2 w-full sm:w-64">
                  <Search className="w-4 h-4 text-[#A17A58]" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="bg-transparent text-[14px] text-[#29231E] w-full focus:outline-none"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-[#F8F6F2] border border-[#E7E1D9] rounded-full px-4 py-2 text-[14px] text-[#29231E] focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    await seedDefaultProducts();
                    showNotice('success', 'Starter furniture synced to Firestore.');
                  }}
                  className="px-4 py-2.5 rounded-full border border-[#E7E1D9] text-[13px] font-medium text-[#29231E] hover:bg-black/[0.03]"
                >
                  Sync Defaults
                </button>
                <button
                  type="button"
                  onClick={openCreateProduct}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#68452D] text-white text-[14px] font-medium hover:opacity-85"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-[#E7E1D9] rounded-[16px] p-12 text-center text-[14px] text-[#77716A]">
                No products match your filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((p) => (
                  <div
                    key={p.productId}
                    className="bg-white border border-[#E7E1D9] rounded-[16px] overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[4/3] bg-[#F8F6F2] overflow-hidden">
                        <img
                          src={p.images?.[0] || '/assets/logo.png'}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[12px] text-[#77716A]">
                          <span>{p.categoryName}</span>
                          <span>{p.isActive !== false ? 'Visible' : 'Hidden'}</span>
                        </div>
                        <h3 className="text-[15px] font-semibold text-[#29231E] line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-[14px] font-semibold text-[#29231E] tabular-nums">
                          {p.price > 0 ? `₹${p.price.toLocaleString('en-IN')}` : 'Price on enquiry'}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-[#E7E1D9] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleProductVisibility(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E7E1D9] text-[12px] font-medium text-[#29231E] hover:bg-[#F8F6F2]"
                      >
                        {p.isActive !== false ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Shown</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditProduct(p)}
                          className="p-2 rounded-full border border-[#E7E1D9] text-[#29231E] hover:bg-[#F8F6F2]"
                          aria-label={`Edit ${p.name}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProduct(p)}
                          className="p-2 rounded-full border border-red-200 text-[#c0392b] hover:bg-red-50"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: ENQUIRIES ────────────────────────────────── */}
        {activeTab === 'enquiries' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E7E1D9] rounded-[16px] p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold text-[#29231E]">
                  Customer Enquiries ({filteredEnquiries.length})
                </h2>
                <p className="text-[13px] text-[#77716A]">
                  Submissions from Upload Yours and Product Enquiry forms.
                </p>
              </div>
              <select
                value={enquiryStatusFilter}
                onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                className="bg-[#F8F6F2] border border-[#E7E1D9] rounded-full px-4 py-2 text-[13px] text-[#29231E] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">New / Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="quote_sent">Quote Shared</option>
                <option value="in_production">In Production</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {filteredEnquiries.length === 0 ? (
              <div className="bg-white border border-[#E7E1D9] rounded-[16px] p-12 text-center text-[14px] text-[#77716A]">
                No customer enquiries yet.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEnquiries.map((req) => {
                  const cleanPhone = (req.customerPhone || '').replace(/[^\d]/g, '');
                  return (
                    <div
                      key={req.requestId}
                      className="bg-white border border-[#E7E1D9] rounded-[16px] p-5 flex flex-col md:flex-row gap-5 items-start justify-between"
                    >
                      <div className="flex gap-4 items-start flex-1 min-w-0">
                        {req.imageUrl ? (
                          <img
                            src={req.imageUrl}
                            alt={req.customerName}
                            className="w-20 h-20 rounded-[12px] object-cover bg-[#F8F6F2] shrink-0 border border-[#E7E1D9]"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-[12px] bg-[#F8F6F2] flex items-center justify-center shrink-0 text-[#A17A58]">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#77716A]">
                            <span className="font-semibold text-[#29231E]">#{req.requestId}</span>
                            <span>·</span>
                            <span className="capitalize">{req.status.replace('_', ' ')}</span>
                            <span>·</span>
                            <span>{new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                          <h3 className="text-[16px] font-semibold text-[#29231E]">
                            {req.customerName} — {req.customerPhone}
                          </h3>
                          {req.productName && (
                            <p className="text-[13px] font-medium text-[#29231E]">
                              Product: {req.productName}
                            </p>
                          )}
                          <p className="text-[14px] text-[#77716A] leading-relaxed">
                            {req.description}
                          </p>
                          {req.roomDimensions && (
                            <p className="text-[13px] text-[#29231E]">
                              Dimensions: {req.roomDimensions}
                            </p>
                          )}
                          {req.quotedAmount && (
                            <p className="text-[13px] font-semibold text-[#29231E]">
                              Quoted: {req.quotedAmount}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                        <a
                          href={`tel:${req.customerPhone}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E7E1D9] text-[13px] font-medium text-[#29231E] hover:bg-[#F8F6F2]"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E7E1D9] text-[13px] font-medium text-[#29231E] hover:bg-[#F8F6F2]"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => openEnquiryModal(req)}
                          className="px-4 py-2 rounded-full bg-[#68452D] text-white text-[13px] font-medium hover:opacity-85"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: ORDERS ───────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E7E1D9] rounded-[16px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-[#F8F6F2] border border-[#E7E1D9] rounded-full px-3.5 py-2 w-full sm:w-72">
                <Search className="w-4 h-4 text-[#A17A58]" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search orders by name, phone, #..."
                  className="bg-transparent text-[14px] text-[#29231E] w-full focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setNewOrderModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#68452D] text-white text-[14px] font-medium hover:opacity-85 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Record Order</span>
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-[#E7E1D9] rounded-[16px] p-12 text-center text-[14px] text-[#77716A]">
                No orders recorded yet.
              </div>
            ) : (
              <div className="bg-white border border-[#E7E1D9] rounded-[16px] overflow-hidden divide-y divide-[#E7E1D9]">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#77716A]">
                        <span className="font-semibold text-[#29231E]">#{ord.orderNumber}</span>
                        <span>·</span>
                        <span className="capitalize">{ord.orderStatus}</span>
                        <span>·</span>
                        <span className="capitalize">{ord.paymentStatus.replace('_', ' ')}</span>
                      </div>
                      <h3 className="text-[15px] font-semibold text-[#29231E]">
                        {ord.customerSnapshot?.name || ord.customerName} (
                        {ord.customerSnapshot?.phoneNumber || ord.customerPhone})
                      </h3>
                      <p className="text-[13px] text-[#77716A]">
                        {ord.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <span className="text-[16px] font-semibold text-[#29231E] tabular-nums">
                        ₹{ord.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => openOrderModal(ord)}
                        className="px-4 py-2 rounded-full bg-[#68452D] text-white text-[13px] font-medium hover:opacity-85"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: SETTINGS ─────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Business Contact Settings */}
            <form
              onSubmit={handleSaveSettings}
              className="lg:col-span-7 bg-white border border-[#E7E1D9] rounded-[16px] p-6 space-y-4"
            >
              <div>
                <h2 className="text-[18px] font-semibold text-[#29231E]">
                  Contact & Storefront Settings
                </h2>
                <p className="text-[13px] text-[#77716A]">
                  These details appear across the homepage Contact section, Call Us buttons, and Footer.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#77716A] mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm.businessName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, businessName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px] text-[14px] text-[#29231E]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#77716A] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px] text-[14px] text-[#29231E]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#77716A] mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={settingsForm.whatsapp}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, whatsapp: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px] text-[14px] text-[#29231E]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#77716A] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px] text-[14px] text-[#29231E]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-medium text-[#77716A] mb-1">
                    Business Address
                  </label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px] text-[14px] text-[#29231E]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-medium text-[#77716A] mb-1">
                    Workshop Hours
                  </label>
                  <input
                    type="text"
                    value={settingsForm.hours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hours: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px] text-[14px] text-[#29231E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-full bg-[#68452D] text-white text-[14px] font-medium hover:opacity-85 disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Contact Settings'}
              </button>
            </form>

            {/* Categories Manager */}
            <div className="lg:col-span-5 bg-white border border-[#E7E1D9] rounded-[16px] p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#29231E]">Categories</h2>
                  <p className="text-[13px] text-[#77716A]">Used in home strip and browse filters.</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await seedDefaultCategories();
                    showNotice('success', 'Default categories synced.');
                  }}
                  className="px-3 py-1.5 rounded-full border border-[#E7E1D9] text-[12px] font-medium text-[#29231E]"
                >
                  Sync Defaults
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 px-3.5 py-2 bg-[#F8F6F2] border border-[#E7E1D9] rounded-full text-[14px] text-[#29231E]"
                />
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-4 py-2 rounded-full bg-[#68452D] text-white text-[13px] font-medium"
                >
                  Add
                </button>
              </form>

              <div className="divide-y divide-[#E7E1D9] max-h-80 overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat.categoryId} className="py-2.5 flex items-center justify-between text-[14px]">
                    <span className={cat.isActive !== false ? 'text-[#29231E]' : 'text-[#A17A58] line-through'}>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveCategory({ ...cat, isActive: !cat.isActive })}
                        className="text-[12px] text-[#77716A] hover:text-[#29231E]"
                      >
                        {cat.isActive !== false ? 'Hide' : 'Show'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat.categoryId)}
                        className="text-[12px] text-[#c0392b] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: PRODUCT CREATE / EDIT ──────────────────────── */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-[20px] border border-[#E7E1D9] max-w-xl w-full p-6 sm:p-7 space-y-4 my-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[19px] font-semibold text-[#29231E]">
                {productModalMode === 'create' ? 'Add Furniture Product' : 'Edit Product'}
              </h3>
              <button type="button" onClick={() => setProductModalOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[14px]">
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-[#77716A] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#77716A] mb-1">Category</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#77716A] mb-1">
                  Price in ₹ (optional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="0 for enquiry pricing"
                  className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-[#77716A] mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
                />
              </div>

              <div className="sm:col-span-2 grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] text-[#77716A] mb-1">Width</label>
                  <input
                    type="number"
                    value={productForm.width}
                    onChange={(e) => setProductForm({ ...productForm, width: e.target.value })}
                    className="w-full px-2.5 py-2 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#77716A] mb-1">Depth</label>
                  <input
                    type="number"
                    value={productForm.depth}
                    onChange={(e) => setProductForm({ ...productForm, depth: e.target.value })}
                    className="w-full px-2.5 py-2 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#77716A] mb-1">Height</label>
                  <input
                    type="number"
                    value={productForm.height}
                    onChange={(e) => setProductForm({ ...productForm, height: e.target.value })}
                    className="w-full px-2.5 py-2 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#77716A] mb-1">Unit</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) =>
                      setProductForm({ ...productForm, unit: e.target.value as MeasurementUnit })
                    }
                    className="w-full px-2 py-2 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[8px]"
                  >
                    <option value="cm">cm</option>
                    <option value="inches">inches</option>
                    <option value="ft">ft</option>
                    <option value="mm">mm</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-[#77716A] mb-1">
                  Materials (comma separated)
                </label>
                <input
                  type="text"
                  value={productForm.materialsText}
                  onChange={(e) =>
                    setProductForm({ ...productForm, materialsText: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
                />
              </div>

              {/* Photo Upload */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-[12px] font-medium text-[#77716A]">
                  Photographs
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleProductFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full py-4 border border-dashed border-black/20 rounded-[12px] bg-[#F8F6F2] flex items-center justify-center gap-2 text-[13px] font-medium"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingImage ? 'Uploading photos...' : 'Upload Product Photos'}</span>
                </button>

                {productForm.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {productForm.images.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-[8px] overflow-hidden border border-[#E7E1D9]">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setProductForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/75 text-white flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-[13px] text-[#29231E]">
                <input
                  type="checkbox"
                  checked={productForm.startingPrice}
                  onChange={(e) =>
                    setProductForm({ ...productForm, startingPrice: e.target.checked })
                  }
                />
                <span>Display as "Starting from ₹..."</span>
              </label>

              <label className="flex items-center gap-2 text-[13px] text-[#29231E]">
                <input
                  type="checkbox"
                  checked={productForm.isActive}
                  onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                />
                <span>Visible on website</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[#E7E1D9] text-[13px] font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="px-5 py-2 rounded-full bg-[#68452D] text-white text-[13px] font-medium"
              >
                {savingProduct ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: DELETE PRODUCT CONFIRMATION ────────────────── */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] max-w-sm w-full p-6 space-y-4">
            <h3 className="text-[18px] font-semibold text-[#29231E]">
              Delete "{deletingProduct.name}"?
            </h3>
            <p className="text-[14px] text-[#77716A]">
              This will permanently remove the product from Firestore.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 rounded-full border border-[#E7E1D9] text-[13px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                className="px-4 py-2 rounded-full bg-[#c0392b] text-white text-[13px] font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ENQUIRY INSPECTOR ──────────────────────────── */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEnquiry}
            className="bg-white rounded-[20px] max-w-lg w-full p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#29231E]">
                Enquiry #{selectedEnquiry.requestId}
              </h3>
              <button type="button" onClick={() => setSelectedEnquiry(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#F8F6F2] space-y-1 text-[13px]">
              <p className="font-semibold text-[#29231E]">
                {selectedEnquiry.customerName} · {selectedEnquiry.customerPhone}
              </p>
              <p className="text-[#77716A]">{selectedEnquiry.description}</p>
              {selectedEnquiry.roomDimensions && (
                <p className="text-[#29231E]">Dimensions: {selectedEnquiry.roomDimensions}</p>
              )}
            </div>

            {selectedEnquiry.attachments && selectedEnquiry.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedEnquiry.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8F6F2] border border-[#E7E1D9] text-[12px] text-[#29231E]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{att.name}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="space-y-3 text-[14px]">
              <div>
                <label className="block text-[12px] font-medium text-[#77716A] mb-1">Status</label>
                <select
                  value={enquiryStatusInput}
                  onChange={(e) =>
                    setEnquiryStatusInput(e.target.value as CustomIdeaSubmission['status'])
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="quote_sent">Quote Sent</option>
                  <option value="approved">Approved</option>
                  <option value="in_production">In Production</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#77716A] mb-1">
                  Quoted Estimate (₹)
                </label>
                <input
                  type="text"
                  value={enquiryQuoteInput}
                  onChange={(e) => setEnquiryQuoteInput(e.target.value)}
                  placeholder="e.g. ₹48,000"
                  className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#77716A] mb-1">
                  Workshop Notes
                </label>
                <textarea
                  rows={2}
                  value={enquiryNotesInput}
                  onChange={(e) => setEnquiryNotesInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleConvertEnquiryToOrder(selectedEnquiry)}
                className="px-4 py-2 rounded-full border border-[#29231E] text-[13px] font-medium text-[#29231E]"
              >
                Convert to Order
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-4 py-2 rounded-full border border-[#E7E1D9] text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEnquiry}
                  className="px-5 py-2 rounded-full bg-[#68452D] text-white text-[13px] font-medium"
                >
                  {savingEnquiry ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: ORDER UPDATE ───────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveOrder}
            className="bg-white rounded-[20px] max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#29231E]">
                Order #{selectedOrder.orderNumber}
              </h3>
              <button type="button" onClick={() => setSelectedOrder(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-[14px]">
              <div>
                <label className="block text-[12px] font-medium text-[#77716A] mb-1">
                  Order Status
                </label>
                <select
                  value={orderStatusInput}
                  onChange={(e) => setOrderStatusInput(e.target.value as Order['orderStatus'])}
                  className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">In Workshop</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#77716A] mb-1">
                  Payment Status
                </label>
                <select
                  value={orderPaymentInput}
                  onChange={(e) =>
                    setOrderPaymentInput(e.target.value as Order['paymentStatus'])
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
                >
                  <option value="pending_confirmation">Pending Confirmation</option>
                  <option value="unpaid">Unpaid / On Delivery</option>
                  <option value="paid">Paid / Settled</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#77716A] mb-1">
                  Workshop Note
                </label>
                <textarea
                  rows={2}
                  value={orderNoteInput}
                  onChange={(e) => setOrderNoteInput(e.target.value)}
                  placeholder="Optional update note"
                  className="w-full px-3.5 py-2 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-full border border-[#E7E1D9] text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingOrder}
                className="px-5 py-2 rounded-full bg-[#68452D] text-white text-[13px] font-medium"
              >
                {savingOrder ? 'Saving...' : 'Save Order'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: RECORD NEW ORDER ───────────────────────────── */}
      {newOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateManualOrder}
            className="bg-white rounded-[20px] max-w-md w-full p-6 space-y-3.5 text-[14px]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#29231E]">Record New Order</h3>
              <button type="button" onClick={() => setNewOrderModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Customer Name *"
              value={newOrderForm.customerName}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
            />
            <input
              type="tel"
              required
              placeholder="Phone Number *"
              value={newOrderForm.customerPhone}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, customerPhone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
            />
            <input
              type="text"
              required
              placeholder="Furniture Item / Description *"
              value={newOrderForm.itemName}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, itemName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
            />
            <input
              type="number"
              min={0}
              placeholder="Agreed Amount (₹)"
              value={newOrderForm.amount}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, amount: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
            />
            <input
              type="text"
              placeholder="Delivery Address (optional)"
              value={newOrderForm.address}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E7E1D9] rounded-[10px]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewOrderModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[#E7E1D9] text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingOrder}
                className="px-5 py-2 rounded-full bg-[#68452D] text-white text-[13px] font-medium"
              >
                {savingOrder ? 'Saving...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
