# DEVELOPMENT LOG — CHARBHUJA FURNITURE

## Current Status
- **Phases 1–6:** COMPLETED (UI/Design System, Firebase Auth/Firestore/Storage Security, Product Catalogue CRUD, Bespoke Custom Design & Quotations, Persistent Cart & Validated Order Flow, Functional Server-Backed Admin Dashboard)

---

## 1. Phase 3 Overview & Achievements
In Phase 3, we implemented the complete dynamic product catalogue powered by Cloud Firestore and Firebase Storage:
1. **Dynamic Product Details Page (`/product/:productId`)**:
   - Live loading via `getProductById(productId)` with fallback to static initial dataset.
   - Interactive multi-image gallery with thumbnail strip, prev/next controls, and fullscreen lightbox preview.
   - Specifications module (Width × Depth × Height, materials/finishes chips, quantity stepper, project collection bookmarking).
   - "Need Custom Dimensions or Pinterest Idea?" callout directly routing to `/upload-idea?title=...`.
2. **Real-Time Reactive Catalogue Browsing (`/browse`)**:
   - Connected directly to `subscribeProducts` and `subscribeCategories` Firestore listeners.
   - Category filtering chips, full-text search, sorting, and filter reset.
3. **Homepage Live Trending & Category Sync (`/`)**:
   - Homepage featured pieces and architectural category strip react in real time to Firestore updates.
4. **Complete Product CRUD & Multi-Image Upload (`/admin`)**:
   - Create, Edit, Delete, quick `Trending` & `Published/Hidden` toggles, multi-image Storage uploads via `uploadProductImage`, and strict field validation.

---

## 2. Phase 4 Overview & Achievements
1. **Multi-File Drag-and-Drop Custom Design Uploads (`/upload-idea`)**:
   - Supports JPG, PNG, WebP images, and PDF architectural floor plans up to 15 MB via `uploadCustomDesignFile`.
   - Ties custom ideas directly to customer room project collections (`/projects`), timber preference, room dimensions, and measurement visits.
2. **Customer Request Status Tracking & Quotation Acceptance (`/account`)**:
   - Real-time tracking across 8 workflow milestones and direct "Accept & Order Piece" conversion into the cart with quoted price.
3. **Admin Review & Quotation Formulation (`/admin`)**:
   - Custom inquiry board with status filters, client contact/WhatsApp actions, attachment inspector, and workshop quotation formulation modal.

---

## 3. Phase 5 Overview & Achievements
1. **Persistent Customer Cart & Quantity Editing**:
   - Zustand cart store (`useCartStore`) with editable quantities, line removal, finish/material selections, and custom approved quotation items.
2. **Checkout, Saved Address Book & Trusted Order Creation (`/checkout`)**:
   - Saved delivery address selector backed by `users/{uid}.addresses` in Firestore (`saveUserAddress`, `deleteUserAddress`, `setDefaultUserAddress`).
   - Enforces Google sign-in before order submission to align strictly with Firestore owner-scoped security rules (`isSignedIn() && incoming().userId == request.auth.uid`).
   - `createValidatedOrder` re-reads trusted prices from Firestore `products` / approved `customRequests`, computes delivery charges and totals server-equivalent, creates immutable `OrderItem` snapshots, and initiates manual order confirmation (`paymentStatus: 'pending_confirmation'`, Razorpay-ready model).
3. **Live Order Tracking (`/orders/:orderId` & `/account`)**:
   - Real-time `subscribeOrderById` timeline tracking workshop milestones and customer cancellation support.

---

## 4. Phase 6 Overview & Achievements
1. **Server-Backed Admin Permissions (Zero Client Bypasses)**:
   - Removed all client-side demo bypasses (`setDemoAdmin`, `admin_sudhanshu`) from `useAuthStore.ts`, `LoginPage.tsx`, and `AdminDashboardPage.tsx`.
   - Updated `auth.ts` (`verifyServerAdminPermission`, `isUserAdmin`) to verify real Firebase Authentication (`emailVerified === true`) against Firestore `/admins/{uid}` (with automatic `/admins/{uid}` provisioning when the verified owner `sudhanshujangid143@gmail.com` signs in via Google).
   - Hardened `firestore.rules` & `storage.rules` (`email_verified == true` requirement, restricted `/admins/{adminId}` access, default-deny catch-all) and deployed rules via Firebase RPC.
   - Gated all Admin `onSnapshot` listeners in `AdminDashboardPage.tsx` on `(authLoading || !isAuthenticated || !isAdmin || !user?.uid)` so non-admin visits never trigger unauthorized Firestore reads.
