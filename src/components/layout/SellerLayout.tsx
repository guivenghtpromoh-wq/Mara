import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { SellerHeader } from './SellerHeader';
import { SellerBottomNav } from './SellerBottomNav';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../common/Skeleton';

export const SellerLayout: React.FC = () => {
  const { currentUser, sellerStore, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F3] p-8 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // If not logged in, redirect to auth
  if (!currentUser) {
    return <Navigate to="/auth/sign-in?redirect=/sell" replace />;
  }

  // If logged in but does not have a store yet, redirect to seller onboarding
  // (Unless already on onboarding / profile)
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F3] text-[#101312]">
      <SellerHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <Outlet />
      </main>
      <SellerBottomNav />
    </div>
  );
};
