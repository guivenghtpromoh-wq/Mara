import {
  CountryConfig,
  CurrencyConfig,
  TaxRule,
  CommissionRule,
  DeliveryProviderConfig,
  PaymentProviderConfig,
  Address
} from '../types';
import { db, doc, getDoc, setDoc, collection, getDocs } from '../lib/firebase';

// Default Global Countries Catalog
export const DEFAULT_COUNTRIES: CountryConfig[] = [
  {
    code: 'US',
    name: 'United States',
    phone_code: '+1',
    default_currency: 'USD',
    default_language: 'en',
    postal_code_required: true,
    address_fields: ['street', 'apartment', 'city', 'region', 'postal_code'],
    active: true,
  },
  {
    code: 'CA',
    name: 'Canada',
    phone_code: '+1',
    default_currency: 'CAD',
    default_language: 'en',
    postal_code_required: true,
    address_fields: ['street', 'apartment', 'city', 'region', 'postal_code'],
    active: true,
  },
  {
    code: 'FR',
    name: 'France',
    phone_code: '+33',
    default_currency: 'EUR',
    default_language: 'fr',
    postal_code_required: true,
    address_fields: ['street', 'apartment', 'city', 'postal_code'],
    active: true,
  },
  {
    code: 'HT',
    name: 'Haïti',
    phone_code: '+509',
    default_currency: 'HTG',
    default_language: 'ht',
    postal_code_required: false,
    address_fields: ['street', 'city', 'region', 'district'],
    active: true,
  },
  {
    code: 'DO',
    name: 'República Dominicana',
    phone_code: '+1 809',
    default_currency: 'DOP',
    default_language: 'es',
    postal_code_required: false,
    address_fields: ['street', 'apartment', 'city', 'region'],
    active: true,
  },
  {
    code: 'MX',
    name: 'México',
    phone_code: '+52',
    default_currency: 'MXN',
    default_language: 'es',
    postal_code_required: true,
    address_fields: ['street', 'apartment', 'city', 'region', 'postal_code'],
    active: true,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    phone_code: '+44',
    default_currency: 'GBP',
    default_language: 'en',
    postal_code_required: true,
    address_fields: ['street', 'apartment', 'city', 'postal_code'],
    active: true,
  },
];

// Default Global Currencies
export const DEFAULT_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate_against_usd: 1.0, decimals: 2, symbol_position: 'BEFORE', active: true },
  { code: 'EUR', symbol: '€', name: 'Euro', rate_against_usd: 0.92, decimals: 2, symbol_position: 'AFTER', active: true },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rate_against_usd: 1.35, decimals: 2, symbol_position: 'BEFORE', active: true },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate_against_usd: 0.78, decimals: 2, symbol_position: 'BEFORE', active: true },
  { code: 'HTG', symbol: 'G', name: 'Haitian Gourde', rate_against_usd: 131.5, decimals: 2, symbol_position: 'BEFORE', active: true },
  { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', rate_against_usd: 59.8, decimals: 2, symbol_position: 'BEFORE', active: true },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', rate_against_usd: 18.2, decimals: 2, symbol_position: 'BEFORE', active: true },
];

// Default Tax Rules
export const DEFAULT_TAX_RULES: TaxRule[] = [
  { id: 'tax-us', country_code: 'US', tax_name: 'US Sales Tax (Avg)', rate: 0.08, is_inclusive: false, active: true },
  { id: 'tax-ca', country_code: 'CA', tax_name: 'GST/HST', rate: 0.13, is_inclusive: false, active: true },
  { id: 'tax-fr', country_code: 'FR', tax_name: 'TVA standard', rate: 0.20, is_inclusive: true, active: true },
  { id: 'tax-ht', country_code: 'HT', tax_name: 'TCA', rate: 0.10, is_inclusive: false, active: true },
  { id: 'tax-do', country_code: 'DO', tax_name: 'ITBIS', rate: 0.18, is_inclusive: false, active: true },
  { id: 'tax-mx', country_code: 'MX', tax_name: 'IVA', rate: 0.16, is_inclusive: true, active: true },
  { id: 'tax-gb', country_code: 'GB', tax_name: 'UK VAT', rate: 0.20, is_inclusive: true, active: true },
];

