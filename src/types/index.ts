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

export interface LedgerEntry {
  id: string;
  seller_id: string;
  order_id?: string;
  type: 'payment' | 'fee' | 'seller_earning' | 'refund' | 'payout' | 'adjustment';
  amount: number;
  currency: string;
  description: string;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_ids: string[];
  updated_at: string;
}
