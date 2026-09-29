import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { I18nProvider } from './lib/i18n';
import { testConnection } from './lib/firebase';

// Layouts
import { BuyerLayout } from './components/layout/BuyerLayout';
import { SellerLayout } from './components/layout/SellerLayout';

// Intro
import { IntroPage } from './pages/intro/IntroPage';

// Auth Pages (Exact 5 screens)
import { SignInPage } from './pages/auth/SignInPage';
import { CreateAccountPage } from './pages/auth/CreateAccountPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Buyer Pages
import { HomePage } from './pages/buyer/HomePage';
import { ExplorePage } from './pages/buyer/ExplorePage';
import { CategoryPage } from './pages/buyer/CategoryPage';
import { ProductDetailPage } from './pages/buyer/ProductDetailPage';
import { PublicStorePage } from './pages/buyer/PublicStorePage';
import { CartPage } from './pages/buyer/CartPage';
import { CheckoutPage } from './pages/buyer/CheckoutPage';
import { OrdersPage } from './pages/buyer/OrdersPage';
import { OrderDetailPage } from './pages/buyer/OrderDetailPage';
import { WishlistPage } from './pages/buyer/WishlistPage';
import { ProfilePage } from './pages/buyer/ProfilePage';

// Seller Pages
import { SellerOnboardingPage } from './pages/seller/SellerOnboardingPage';
import { SellerOverviewPage } from './pages/seller/SellerOverviewPage';
import { SellerProductsPage } from './pages/seller/SellerProductsPage';
import { ProductFormPage } from './pages/seller/ProductFormPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';
import { SellerOrderDetailPage } from './pages/seller/SellerOrderDetailPage';
import { SellerMessagesPage } from './pages/seller/SellerMessagesPage';
import { SellerStorePage } from './pages/seller/SellerStorePage';

function RootRouter() {
  const introSeen = localStorage.getItem('mara_intro_seen') === 'true';

  return (
    <Routes>
      {/* Introduction */}
      <Route path="/intro" element={<IntroPage />} />

      {/* Auth Routes (Exact 5 Screens) */}
      <Route path="/auth/sign-in" element={<SignInPage />} />
      <Route path="/auth/create-account" element={<CreateAccountPage />} />
      <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* Seller Studio Section */}
      <Route path="/sell/onboarding" element={<SellerOnboardingPage />} />
      <Route path="/sell" element={<SellerLayout />}>
        <Route index element={<SellerOverviewPage />} />
        <Route path="products" element={<SellerProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id" element={<ProductFormPage />} />
        <Route path="orders" element={<SellerOrdersPage />} />
        <Route path="orders/:id" element={<SellerOrderDetailPage />} />
        <Route path="messages" element={<SellerMessagesPage />} />
        <Route path="store" element={<SellerStorePage />} />
        <Route path="settings" element={<SellerStorePage />} />
      </Route>

      {/* Buyer & Public Marketplace Section */}
      <Route element={<BuyerLayout />}>
        <Route index element={!introSeen ? <Navigate to="/intro" replace /> : <HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="search" element={<ExplorePage />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="product/:slug" element={<ProductDetailPage />} />
        <Route path="store/:slug" element={<PublicStorePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    // Validate Firestore connection on boot per Firebase Integration Skill
    testConnection();
  }, []);

  return (
    <I18nProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <RootRouter />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
