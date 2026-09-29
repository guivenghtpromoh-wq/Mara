import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Package, ClipboardList, MessageSquare, Store } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

export const SellerBottomNav: React.FC = () => {
  const { t } = useI18n();

  // Exactly 5 items in exact order: Overview, Products, Orders, Messages, Store
  const navItems = [
    { to: '/sell', label: t('seller.overview'), icon: BarChart3, end: true },
    { to: '/sell/products', label: t('seller.products'), icon: Package, end: false },
    { to: '/sell/orders', label: t('seller.orders'), icon: ClipboardList, end: false },
    { to: '/sell/messages', label: t('seller.messages'), icon: MessageSquare, end: false },
    { to: '/sell/store', label: t('seller.store'), icon: Store, end: false },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#123C2F] text-white border-t border-[#123C2F]/50 pb-safe"
      aria-label="Seller Mobile Navigation"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 relative text-xs font-medium transition-colors select-none ${
                isActive ? 'text-[#F4C430] font-semibold' : 'text-[#E2E4DF]/70 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'
                  }`}
                />
                <span className="mt-1 text-[11px] leading-none">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#F4C430]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
