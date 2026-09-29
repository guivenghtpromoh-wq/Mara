import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Building, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { useI18n } from '../../lib/i18n';

export const SellerOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, sellerStore, refreshSellerStore } = useAuth();
  const { t } = useI18n();

  // Redirect if already has store
  if (sellerStore) {
    navigate('/sell');
  }

  // 5 Steps: 1: Seller Info, 2: Store Info, 3: Payout Setup, 4: Review, 5: Activation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [legalName, setLegalName] = useState('');
  const [country, setCountry] = useState('United States');
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [payoutBank, setPayoutBank] = useState('');
  const [payoutAccount, setPayoutAccount] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (name: string) => {
    setStoreName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setStoreSlug(slug);
  };

  const handleActivateStore = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      await marketplaceService.createStore({
        seller_id: currentUser.uid,
        name: storeName,
        slug: storeSlug || `store-${Date.now()}`,
        description: storeDescription,
        logo_url: storeLogoUrl || undefined,
        status: 'ACTIVE',
        shipping_policies: 'Standard domestic & international delivery within 5–7 business days.',
        return_policies: '14-day hassle-free returns for eligible items in original condition.'
      });
      await refreshSellerStore();
      navigate('/sell');
    } catch (err: any) {
      console.error('Failed to create store:', err);
      setError(err.message || 'Could not activate seller account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-0 space-y-8">
      <div>
        <span className="text-xs font-bold text-[#123C2F] uppercase tracking-wider">
          Merchant Onboarding
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
          {t('seller.onboarding.title')}
        </h1>
        <p className="text-xs text-[#6E746F] mt-1">{t('seller.onboarding.desc')}</p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between border-b border-[#E2E4DF] pb-3 text-xs font-semibold">
        {[
          { num: 1, label: '1. Seller' },
          { num: 2, label: '2. Store' },
          { num: 3, label: '3. Payout' },
          { num: 4, label: '4. Activation' },
        ].map((s) => (
          <span
            key={s.num}
            className={`${
              step === s.num
                ? 'text-[#123C2F] font-bold border-b-2 border-[#123C2F] pb-3 -mb-3'
                : step > s.num
                ? 'text-[#101312]'
                : 'text-[#6E746F]'
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Seller Info */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#101312] flex items-center gap-2">
            <Building className="w-4 h-4 text-[#123C2F]" />
            <span>Seller Identification</span>
          </h2>

          <Input
            label="Legal Business / Individual Name"
            required
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="Official identity or registered business name"
          />

          <Input
            label="Operating Country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />

          <div className="pt-4 flex justify-end">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!legalName.trim()) {
                  setError('Please provide your legal name.');
                  return;
                }
                setError(null);
                setStep(2);
              }}
            >
              Continue to Store Details
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Store Info */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#101312] flex items-center gap-2">
            <Store className="w-4 h-4 text-[#123C2F]" />
            <span>Storefront Profile</span>
          </h2>

          <Input
            label="Public Store Name"
            required
            value={storeName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Artisanal Workshop, Nordica Studio"
          />

          <Input
            label="Store URL Slug (/store/:slug)"
            required
            value={storeSlug}
            onChange={(e) => setStoreSlug(e.target.value)}
            placeholder="my-store-slug"
          />

          <div>
            <label className="block text-xs font-semibold text-[#101312] mb-1">
              Store Description
            </label>
            <textarea
              required
              rows={3}
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="Tell customers about your craftsmanship, background and products..."
              className="w-full text-xs p-3 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
            />
          </div>

          <Input
            label="Logo Image URL (Optional)"
            placeholder="https://..."
            value={storeLogoUrl}
            onChange={(e) => setStoreLogoUrl(e.target.value)}
          />

          <div className="pt-4 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!storeName.trim()) {
                  setError('Please choose a name for your store.');
                  return;
                }
                setError(null);
                setStep(3);
              }}
            >
              Continue to Payouts
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Payout Setup */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#101312] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#123C2F]" />
            <span>Payout & Financial Destination</span>
          </h2>
          <p className="text-xs text-[#6E746F]">
            Revenues from completed orders are deposited to this account after order delivery confirmation.
          </p>

          <Input
            label="Bank Name or Payment Service"
            required
            placeholder="e.g. JPMorgan Chase, Sogebank, Wise, Revolut"
            value={payoutBank}
            onChange={(e) => setPayoutBank(e.target.value)}
          />

          <Input
            label="IBAN / Account Number"
            required
            placeholder="Account / Routing identifier"
            value={payoutAccount}
            onChange={(e) => setPayoutAccount(e.target.value)}
          />

          <div className="pt-4 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!payoutBank.trim() || !payoutAccount.trim()) {
                  setError('Please fill in payout account details.');
                  return;
                }
                setError(null);
                setStep(4);
              }}
            >
              Review & Activate
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Activation */}
      {step === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[#101312] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#123C2F]" />
            <span>Review & Activation</span>
          </h2>

          <div className="space-y-3 text-xs bg-[#F7F7F3] p-4 rounded-2xl border border-[#E2E4DF]">
            <div className="flex justify-between">
              <span className="text-[#6E746F]">Legal Entity:</span>
              <span className="font-semibold text-[#101312]">{legalName} ({country})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E746F]">Store Name:</span>
              <span className="font-semibold text-[#101312]">{storeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E746F]">Store URL:</span>
              <span className="font-semibold text-[#123C2F]">/store/{storeSlug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E746F]">Payout:</span>
              <span className="font-semibold text-[#101312]">{payoutBank} (Ending {payoutAccount.slice(-4)})</span>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              variant="secondary"
              size="lg"
              isLoading={loading}
              onClick={handleActivateStore}
            >
              <span>Launch Store on MARA</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