// Default Commission Rules
export const DEFAULT_COMMISSION_RULES: CommissionRule[] = [
  {
    id: 'comm-standard',
    name: 'Global Standard Marketplace Commission',
    type: 'PERCENTAGE',
    percentage_rate: 0.05, // 5%
    fixed_fee: 0,
    active: true,
  },
  {
    id: 'comm-electronics',
    name: 'Consumer Electronics Low-Margin Tier',
    type: 'HYBRID',
    percentage_rate: 0.035, // 3.5% + $0.50
    fixed_fee: 0.50,
    category_id: 'o2SK5plhXyVeDppRjllA',
    active: true,
  },
];

// Default Delivery Providers
export const DEFAULT_DELIVERY_PROVIDERS: DeliveryProviderConfig[] = [
  {
    id: 'del-standard-tracked',
    code: 'POSTAL_SERVICE',
    name: 'Standard Tracked Shipping',
    country_code: 'ALL',
    base_rate: 8.50,
    per_kg_rate: 1.50,
    estimated_days: '5–8 business days',
    supports_pickup: false,
    active: true,
  },
  {
    id: 'del-express-courier',
    code: 'EXPRESS_CARRIER',
    name: 'Express Courier Air',
    country_code: 'ALL',
    base_rate: 18.00,
    per_kg_rate: 3.00,
    estimated_days: '2–4 business days',
    supports_pickup: false,
    active: true,
  },
  {
    id: 'del-local-pickup',
    code: 'STORE_PICKUP',
    name: 'Direct Store Pickup',
    country_code: 'ALL',
    base_rate: 0.00,
    per_kg_rate: 0.00,
    estimated_days: 'Same day / 24 hours',
    supports_pickup: true,
    active: true,
  },
];

// Default Payment Gateways
export const DEFAULT_PAYMENT_PROVIDERS: PaymentProviderConfig[] = [
  {
    id: 'pay-card-gateway',
    code: 'STRIPE',
    name: 'Global Credit / Debit Card & Wallets',
    supported_countries: ['US', 'CA', 'FR', 'GB', 'MX', 'DO'],
    supported_currencies: ['USD', 'EUR', 'CAD', 'GBP', 'MXN', 'DOP'],
    is_test_mode: false,
    active: true,
  },
  {
    id: 'pay-paypal',
    code: 'PAYPAL',
    name: 'PayPal International',
    supported_countries: ['US', 'CA', 'FR', 'GB', 'MX', 'DO'],
    supported_currencies: ['USD', 'EUR', 'CAD', 'GBP'],
    is_test_mode: false,
    active: true,
  },
  {
    id: 'pay-mobile-money',
    code: 'MOBILE_MONEY',
    name: 'Regional Mobile Money (Haiti & Caribbean)',
    supported_countries: ['HT', 'DO'],
    supported_currencies: ['HTG', 'USD', 'DOP'],
    is_test_mode: false,
    active: true,
  },
];

