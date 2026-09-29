import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useCart } from '../../context/CartContext';
import { useI18n } from '../../lib/i18n';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();
  const { t, formatPrice } = useI18n();

  if (cart.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-[#6E746F]" />}
          title={t('cart.emptyTitle')}
          description={t('cart.emptyDesc')}
          actionText={t('home.hero.cta')}
          onAction={() => navigate('/explore')}
        />
      </div>
    );
  }

  // Estimated standard shipping and taxes
  const estimatedShipping = subtotal > 100 ? 0 : 9.99;
  const estimatedTax = Number((subtotal * 0.08).toFixed(2));
  const estimatedTotal = subtotal + estimatedShipping + estimatedTax;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
        {t('cart.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Item Lines */}
        <div className="lg:col-span-2 space-y-3">
          {cart.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || 'base'}`}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-[#E2E4DF] shadow-xs"
            >
              {/* Product Thumbnail */}
              <div className="w-20 h-20 rounded-xl bg-[#F7F7F3] border border-[#E2E4DF] overflow-hidden shrink-0">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                  alt={item.productTitle}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <Link
                  to={`/product/${item.productId}`}
                  className="text-sm font-semibold text-[#101312] hover:text-[#123C2F] line-clamp-1 transition-colors"
                >
                  {item.productTitle}
                </Link>
                {item.variantTitle && (
                  <p className="text-xs text-[#6E746F]">{item.variantTitle}</p>
                )}
                <p className="text-xs font-bold text-[#101312]">
                  {formatPrice(item.unitPrice)}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center border border-[#E2E4DF] rounded-xl bg-[#F7F7F3] overflow-hidden">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                  className="px-2.5 py-1 text-xs text-[#101312] hover:bg-white cursor-pointer"
                >
                  -
                </button>
                <span className="px-2.5 text-xs font-bold text-[#101312]">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                  className="px-2.5 py-1 text-xs text-[#101312] hover:bg-white cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Line Total */}
              <div className="text-right min-w-[70px]">
                <p className="text-sm font-bold text-[#101312]">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeFromCart(item.productId, item.variantId)}
                aria-label={t('cart.remove')}
                className="p-2 text-[#6E746F] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2E4DF] space-y-5 shadow-xs sticky top-24">
          <h2 className="text-base font-bold text-[#101312]">Order Summary</h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-[#6E746F]">
              <span>{t('cart.subtotal')}</span>
              <span className="font-semibold text-[#101312]">{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between text-[#6E746F]">
              <span>{t('cart.shipping')}</span>
              <span className="font-semibold text-[#101312]">
                {estimatedShipping === 0 ? 'Free' : formatPrice(estimatedShipping)}
              </span>
            </div>

            <div className="flex justify-between text-[#6E746F]">
              <span>{t('cart.taxes')}</span>
              <span className="font-semibold text-[#101312]">{formatPrice(estimatedTax)}</span>
            </div>

            <div className="pt-3 border-t border-[#E2E4DF] flex justify-between text-sm font-bold text-[#101312]">
              <span>{t('cart.total')}</span>
              <span className="text-base font-bold text-[#123C2F]">
                {formatPrice(estimatedTotal)}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/checkout')}
          >
            <span>{t('cart.checkout')}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-[#6E746F] justify-center">
            <ShieldCheck className="w-4 h-4 text-[#123C2F] shrink-0" />
            <span>Guaranteed secure checkout & delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
};
