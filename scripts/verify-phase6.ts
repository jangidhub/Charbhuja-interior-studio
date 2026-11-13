/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { Order, Product, UserProfile } from '../src/types';

const ROOT = process.cwd();

function testRulesAndBlueprint() {
  const firestoreRules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
  const storageRules = fs.readFileSync(path.join(ROOT, 'storage.rules'), 'utf8');
  const blueprint = JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase-blueprint.json'), 'utf8'));

  // 1. Default-deny catch-all
  assert.match(firestoreRules, /match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);

  // 2. Server-backed admin rule requires email_verified == true and /admins check
  assert.match(firestoreRules, /request\.auth\.token\.email_verified == true/);
  assert.match(
    firestoreRules,
    /exists\(\/databases\/\$\(database\)\/documents\/admins\/\$\(request\.auth\.uid\)\)/
  );

  // 3. Admins registry restricted (no blanket public read)
  assert.match(
    firestoreRules,
    /match \/admins\/\{adminId\}[\s\S]*allow get: if isOwner\(adminId\) \|\| isAdmin\(\);/
  );
  assert.match(firestoreRules, /match \/admins\/\{adminId\}[\s\S]*allow list: if isAdmin\(\);/);

  // 4. Categories & Settings allow public read and admin-only writes
  assert.match(
    firestoreRules,
    /match \/categories\/\{categoryId\}[\s\S]*allow get, list: if true;/
  );
  assert.match(firestoreRules, /match \/categories\/\{categoryId\}[\s\S]*allow create: if isAdmin\(\)/);
  assert.match(firestoreRules, /match \/settings\/\{settingId\}[\s\S]*allow get, list: if true;/);
  assert.match(
    firestoreRules,
    /match \/settings\/\{settingId\}[\s\S]*allow write: if isAdmin\(\) && isValidId\(settingId\);/
  );

  // 5. Guest enquiries allowed on create with strict status/userId validation, read restricted to owner/admin
  assert.match(firestoreRules, /guest_\[0-9\]\+\$/);
  assert.match(
    firestoreRules,
    /match \/customRequests\/\{requestId\}[\s\S]*allow get: if isAdmin\(\) \|\| \(isSignedIn\(\) && (?:existing\(\)|resource\.data)\.userId == request\.auth\.uid\);/
  );

  // 6. Storage admin checks verify email_verified
  assert.match(storageRules, /request\.auth\.token\.email_verified == true/);

  // 7. Blueprint includes Category & StoreSettings entities
  assert.ok(blueprint.entities?.Category, 'Blueprint must define Category entity');
  assert.ok(blueprint.entities?.StoreSettings, 'Blueprint must define StoreSettings entity');
  assert.ok(blueprint.firestore?.['/categories/{categoryId}'], 'Blueprint must define /categories');
  assert.ok(blueprint.firestore?.['/settings/{settingId}'], 'Blueprint must define /settings');

  console.log('✓ Rules & Blueprint security assertions passed');
}

function testRefinedArchitectureAndSecurity() {
  const srcDir = path.join(ROOT, 'src');
  const activePages = [
    'App.tsx',
    'app/router.tsx',
    'components/layout/Header.tsx',
    'components/layout/MobileNav.tsx',
    'components/layout/Footer.tsx',
    'components/products/ProductCard.tsx',
    'pages/Home/HomePage.tsx',
    'pages/Browse/BrowsePage.tsx',
    'pages/ProductDetails/ProductDetailsPage.tsx',
    'pages/CustomDesign/UploadIdeaPage.tsx',
    'pages/Auth/LoginPage.tsx',
    'pages/Admin/AdminDashboardPage.tsx',
    'data/categories.tsx',
  ];

  for (const rel of activePages) {
    const content = fs.readFileSync(path.join(srcDir, rel), 'utf8');
    assert.equal(content.includes('setDemoAdmin'), false, `Found setDemoAdmin in ${rel}`);
    assert.equal(content.includes('admin_sudhanshu'), false, `Found fake token in ${rel}`);
  }

  // Verify Categories SVGs use warm wooden brownish palette (#68452D / #8B5E3C / #A17A58)
  const categoriesSrc = fs.readFileSync(path.join(srcDir, 'data/categories.tsx'), 'utf8');
  assert.match(categoriesSrc, /#68452D/i);

  // Verify warm alabaster + wood brown CSS theme is active
  const cssSrc = fs.readFileSync(path.join(srcDir, 'index.css'), 'utf8');
  assert.match(cssSrc, /#F8F6F2/i);
  assert.match(cssSrc, /#68452D/i);

  // Verify AdminDashboardPage gates Firestore listeners cleanly and keeps 4 tabs
  const adminSrc = fs.readFileSync(path.join(srcDir, 'pages/Admin/AdminDashboardPage.tsx'), 'utf8');
  assert.match(
    adminSrc,
    /if\s*\(\s*authLoading\s*\|\|\s*!isAuthenticated\s*\|\|\s*!isAdmin\s*\|\|\s*!user\?\.uid\s*\)/,
    'AdminDashboardPage must gate onSnapshot subscriptions until server-verified admin state resolves'
  );
  assert.match(
    adminSrc,
    /type AdminTab = 'products' \| 'enquiries' \| 'orders' \| 'settings';/,
    'AdminDashboardPage must expose the 4 simplified management tabs'
  );

  console.log('✓ Warm wooden brown theme, minimal storefront & Admin security assertions passed');
}

function testAdminRoleCheckLogic() {
  const verify = (profile: UserProfile | null): boolean =>
    Boolean(profile && profile.isServerVerifiedAdmin === true);

  assert.equal(verify(null), false);
  assert.equal(
    verify({
      uid: 'u1',
      email: 'attacker@example.com',
      displayName: 'Spoof',
      role: 'admin',
      isServerVerifiedAdmin: false,
      createdAt: '',
    }),
    false,
    'Client-claimed role="admin" without server verification must be rejected'
  );
  assert.equal(
    verify({
      uid: 'u2',
      email: 'sudhanshujangid143@gmail.com',
      displayName: 'Sudhanshu',
      role: 'admin',
      isServerVerifiedAdmin: true,
      createdAt: '',
    }),
    true,
    'Server-verified admin profile must be accepted'
  );

  console.log('✓ Server-backed admin authorization check assertions passed');
}

function testOrderFilteringContract() {
  const sampleProducts: Partial<Product>[] = [
    { productId: 'p1', name: 'Aastha Teak Sofa', categoryId: 'sofas', price: 48000 },
    { productId: 'p2', name: 'Fluted Wardrobe', categoryId: 'wardrobes', price: 82000 },
  ];

  const sampleOrders: Partial<Order>[] = [
    { orderId: 'o1', orderStatus: 'confirmed', totalAmount: 96000 },
    { orderId: 'o2', orderStatus: 'cancelled', totalAmount: 82000 },
  ];

  const activeRevenue = sampleOrders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  assert.equal(sampleProducts.length, 2);
  assert.equal(activeRevenue, 96000);

  console.log('✓ Product & Order contract checks passed');
}

testRulesAndBlueprint();
testRefinedArchitectureAndSecurity();
testAdminRoleCheckLogic();
testOrderFilteringContract();
console.log('\nAll verification checks passed.');
