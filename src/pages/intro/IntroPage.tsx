import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Store, ShieldCheck } from 'lucide-react';
import { MaraLogo } from '../../components/common/MaraLogo';
import { Button } from '../../components/common/Button';
import { marketplaceService } from '../../services/marketplaceService';
import { Product } from '../../types';
import { useI18n } from '../../lib/i18n';

export const IntroPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, formatPrice } = useI18n();
  const [step, setStep] = useState<1 | 2>(1);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load real products if they exist
    marketplaceService
      .getProducts({ limitCount: 4 })
      .then((prods) => setRecentProducts(prods))
      .catch((err) => console.error('Error loading intro products:', err));
  }, []);

  const handleFinishIntro = (destination: string) => {
    localStorage.setItem('mara_intro_seen', 'true');
    navigate(destination);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F3] flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between z-10">
        <MaraLogo to="/" size="lg" />
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              step === 1 ? 'w-6 bg-[#101312]' : 'bg-[#E2E4DF]'
            }`}
          />
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              step === 2 ? 'w-6 bg-[#101312]' : 'bg-[#E2E4DF]'
            }`}
          />
        </div>
      </div>

      {/* Main Content Carousel */}
      <div className="max-w-xl mx-auto w-full my-auto py-8 z-10">
        {step === 1 ? (
          /* INTRO 01 */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Visual: Real products from database if available */}
            {recentProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 p-4 bg-white rounded-2xl border border-[#E2E4DF] shadow-xs">
                {recentProducts.slice(0, 2).map((p) => (
                  <div key={p.id} className="space-y-1.5">
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#F7F7F3]">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-medium text-[#101312] truncate">{p.title}</p>
                    <p className="text-xs font-semibold text-[#123C2F]">{formatPrice(p.price)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#F4C430]/20 text-[#101312] flex items-center justify-center border border-[#F4C430]/40">
                <ShoppingBag className="w-10 h-10 text-[#101312]" />
              </div>
            )}

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#101312] leading-tight">
                {t('intro1.title')}
              </h1>
              <p className="text-base text-[#6E746F] leading-relaxed">
                {t('intro1.desc')}
              </p>
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => setStep(2)}
              >
                <span>{t('intro1.continue')}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        ) : (
          /* INTRO 02 */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-2xl bg-[#123C2F]/10 text-[#123C2F] flex items-center justify-center border border-[#123C2F]/20">
              <Store className="w-10 h-10 text-[#123C2F]" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#101312] leading-tight">
                {t('intro2.title')}
              </h1>
              <p className="text-base text-[#6E746F] leading-relaxed">
                {t('intro2.desc')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => handleFinishIntro('/')}
              >
                {t('intro2.getStarted')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => handleFinishIntro('/auth/sign-in')}
              >
                {t('intro2.alreadyHave')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between text-xs text-[#6E746F] z-10 pt-4 border-t border-[#E2E4DF]/50">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#123C2F]" />
          Verified Global Marketplace
        </span>
        <button
          onClick={() => handleFinishIntro('/')}
          className="hover:text-[#101312] underline underline-offset-4 cursor-pointer"
        >
          Skip to marketplace
        </button>
      </div>
    </div>
  );
};