export const configService = {
  // --- COUNTRIES ---
  async getCountries(): Promise<CountryConfig[]> {
    try {
      const snap = await getDocs(collection(db, 'config_countries'));
      if (snap.empty) return DEFAULT_COUNTRIES;
      const list: CountryConfig[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as CountryConfig) }));
      return list.length > 0 ? list : DEFAULT_COUNTRIES;
    } catch {
      return DEFAULT_COUNTRIES;
    }
  },

  getCountryByCode(code: string): CountryConfig {
    const found = DEFAULT_COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
    return (
      found || {
        code: code.toUpperCase(),
        name: code.toUpperCase(),
        phone_code: '+1',
        default_currency: 'USD',
        default_language: 'en',
        postal_code_required: false,
        address_fields: ['street', 'city', 'region'],
        active: true,
      }
    );
  },

  // --- CURRENCIES & EXCHANGE RATES ---
  async getCurrencies(): Promise<CurrencyConfig[]> {
    try {
      const snap = await getDocs(collection(db, 'config_currencies'));
      if (snap.empty) return DEFAULT_CURRENCIES;
      const list: CurrencyConfig[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as CurrencyConfig) }));
      return list.length > 0 ? list : DEFAULT_CURRENCIES;
    } catch {
      return DEFAULT_CURRENCIES;
    }
  },

  convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    const from = DEFAULT_CURRENCIES.find((c) => c.code === fromCurrency) || { rate_against_usd: 1.0 };
    const to = DEFAULT_CURRENCIES.find((c) => c.code === toCurrency) || { rate_against_usd: 1.0 };
    // Convert to USD base first, then to target
    const inUSD = amount / from.rate_against_usd;
    const inTarget = inUSD * to.rate_against_usd;
    return Number(inTarget.toFixed(2));
  },

  formatMoney(amount: number, currencyCode: string = 'USD'): string {
    const config = DEFAULT_CURRENCIES.find((c) => c.code === currencyCode) || {
      code: currencyCode,
      symbol: '$',
      symbol_position: 'BEFORE',
      decimals: 2,
    };

    const formattedNum = amount.toLocaleString(undefined, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    });

    return config.symbol_position === 'BEFORE'
      ? `${config.symbol}${formattedNum}`
      : `${formattedNum} ${config.symbol}`;
  },

  // --- TAX CALCULATION ---
  async getTaxRules(): Promise<TaxRule[]> {
    try {
      const snap = await getDocs(collection(db, 'config_taxes'));
      if (snap.empty) return DEFAULT_TAX_RULES;
      const list: TaxRule[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as TaxRule) }));
      return list;
    } catch {
      return DEFAULT_TAX_RULES;
    }
  },

  calculateTax(subtotal: number, countryCode: string, regionCode?: string): { rate: number; taxAmount: number; isInclusive: boolean; taxName: string } {
    const rule = DEFAULT_TAX_RULES.find((r) => r.country_code === countryCode && (!r.region_code || r.region_code === regionCode))
      || DEFAULT_TAX_RULES.find((r) => r.country_code === countryCode)
      || { id: 'default', country_code: 'GLOBAL', tax_name: 'Standard Tax', rate: 0.05, is_inclusive: false, active: true };

    if (rule.is_inclusive) {
      // Amount is already in the price: tax = subtotal - (subtotal / (1 + rate))
      const taxAmount = Number((subtotal - subtotal / (1 + rule.rate)).toFixed(2));
      return { rate: rule.rate, taxAmount, isInclusive: true, taxName: rule.tax_name };
    } else {
      const taxAmount = Number((subtotal * rule.rate).toFixed(2));
      return { rate: rule.rate, taxAmount, isInclusive: false, taxName: rule.tax_name };
    }
  },

  // --- COMMISSION CALCULATION ---
  calculateCommission(subtotal: number, categoryId?: string, countryCode?: string): number {
    const rule = DEFAULT_COMMISSION_RULES.find((r) => r.category_id && r.category_id === categoryId)
      || DEFAULT_COMMISSION_RULES[0];

    let fee = subtotal * rule.percentage_rate + (rule.fixed_fee || 0);
    if (rule.min_fee !== undefined && fee < rule.min_fee) fee = rule.min_fee;
    if (rule.max_fee !== undefined && fee > rule.max_fee) fee = rule.max_fee;

    return Number(fee.toFixed(2));
  },

  // --- ADDRESS VALIDATION ---
  validateAddress(addr: Partial<Address>, countryCode: string): { isValid: boolean; missingFields: string[] } {
    const config = this.getCountryByCode(countryCode);
    const missing: string[] = [];

    if (!addr.first_name?.trim()) missing.push('first_name');
    if (!addr.last_name?.trim()) missing.push('last_name');
    if (!addr.address_line1?.trim()) missing.push('address_line1');
    if (!addr.city?.trim()) missing.push('city');

    if (config.postal_code_required && !addr.postal_code?.trim()) {
      missing.push('postal_code');
    }

    return {
      isValid: missing.length === 0,
      missingFields: missing,
    };
  },

  // --- DELIVERY PROVIDERS ---
  async getDeliveryProviders(): Promise<DeliveryProviderConfig[]> {
    try {
      const snap = await getDocs(collection(db, 'config_delivery'));
      if (snap.empty) return DEFAULT_DELIVERY_PROVIDERS;
      const list: DeliveryProviderConfig[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as DeliveryProviderConfig) }));
      return list;
    } catch {
      return DEFAULT_DELIVERY_PROVIDERS;
    }
  },

  // --- PAYMENT PROVIDERS ---
  async getPaymentProviders(): Promise<PaymentProviderConfig[]> {
    try {
      const snap = await getDocs(collection(db, 'config_payments'));
      if (snap.empty) return DEFAULT_PAYMENT_PROVIDERS;
      const list: PaymentProviderConfig[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as PaymentProviderConfig) }));
      return list;
    } catch {
      return DEFAULT_PAYMENT_PROVIDERS;
    }
  },
};
