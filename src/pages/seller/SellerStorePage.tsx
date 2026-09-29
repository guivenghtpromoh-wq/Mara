import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store as StoreIcon, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { Store } from '../../types';

export const SellerStorePage: React.FC = () => {
  const { currentUser, sellerStore, refreshSellerStore } = useAuth();

  const [name, setName] = useState(sellerStore?.name || '');
  const [description, setDescription] = useState(sellerStore?.description || '');
  const [logoUrl, setLogoUrl] = useState(sellerStore?.logo_url || '');
  const [coverUrl, setCoverUrl] = useState(sellerStore?.cover_url || '');
  const [shippingPolicies, setShippingPolicies] = useState(sellerStore?.shipping_policies || '');
  const [returnPolicies, setReturnPolicies] = useState(sellerStore?.return_policies || '');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sellerStore) {
      setName(sellerStore.name);
      setDescription(sellerStore.description);
      setLogoUrl(sellerStore.logo_url || '');
      setCoverUrl(sellerStore.cover_url || '');
      setShippingPolicies(sellerStore.shipping_policies || '');
      setReturnPolicies(sellerStore.return_policies || '');
    }
  }, [sellerStore]);

  if (!sellerStore) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-bold">No store associated with this account.</h2>
        <Link to="/sell/onboarding">
          <Button variant="secondary" className="mt-4">
            Activate Store
          </Button>
        </Link>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    setError(null);
    try {
      await marketplaceService.updateStore(
        sellerStore.id,
        {
          name,
          description,
          logo_url: logoUrl || undefined,
          cover_url: coverUrl || undefined,
          shipping_policies: shippingPolicies,
          return_policies: returnPolicies,
        },
        currentUser.uid
      );
      await refreshSellerStore();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to update store:', err);
      setError(err.message || 'Could not save store settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#E2E4DF]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#101312]">
            Store Profile & Policies
          </h1>
          <p className="text-xs text-[#6E746F] mt-0.5">
            Configure your storefront appearance, story, and customer policies
          </p>
        </div>

        <Link to={`/store/${sellerStore.slug}`}>
          <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
            Preview Public Store
          </Button>
        </Link>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Store settings updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-5">
        <Input
          label="Store Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold text-[#101312] mb-1">
            Store Description & Brand Story
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs p-3.5 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Logo URL"
            placeholder="https://..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
          <Input
            label="Cover Banner URL"
            placeholder="https://..."
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101312] mb-1">
            Shipping Policies
          </label>
          <textarea
            rows={3}
            value={shippingPolicies}
            onChange={(e) => setShippingPolicies(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101312] mb-1">
            Return Policies
          </label>
          <textarea
            rows={3}
            value={returnPolicies}
            onChange={(e) => setReturnPolicies(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="secondary" size="lg" isLoading={saving}>
            Save Store Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
