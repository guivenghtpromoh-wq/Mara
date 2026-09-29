import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingCart, Package, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useI18n } from '../../lib/i18n';

export const BuyerBottomNav: React.FC = () => {
  const { itemsCount } = useCart();
  const { t } = useI18n();

  // Exactly 5 items in exact order: Home, Explore, Cart, Orders, Profile
  const navItems = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/explore', label: t('nav.explore'), icon: Search },
    { to: '/cart', label: t('nav.cart'), icon: ShoppingCart, badge: itemsCount > 0 ? itemsCount : null },
    { to: '/orders', label: t('nav.orders'), icon: Package },
    { to: '/profile', label: t('nav.profile'), icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E4DF] pb-safe"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 relative text-xs font-medium transition-colors select-none ${
                isActive ? 'text-[#101312] font-semibold' : 'text-[#6E746F] hover:text-[#101312]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'
                    }`}
                  />
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#F4C430] text-[#101312] text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[11px] leading-none">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#101312]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
