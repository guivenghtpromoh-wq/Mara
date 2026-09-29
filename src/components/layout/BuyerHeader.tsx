import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, X } from 'lucide-react';
import { MaraLogo } from '../common/MaraLogo';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';

export const BuyerHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemsCount, wishlist } = useCart();
  const { currentUser, profile } = useAuth();
  const { t } = useI18n();

  const [searchTerm, setSearchTerm] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E4DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: MARA logo */}
        <div className="shrink-0 flex items-center gap-3">
          <MaraLogo to="/" size="md" />
        </div>

        {/* Center: Main Search Input (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-lg mx-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#F7F7F3] border border-[#E2E4DF] rounded-xl text-[#101312] placeholder-[#6E746F] focus:bg-white focus:border-[#101312] focus:outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#6E746F] pointer-events-none" />
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 text-[#101312] hover:bg-[#F7F7F3] rounded-xl transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Desktop Explore */}
          <Link
            to="/explore"
            className={`hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              location.pathname === '/explore'
                ? 'text-[#101312] bg-[#F7F7F3]'
                : 'text-[#6E746F] hover:text-[#101312]'
            }`}
          >
            {t('nav.explore')}
          </Link>

          {/* Desktop Wishlist */}
          <Link
            to="/wishlist"
            className="hidden sm:inline-flex relative p-2 text-[#101312] hover:bg-[#F7F7F3] rounded-xl transition-colors"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#123C2F] text-white text-[10px] font-bold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart with real count badge */}
          <Link
            to="/cart"
            className="relative p-2 text-[#101312] hover:bg-[#F7F7F3] rounded-xl transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-[#F4C430] text-[#101312] text-[10px] font-bold flex items-center justify-center shadow-xs">
                {itemsCount}
              </span>
            )}
          </Link>

          {/* Sell on MARA */}
          <Link
            to="/sell"
            className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg text-[#101312] border border-[#E2E4DF] hover:bg-[#F7F7F3] transition-colors"
          >
            Sell
          </Link>

          {/* Profile / Account */}
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-[#F7F7F3] transition-colors border border-transparent hover:border-[#E2E4DF]"
          >
            <div className="w-8 h-8 rounded-full bg-[#F4C430]/20 text-[#101312] flex items-center justify-center font-semibold text-xs border border-[#F4C430]/40">
              {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <span className="hidden lg:inline text-xs font-semibold text-[#101312] truncate max-w-[100px]">
              {profile?.first_name || (currentUser ? 'Account' : 'Sign in')}
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-[#E2E4DF] bg-white p-3 shadow-md animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#F7F7F3] border border-[#E2E4DF] rounded-xl text-[#101312] focus:bg-white focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#6E746F]" />
            </div>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 text-[#6E746F] hover:text-[#101312]"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
};
