export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_url?: string;
  country: string;
  language: string;
  currency: string;
  timezone: string;
  phone?: string;
  role?: AppUserRole;
  created_at?: string;
  updated_at?: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  status: 'ACTIVE' | 'PENDING' | 'REJECTED';
  legal_name: string;
  display_name: string;
  country: string;
  verification_status: 'UNVERIFIED' | 'VERIFIED' | 'IN_REVIEW';
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  seller_id: string;
  slug: string;
  name: string;
  logo_url?: string;
  cover_url?: string;
  description: string;
  status: 'ACTIVE' | 'PAUSED' | 'PENDING';
  rating: number;
  reviews_count: number;
  shipping_policies?: string;
  return_policies?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  status: 'ACTIVE' | 'INACTIVE';
  sort_order: number;
}

export type ProductCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'OUT_OF_STOCK' | 'ARCHIVED';

export interface ProductVariantOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  price: number;
  stock: number;
  options: Record<string, string>;
}

export interface Product {
  id: string;
  store_id: string;
  seller_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  brand?: string;
  condition: ProductCondition;
  status: ProductStatus;
  price: number;
  compare_at_price?: number;
  currency: string;
  stock: number;
  images: string[];
  variants?: ProductVariant[];
  specifications?: Record<string, string>;
  dimensions?: string;
  weight?: string;
  shipping_method?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

// Strict Seller DTO for Mass-Assignment Prevention
export interface SellerProductCreateInput {
  store_id: string;
  seller_id: string;
  category_id: string;
  title: string;
  slug?: string;
  description: string;
  brand?: string;
  condition: ProductCondition;
  status: ProductStatus;
  price: number;
  compare_at_price?: number;
  currency?: string;
  stock: number;
  images: string[];
  variants?: ProductVariant[];
  specifications?: Record<string, string>;
  dimensions?: string;
  weight?: string;
  shipping_method?: string;
  published_at?: string;
}

export interface SellerProductUpdateInput {
  title?: string;
  description?: string;
  category_id?: string;
  brand?: string;
  condition?: ProductCondition;
  price?: number;
  compare_at_price?: number;
  stock?: number;
  images?: string[];
  variants?: ProductVariant[];
  specifications?: Record<string, string>;
  dimensions?: string;
  weight?: string;
  shipping_method?: string;
  status?: ProductStatus;
}

export interface SellerStoreUpdateInput {
  name?: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  shipping_policies?: string;
  return_policies?: string;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  productTitle: string;
  variantTitle?: string;
  image?: string;
  storeId: string;
  sellerId: string;
  stock: number;
}

export interface Address {
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAYMENT_PROCESSING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'DISPUTED';

export interface OrderItem {
  product_id: string;
  variant_id?: string;
  title: string;
  variant_title?: string;
  image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  seller_id: string;
  store_id: string;
  items: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  tax: number;
  total: number;
  currency: string;
  status: OrderStatus;
  shipping_address: Address;
  delivery_method: string;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method: string;
  tracking_number?: string;
  carrier?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  order_id?: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  verified_purchase: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  order_id?: string;
  product_id?: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  attachment_url?: string;
  read: boolean;
  created_at: string;
}

export type NotificationType =
  | 'order'
  | 'payment'
  | 'shipping'
  | 'delivery'
  | 'message'
  | 'security'
  | 'seller'
  | 'payout';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export interface SellerBalance {
  id: string;
  seller_id: string;
  pending_amount: number;
  available_amount: number;
  withdrawn_amount: number;
  currency: string;
  updated_at: string;
}

export type LedgerType =
  | 'SALE'
  | 'COMMISSION'
  | 'TAX'
  | 'SHIPPING'
  | 'REFUND'
  | 'PAYOUT'
  | 'ADJUSTMENT'
  | 'CHARGEBACK'
  | 'DISPUTE_ADJUSTMENT'
  // Backward compatibility with legacy entries
  | 'payment'
  | 'fee'
  | 'seller_earning';

export interface LedgerEntry {
  id: string;
  seller_id: string;
  order_id?: string;
  transaction_id?: string;
  type: LedgerType;
  direction?: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  seller_id: string;
  amount: number;
  currency: string;
  provider: string; // 'BANK_TRANSFER' | 'PAYPAL' | 'STRIPE_CONNECT' | 'MOBILE_MONEY' | 'LOCAL_PROVIDER'
  account_info: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  admin_notes?: string;
  transaction_ref?: string;
  created_at: string;
  updated_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_ids: string[];
  updated_at: string;
}

// ==========================================
// GLOBAL-FIRST MARKETPLACE EXTENSIONS
// ==========================================

export type AppUserRole = 'BUYER' | 'SELLER' | 'ADMIN' | 'MODERATOR';

export interface CountryConfig {
  code: string; // ISO 3166-1 alpha-2 (e.g. US, CA, FR, HT, DO, MX, GB)
  name: string;
  phone_code: string; // +1, +509, +33, etc.
  default_currency: string;
  default_language: string;
  postal_code_required: boolean;
  address_fields: ('street' | 'apartment' | 'city' | 'region' | 'postal_code' | 'district')[];
  active: boolean;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rate_against_usd: number;
  decimals: number;
  symbol_position: 'BEFORE' | 'AFTER';
  active: boolean;
}

export interface TaxRule {
  id: string;
  country_code: string;
  region_code?: string; // Optional state/province
  tax_name: string; // VAT, GST, Sales Tax, etc.
  rate: number; // e.g. 0.10 for 10%
  is_inclusive: boolean; // true if prices already include tax
  active: boolean;
}

export interface CommissionRule {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED' | 'HYBRID';
  percentage_rate: number; // e.g. 0.05 for 5%
  fixed_fee: number; // e.g. $0.50
  category_id?: string;
  country_code?: string;
  min_fee?: number;
  max_fee?: number;
  active: boolean;
}

export interface PaymentProviderConfig {
  id: string;
  code: 'STRIPE' | 'PAYPAL' | 'LOCAL_GATEWAY' | 'MOBILE_MONEY';
  name: string;
  supported_countries: string[];
  supported_currencies: string[];
  is_test_mode: boolean;
  active: boolean;
}

export interface DeliveryProviderConfig {
  id: string;
  code: 'MARKETPLACE_COURIER' | 'POSTAL_SERVICE' | 'EXPRESS_CARRIER' | 'STORE_PICKUP';
  name: string;
  country_code: string;
  base_rate: number;
  per_kg_rate: number;
  estimated_days: string;
  supports_pickup: boolean;
  active: boolean;
}

export type PaymentTransactionStatus =
  | 'INITIATED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface PaymentTransaction {
  id: string;
  marketplace_order_id: string;
  amount: number;
  currency: string;
  provider: string;
  status: PaymentTransactionStatus;
  idempotency_key: string;
  transaction_ref?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export type DeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface DeliveryEvent {
  id: string;
  status: DeliveryStatus;
  location?: string;
  description: string;
  timestamp: string;
}

// Decomposed Multi-Vendor Order Model
export interface SellerOrder {
  id: string;
  marketplace_order_id: string;
  order_number: string;
  user_id: string; // Buyer ID
  seller_id: string;
  store_id: string;
  items: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  tax: number;
  total: number;
  currency: string;
  platform_commission: number;
  seller_net_payout: number;
  status: OrderStatus;
  delivery_status: DeliveryStatus;
  delivery_method: string;
  tracking_number?: string;
  carrier?: string;
  shipping_address: Address;
  delivery_events?: DeliveryEvent[];
  created_at: string;
  updated_at: string;
}

export interface MarketplaceOrder {
  id: string;
  order_number: string;
  user_id: string; // Buyer ID
  seller_order_ids: string[];
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  currency: string;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method: string;
  payment_transaction_id?: string;
  shipping_address: Address;
  created_at: string;
  updated_at: string;
}

export interface InventoryReservation {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  user_id: string;
  status: 'RESERVED' | 'COMMITTED' | 'RELEASED';
  expires_at: string;
  created_at: string;
}

export interface DisputeMessage {
  id: string;
  sender_id: string;
  sender_role: 'BUYER' | 'SELLER' | 'ADMIN';
  text: string;
  attachment_url?: string;
  created_at: string;
}

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'WAITING' | 'RESOLVED' | 'CLOSED';

export interface Dispute {
  id: string;
  order_id: string;
  seller_order_id: string;
  buyer_id: string;
  seller_id: string;
  reason: string;
  status: DisputeStatus;
  dispute_type: 'BUYER_VS_SELLER' | 'BUYER_VS_PLATFORM';
  refund_requested_amount?: number;
  resolution_notes?: string;
  resolved_at?: string;
  messages: DisputeMessage[];
  created_at: string;
  updated_at: string;
}

export interface RefundRecord {
  id: string;
  order_id: string;
  seller_order_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  transaction_ref?: string;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_spend?: number;
  seller_id?: string; // Optional: store-specific or global
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  times_used: number;
  active: boolean;
}

export type ModerationTargetType = 'PRODUCT' | 'STORE' | 'USER' | 'REVIEW';
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface ModerationReport {
  id: string;
  target_type: ModerationTargetType;
  target_id: string;
  reporter_id: string;
  reason: string;
  details?: string;
  status: ModerationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  action_taken?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