2. **Real Firestore Categories CRUD (`/categories/{categoryId}`)**:
   - Added `Category` schema to `firebase-blueprint.json`, `firestore.rules`, and `firestore.ts` (`subscribeCategories`, `saveCategory`, `deleteCategory`, `seedDefaultCategories`).
   - Added full Categories Management tab & Create/Edit/Delete/Visibility modals in `AdminDashboardPage.tsx`, synced live with `HomePage.tsx` and `BrowsePage.tsx`.
3. **Complete Admin Operations Using Real Firestore Data**:
   - **Overview**: Real-time KPIs computed dynamically from Firestore (`totalRevenue`, `activeOrders`, `pendingRequests`, `activeProducts`, recent orders & inquiries).
   - **Catalogue**: Search, category filter, full CRUD modal, Storage photo uploads, quick inline `Trending ★` & `Published/Hidden` toggles (with upsert fallback in `updateProduct`).
   - **Orders**: Status pipeline filter, search, workshop milestone note updates, status transitions, and Manual Payment Settlement status confirmation (`pending_confirmation` / `unpaid` / `paid`).
   - **Custom Inquiries**: Request status filtering, client attachments preview, WhatsApp/call links, and formal ₹ quotation modal.
   - **Customers Directory**: Live aggregation across registered Firestore users, orders, and custom inquiries plus a Customer Inspector modal displaying lifetime spend, saved addresses, and order history.
   - **Workshop Analytics**: Zero hardcoded metrics — live Revenue by Department, Order Pipeline Distribution, Custom Quotation Conversion Funnel, Average Order Value, and Top Commissioned Pieces.

---

## 5. Design Refinement (Warm Wooden Craftsmanship + Minimal Customer Experience)
Combining the warm wooden visual identity with simplified, clutter-free customer and admin workflows:
1. **Visual System (`index.html`, `src/index.css`, `src/data/categories.tsx`)**:
   - Restored the warm alabaster canvas (`#F8F6F2`), espresso ink (`#29231E`), muted warm stone (`#77716A`), warm borders (`#E7E1D9`), and walnut/teak brown accents (`#68452D`, `#523724`, `#A17A58`) paired with `Playfair Display` headings and `Plus Jakarta Sans` UI typography.
   - Styled all 12 furniture category SVG illustrations (`Sofas`, `Beds`, `Chairs`, `Wardrobes`, `Walk-in`, `Kitchens`, `TV Units`, `Flush Doors`, `Stools`, `Dining`, `Desks`, `Shelves`) in warm walnut & teak wood tones.
2. **Simplified Customer Experience (Zero Forced Registration)**:
   - **Home (`/`)**: Minimal hero (*"Furniture, made to stay."*), `Explore Products` primary CTA, `Upload yours` secondary CTA, horizontal wooden-accent category strip, `Browse All` indicator, workshop `#about` section, and live `#contact` cards.
   - **Browse (`/browse`)**: Simple product grid showing photography, product name, category, and price (or `Price on enquiry`), paired with category filter chips and clean search.
   - **Product Details (`/product/:productId`)**: Large photograph gallery with lightbox, dimensions and materials specification, inline **Enquire About This Product** form (Name, Phone, optional note — no login required), and direct **Call Us** / **WhatsApp** actions.
   - **Upload Yours (`/upload-idea`)**: Focused 5-field custom enquiry form (Customer Name, Phone Number, Furniture Description, Optional Dimensions, Reference Photos/PDFs) saving to Firestore & Firebase Storage without requiring customer login.
3. **Streamlined 4-Tab Staff Admin (`/admin`)**:
   - Protected by server-backed Firebase Google Auth (`/admins/{uid}` + verified `email_verified == true`), reduced cleanly to **Products**, **Enquiries**, **Orders**, and **Settings** (live business phone, WhatsApp, email, address, workshop hours, and categories synced to `/settings/storefront`).

---

## 6. Verification Summary
- Automated checks (`scripts/verify-phase6.ts`), `npm run lint` (`tsc --noEmit`), and `npm run build` (`vite build`) verify Firestore/Storage rules alignment, zero client admin bypasses, warm wooden design tokens, and clean compilation.

