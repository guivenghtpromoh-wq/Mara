import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Globe, DollarSign } from 'lucide-react';
import { MaraLogo } from '../common/MaraLogo';
import { useI18n, Language, CurrencyCode, CURRENCIES } from '../../lib/i18n';

export const BuyerFooter: React.FC = () => {
  const { language, setLanguage, currency, setCurrency, t } = useI18n();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block w-full bg-[#181B19] text-[#E2E4DF] border-t border-[#E2E4DF]/20 pt-12 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-[#E2E4DF]/15">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <MaraLogo color="white" size="lg" to="/" />
            <p className="text-xs text-[#E2E4DF]/70 leading-relaxed max-w-sm">
              {t('brand.tagline')} An authentic international marketplace connecting independent creators, artisans, and discerning buyers across borders.
            </p>
            {/* Preferences (Language & Currency) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Language */}
              <div className="relative inline-flex items-center bg-[#101312] border border-[#E2E4DF]/20 rounded-xl px-2.5 py-1.5 text-xs">
                <Globe className="w-3.5 h-3.5 text-[#F4C430] mr-2 shrink-0" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer pr-4"
                  aria-label="Select language"
                >
                  <option value="en" className="bg-[#181B19] text-white">English (EN)</option>
                  <option value="fr" className="bg-[#181B19] text-white">Français (FR)</option>
                  <option value="es" className="bg-[#181B19] text-white">Español (ES)</option>
                  <option value="ht" className="bg-[#181B19] text-white">Kreyòl Ayisyen (HT)</option>
                </select>
              </div>

              {/* Currency */}
              <div className="relative inline-flex items-center bg-[#101312] border border-[#E2E4DF]/20 rounded-xl px-2.5 py-1.5 text-xs">
                <DollarSign className="w-3.5 h-3.5 text-[#F4C430] mr-1 shrink-0" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer pr-4"
                  aria-label="Select currency"
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#181B19] text-white">
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div className="border-t md:border-t-0 border-[#E2E4DF]/10 pt-4 md:pt-0">
            <button
              onClick={() => toggleSection('shop')}
              className="w-full flex items-center justify-between text-sm font-semibold text-white md:cursor-default"
            >
              <span>Shop</span>
              <ChevronDown
                className={`w-4 h-4 md:hidden transition-transform ${
                  openSection === 'shop' ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`mt-3 space-y-2 text-xs text-[#E2E4DF]/70 ${
                openSection === 'shop' ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  Explore products
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  All Categories
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-white transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Sell */}
          <div className="border-t md:border-t-0 border-[#E2E4DF]/10 pt-4 md:pt-0">
            <button
              onClick={() => toggleSection('sell')}
              className="w-full flex items-center justify-between text-sm font-semibold text-white md:cursor-default"
            >
              <span>Sell</span>
              <ChevronDown
                className={`w-4 h-4 md:hidden transition-transform ${
                  openSection === 'sell' ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`mt-3 space-y-2 text-xs text-[#E2E4DF]/70 ${
                openSection === 'sell' ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link to="/sell" className="hover:text-[#F4C430] transition-colors font-medium">
                  Start selling on MARA
                </Link>
              </li>
              <li>
                <Link to="/sell/products/new" className="hover:text-white transition-colors">
                  Publish a product
                </Link>
              </li>
              <li>
                <Link to="/sell/store" className="hover:text-white transition-colors">
                  Store Management
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-white transition-colors">
                  Seller Overview
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="border-t md:border-t-0 border-[#E2E4DF]/10 pt-4 md:pt-0">
            <button
              onClick={() => toggleSection('legal')}
              className="w-full flex items-center justify-between text-sm font-semibold text-white md:cursor-default"
            >
              <span>Legal & Policies</span>
              <ChevronDown
                className={`w-4 h-4 md:hidden transition-transform ${
                  openSection === 'legal' ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`mt-3 space-y-2 text-xs text-[#E2E4DF]/70 ${
                openSection === 'legal' ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Return & Refund Policy
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Seller Standards
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#E2E4DF]/50 gap-3">
          <p>© {currentYear} MARA. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>Official International Marketplace</span>
            <span>•</span>
            <span>Zero Slop Architecture</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
