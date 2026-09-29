import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ArrowLeft, User, ExternalLink } from 'lucide-react';
import { MaraLogo } from '../common/MaraLogo';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';

export const SellerHeader: React.FC = () => {
  const { profile, currentUser, sellerStore } = useAuth();
  const { t } = useI18n();

  const navLinks = [
    { to: '/sell', label: t('seller.overview'), end: true },
    { to: '/sell/products', label: t('seller.products') },
    { to: '/sell/orders', label: t('seller.orders') },
    { to: '/sell/messages', label: t('seller.messages') },
    { to: '/sell/store', label: t('seller.store') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#123C2F] text-white border-b border-[#123C2F]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: MARA logo + Switch to Buyer */}
        <div className="flex items-center gap-4">
          <MaraLogo to="/sell" color="white" size="md" />
          <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-[#F4C430] text-[#101312] rounded-md">
            Seller Studio
          </span>
          <Link
            to="/"
            className="flex items-center gap-1 text-xs text-[#E2E4DF]/80 hover:text-white transition-colors pl-2 border-l border-white/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Back to Marketplace</span>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white shadow-xs'
                    : 'text-[#E2E4DF]/70 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Seller Profile & Public Store link */}
        <div className="flex items-center gap-3">
          {sellerStore && (
            <Link
              to={`/store/${sellerStore.slug}`}
              className="hidden lg:flex items-center gap-1.5 text-xs text-[#F4C430] hover:underline"
            >
              <span>View public store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            to="/profile"
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#F4C430] text-[#101312] flex items-center justify-center font-bold text-xs">
              {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <span className="hidden sm:inline text-xs font-medium text-white truncate max-w-[120px]">
              {sellerStore?.name || profile?.first_name || 'Seller'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};
