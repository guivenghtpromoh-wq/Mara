import React from 'react';
import { Outlet } from 'react-router-dom';
import { BuyerHeader } from './BuyerHeader';
import { BuyerBottomNav } from './BuyerBottomNav';
import { BuyerFooter } from './BuyerFooter';

export const BuyerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F3] text-[#101312]">
      <BuyerHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <Outlet />
      </main>
      {/* Footer displayed strictly on web/desktop view */}
      <div className="hidden md:block">
        <BuyerFooter />
      </div>
      <BuyerBottomNav />
    </div>
  );
};
