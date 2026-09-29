import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  Heart,
  Store,
  Globe,
  DollarSign,
  LogOut,
  Bell,
  Lock,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { useI18n, Language, CurrencyCode, CURRENCIES } from '../../lib/i18n';
import { db, doc, updateDoc } from '../../lib/firebase';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, profile, sellerStore, signOut, refreshProfile } = useAuth();
  const { language, setLanguage, currency, setCurrency, t } = useI18n();

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#F4C430]/20 text-[#101312] flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#101312]">Sign in to your account</h2>
        <p className="text-xs text-[#6E746F]">
          Access order history, manage profile preferences and sell on MARA.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link to="/auth/sign-in">
            <Button variant="primary" size="lg" className="w-full">
              Sign in
            </Button>
          </Link>
          <Link to="/auth/create-account">
            <Button variant="outline" size="lg" className="w-full">
              Create account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`.trim(),
        updated_at: new Date().toISOString()
      });
      await refreshProfile();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
          {t('profile.title')}
        </h1>
        <p className="text-xs text-[#6E746F] mt-1">
          Signed in as <span className="font-semibold text-[#101312]">{currentUser.email}</span>
        </p>
      </div>

      {/* Start Selling / Manage Store Callout */}
      <div className="p-6 rounded-3xl bg-[#123C2F] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#F4C430]">
            MARA Seller Studio
          </span>
          <h2 className="text-lg font-bold">
            {sellerStore ? sellerStore.name : t('seller.onboarding.title')}
          </h2>
          <p className="text-xs text-[#E2E4DF]/80 max-w-md">
            {sellerStore
              ? 'Manage products, track incoming orders, and withdraw revenue.'
              : t('seller.onboarding.desc')}
          </p>
        </div>
        <Link to={sellerStore ? '/sell' : '/sell/onboarding'}>
          <Button variant="primary" size="md">
            {sellerStore ? 'Go to Seller Studio' : t('profile.startSelling')}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Quick Links */}
        <div className="space-y-2 bg-white p-4 rounded-3xl border border-[#E2E4DF] shadow-xs h-fit">
          <Link
            to="/orders"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F7F7F3] text-xs font-semibold text-[#101312] transition-colors"
          >
            <Package className="w-4 h-4 text-[#123C2F]" />
            <span>My Orders</span>
          </Link>
          <Link
            to="/wishlist"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F7F7F3] text-xs font-semibold text-[#101312] transition-colors"
          >
            <Heart className="w-4 h-4 text-[#123C2F]" />
            <span>My Wishlist</span>
          </Link>
          <div className="pt-2 border-t border-[#E2E4DF]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-xs font-semibold text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('profile.logout')}</span>
            </button>
          </div>
        </div>

        {/* Account Details & Preferences */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Profile Form */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4"
          >
            <h2 className="text-base font-bold text-[#101312]">{t('profile.account')}</h2>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profile updated successfully.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <Input
              label="Email"
              disabled
              value={currentUser.email || ''}
              helperText="Email is securely verified by Firebase Authentication"
            />

            <Button type="submit" variant="primary" size="md" isLoading={saving}>
              Save changes
            </Button>
          </form>

          {/* Preferences (Language & Currency) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#101312]">{t('profile.settings')}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#101312] mb-1">
                  {t('profile.language')}
                </label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full text-xs font-semibold bg-[#F7F7F3] border border-[#E2E4DF] rounded-xl px-3 py-2 text-[#101312] focus:outline-none"
                  >
                    <option value="en">English (EN)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="es">Español (ES)</option>
                    <option value="ht">Kreyòl Ayisyen (HT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101312] mb-1">
                  {t('profile.currency')}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full text-xs font-semibold bg-[#F7F7F3] border border-[#E2E4DF] rounded-xl px-3 py-2 text-[#101312] focus:outline-none"
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
