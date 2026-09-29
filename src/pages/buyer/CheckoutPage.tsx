import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle,
  Truck,
  CreditCard,
  MapPin,
  ClipboardCheck,
  ArrowRight,
  AlertCircle,
  Tag,
  Check
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';
import { marketplaceService } from '../../services/marketplaceService';
import { configService, DEFAULT_COUNTRIES } from '../../services/configService';
import { Address, Order, CountryConfig, DeliveryProviderConfig, PaymentProviderConfig, Coupon } from '../../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart } = useCart();
  const { currentUser, profile } = useAuth();
  const { t, formatPrice, currency } = useI18n();

  // Dynamic configurations from configService
  const [countries, setCountries] = useState<CountryConfig[]>(DEFAULT_COUNTRIES);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(profile?.country || 'US');
  const [deliveryProviders, setDeliveryProviders] = useState<DeliveryProviderConfig[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProviderConfig[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>('del-standard-tracked');
  const [selectedPaymentProviderId, setSelectedPaymentProviderId] = useState<string>('pay-card-gateway');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 4 Visual Steps: 1: Shipping, 2: Delivery, 3: Payment, 4: Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Load configs
  useEffect(() => {
    const loadData = async () => {
      const [cList, delList, payList] = await Promise.all([
        configService.getCountries(),
        configService.getDeliveryProviders(),
        configService.getPaymentProviders()
      ]);
      setCountries(cList);
      setDeliveryProviders(delList);
      setPaymentProviders(payList);
      if (delList.length > 0) setSelectedDeliveryId(delList[0].id);
      if (payList.length > 0) setSelectedPaymentProviderId(payList[0].id);
    };
    loadData();
  }, []);

  const activeCountry = countries.find((c) => c.code === selectedCountryCode) || countries[0];

  // Shipping Form State
  const [shippingAddress, setShippingAddress] = useState<Address>({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    address_line1: '',
    address_line2: '',
    city: '',
    region: '',
    postal_code: '',
    country: activeCountry.name,
    phone: '',
  });

  // Update country in address when country select changes
  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    const countryObj = countries.find((c) => c.code === code);
    if (countryObj) {
      setShippingAddress((prev) => ({
        ...prev,
        country: countryObj.name,
        phone: prev.phone || countryObj.phone_code + ' '
      }));
    }
  };

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Processing state & confirmed order
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrders, setConfirmedOrders] = useState<Order[]>([]);

  // Delivery calculation
  const selectedDelivery = deliveryProviders.find((d) => d.id === selectedDeliveryId) || deliveryProviders[0];
  const shippingFee = selectedDelivery ? selectedDelivery.base_rate : 8.50;

  // Tax calculation via configurable rules
  const taxCalculation = configService.calculateTax(subtotal, selectedCountryCode, shippingAddress.region);
  const taxAmount = taxCalculation.taxAmount;

  // Subtotal after coupon discount
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const grandTotal = Number((discountedSubtotal + shippingFee + (taxCalculation.isInclusive ? 0 : taxAmount)).toFixed(2));

  // Handle coupon validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponMessage(null);
    const res = await marketplaceService.validateCoupon(couponCode, subtotal);
    if (res.valid && res.coupon) {
      setAppliedCoupon(res.coupon);
      setDiscountAmount(res.discountAmount);
      setCouponMessage({ type: 'success', text: `Coupon applied: -$${res.discountAmount.toFixed(2)} off` });
    } else {
      setCouponMessage({ type: 'error', text: res.error || 'Invalid or expired coupon' });
    }
  };

  // Require auth or redirect
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#101312]">Sign in to complete checkout</h2>
        <p className="text-xs text-[#6E746F]">
          Please sign in to securely link your order and track shipping.
        </p>
        <Link to="/auth/sign-in?redirect=/checkout">
          <Button variant="primary" size="lg" className="w-full">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }

  if (cart.length === 0 && confirmedOrders.length === 0) {
    navigate('/cart');
    return null;
  }

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      // Group order items by seller / store for true multi-vendor fulfillment
      const sellerGroups = new Map<string, typeof cart>();
      for (const item of cart) {
        const group = sellerGroups.get(item.sellerId) || [];
        group.push(item);
        sellerGroups.set(item.sellerId, group);
      }

      const createdOrders: Order[] = [];
      const numGroups = sellerGroups.size;
      const splitShipping = Number((shippingFee / numGroups).toFixed(2));
      const splitTax = Number((taxAmount / numGroups).toFixed(2));
      const activePayment = paymentProviders.find((p) => p.id === selectedPaymentProviderId);

      for (const [sellerId, items] of sellerGroups.entries()) {
        const orderItems = items.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId,
          title: item.productTitle,
          variant_title: item.variantTitle,
          image: item.image,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.unitPrice * item.quantity,
        }));

        const storeId = items[0].storeId;
        const created = await marketplaceService.createOrder({
          user_id: currentUser.uid,
          seller_id: sellerId,
          store_id: storeId,
          items: orderItems,
          shipping_fee: splitShipping,
          tax: splitTax,
          shipping_address: shippingAddress,
          delivery_method: selectedDelivery ? selectedDelivery.name : 'Standard Tracked Shipping',
          payment_method: activePayment ? activePayment.name : 'Credit/Debit Card (Encrypted)',
          currency: currency || 'USD',
          provider: activePayment?.code || 'STRIPE'
        });
        createdOrders.push(created);
      }

      setConfirmedOrders(createdOrders);
      clearCart();
    } catch (err: any) {
      console.error('Failed to create order:', err);
      setError(err.message || 'Payment processing error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 65. ORDER CONFIRMATION SCREEN
  if (confirmedOrders.length > 0) {
    const totalAllOrders = confirmedOrders.reduce((sum, o) => sum + o.total, 0);

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 space-y-6 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#101312]">
            {t('checkout.confirmed')}
          </h1>
          <p className="text-sm text-[#6E746F]">
            {confirmedOrders.length > 1
              ? `Your items have been split into ${confirmedOrders.length} packages from independent sellers.`
              : t('checkout.confirmedDesc')}
          </p>
        </div>

        {/* Order Details Receipt Cards */}
        <div className="space-y-4">
          {confirmedOrders.map((ord) => (
            <div key={ord.id} className="bg-white p-6 rounded-3xl border border-[#E2E4DF] text-left space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E2E4DF] text-xs">
                <div>
                  <span className="text-[#6E746F]">Order Number:</span>
                  <p className="font-bold text-[#101312] text-sm">{ord.order_number}</p>
                </div>
                <div className="text-right">
                  <span className="text-[#6E746F]">Estimated Delivery:</span>
                  <p className="font-bold text-[#123C2F]">5–7 Business Days</p>
                </div>
              </div>

              {/* Products in this order */}
              <div className="space-y-3">
                {ord.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-[#F7F7F3] border border-[#E2E4DF] overflow-hidden shrink-0">
                        <img src={item.image || ''} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#101312] line-clamp-1">{item.title}</p>
                        <p className="text-[#6E746F]">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#101312]">{formatPrice(item.total_price)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#E2E4DF] flex justify-between text-sm font-bold text-[#101312]">
                <span>Package Total:</span>
                <span className="text-[#123C2F]">{formatPrice(ord.total)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/orders')}
          >
            {t('checkout.viewOrder')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/explore')}
          >
            {t('checkout.continueShopping')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
          {t('checkout.title')}
        </h1>
        <p className="text-xs text-[#6E746F] mt-1">Complete your purchase in 4 secure steps</p>
      </div>

      {/* 4 Visual Steps Progress Header */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
        {[
          { step: 1, label: t('checkout.step.shipping'), icon: MapPin },
          { step: 2, label: t('checkout.step.delivery'), icon: Truck },
          { step: 3, label: t('checkout.step.payment'), icon: CreditCard },
          { step: 4, label: t('checkout.step.review'), icon: ClipboardCheck },
        ].map((s) => (
          <button
            key={s.step}
            onClick={() => s.step < currentStep && setCurrentStep(s.step as any)}
            className={`flex flex-col items-center py-2.5 px-1 rounded-xl transition-all ${
              currentStep === s.step
                ? 'bg-[#101312] text-white shadow-xs'
                : currentStep > s.step
                ? 'bg-[#123C2F]/10 text-[#123C2F] cursor-pointer'
                : 'bg-white border border-[#E2E4DF] text-[#6E746F]'
            }`}
          >
            <s.icon className="w-4 h-4 mb-1" />
            <span className="text-[11px] truncate">{s.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Step Content */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs">
          {/* STEP 1: SHIPPING */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#101312] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#123C2F]" />
                <span>1. Shipping Address</span>
              </h2>

              {/* Dynamic Country Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#101312] mb-1">
                  Country / Market Region <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCountryCode}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E4DF] rounded-xl text-xs font-medium text-[#101312] focus:outline-none focus:ring-1 focus:ring-[#123C2F]"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.default_currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  value={shippingAddress.first_name}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, first_name: e.target.value })}
                />
                <Input
                  label="Last Name"
                  required
                  value={shippingAddress.last_name}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, last_name: e.target.value })}
                />
              </div>

              <Input
                label="Street Address / Building"
                required
                placeholder="Street address, avenue, district"
                value={shippingAddress.address_line1}
                onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
              />

              <Input
                label="Apartment, suite, unit (optional)"
                value={shippingAddress.address_line2}
                onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })}
              />

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="City / Town"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                />
                <Input
                  label="Region / State / Dept"
                  required
                  value={shippingAddress.region}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, region: e.target.value })}
                />
                <Input
                  label={`Postal Code ${activeCountry.postal_code_required ? '*' : '(optional)'}`}
                  required={activeCountry.postal_code_required}
                  value={shippingAddress.postal_code}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                />
              </div>

              <Input
                label="Contact Phone"
                placeholder={`${activeCountry.phone_code} ...`}
                value={shippingAddress.phone}
                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
              />

              <div className="pt-4 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const validation = configService.validateAddress(shippingAddress, selectedCountryCode);
                    if (!validation.isValid) {
                      setError(`Please fill in required fields: ${validation.missingFields.join(', ')}.`);
                      return;
                    }
                    setError(null);
                    setCurrentStep(2);
                  }}
                >
                  Continue to Delivery
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: DELIVERY */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#101312] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#123C2F]" />
                <span>2. Delivery Provider</span>
              </h2>

              <div className="space-y-3">
                {deliveryProviders.map((provider) => (
                  <label
                    key={provider.id}
                    onClick={() => setSelectedDeliveryId(provider.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedDeliveryId === provider.id
                        ? 'border-[#101312] bg-[#F7F7F3]'
                        : 'border-[#E2E4DF] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={selectedDeliveryId === provider.id}
                        onChange={() => setSelectedDeliveryId(provider.id)}
                        className="text-[#101312]"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#101312]">{provider.name}</p>
                        <p className="text-[11px] text-[#6E746F]">Estimated: {provider.estimated_days}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#101312]">
                      {provider.base_rate === 0 ? 'Free' : formatPrice(provider.base_rate)}
                    </span>
                  </label>
                ))}
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" size="md" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button variant="primary" size="md" onClick={() => setCurrentStep(3)}>
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#101312] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#123C2F]" />
                <span>3. Payment Provider</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {paymentProviders.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPaymentProviderId(p.id)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedPaymentProviderId === p.id
                        ? 'border-[#101312] bg-[#101312] text-white'
                        : 'border-[#E2E4DF] bg-white text-[#101312]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Secure Simulated Card Entry Form for Stripe */}
              <div className="space-y-3">
                <Input
                  label="Card Number / Payment Identifier"
                  required
                  placeholder="•••• •••• •••• ••••"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  icon={<CreditCard className="w-4 h-4" />}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Expiry Date"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                  />
                  <Input
                    label="CVC / Verification Code"
                    placeholder="•••"
                    type="password"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" size="md" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button variant="primary" size="md" onClick={() => setCurrentStep(4)}>
                  Review Order
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & PLACE ORDER */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-[#101312] flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#123C2F]" />
                <span>4. Review Order</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#F7F7F3] border border-[#E2E4DF] space-y-1">
                  <p className="font-bold text-[#101312]">Shipping To:</p>
                  <p className="text-[#6E746F]">
                    {shippingAddress.first_name} {shippingAddress.last_name}
                  </p>
                  <p className="text-[#6E746F]">{shippingAddress.address_line1}</p>
                  <p className="text-[#6E746F]">
                    {shippingAddress.city}, {shippingAddress.region} {shippingAddress.postal_code}
                  </p>
                  <p className="text-[#6E746F]">{shippingAddress.country} ({shippingAddress.phone})</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F7F3] border border-[#E2E4DF] space-y-1">
                  <p className="font-bold text-[#101312]">Payment & Delivery:</p>
                  <p className="text-[#6E746F]">
                    Payment: {paymentProviders.find((p) => p.id === selectedPaymentProviderId)?.name || 'Credit Card'}
                  </p>
                  <p className="text-[#6E746F]">
                    Delivery: {selectedDelivery?.name} ({selectedDelivery?.estimated_days})
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2 border-t border-[#E2E4DF]">
                <h3 className="text-xs font-bold text-[#101312]">Items ({cart.length})</h3>
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-1">
                    <span className="text-[#101312] truncate max-w-xs">
                      {item.quantity}x {item.productTitle}
                    </span>
                    <span className="font-semibold text-[#101312]">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-[#E2E4DF]">
                <Button variant="ghost" size="md" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isProcessing}
                  onClick={handlePlaceOrder}
                >
                  <span>{t('checkout.placeOrder')} ({formatPrice(grandTotal)})</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#101312]">Summary</h3>

          {/* Coupon Code Input */}
          <div className="space-y-2 pb-3 border-b border-[#E2E4DF]">
            <div className="flex gap-2">
              <Input
                placeholder="Discount code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleApplyCoupon}>
                Apply
              </Button>
            </div>
            {couponMessage && (
              <p className={`text-[11px] ${couponMessage.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                {couponMessage.text}
              </p>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#6E746F]">
              <span>Items Subtotal</span>
              <span className="font-semibold text-[#101312]">{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({appliedCoupon?.code})</span>
                <span className="font-semibold">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#6E746F]">
              <span>Shipping ({selectedDelivery?.name || 'Standard'})</span>
              <span className="font-semibold text-[#101312]">
                {shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-[#6E746F]">
              <span>
                {taxCalculation.taxName} ({(taxCalculation.rate * 100).toFixed(0)}%{taxCalculation.isInclusive ? ' incl.' : ''})
              </span>
              <span className="font-semibold text-[#101312]">{formatPrice(taxAmount)}</span>
            </div>
            <div className="pt-2 border-t border-[#E2E4DF] flex justify-between text-sm font-bold text-[#101312]">
              <span>Total ({currency})</span>
              <span className="text-base text-[#123C2F]">{formatPrice(grandTotal)}</span>
            </div>
          </div>
          <div className="pt-2 flex items-center gap-2 text-[11px] text-[#6E746F]">
            <ShieldCheck className="w-4 h-4 text-[#123C2F] shrink-0" />
            <span>Multi-vendor settlement & escrow protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
