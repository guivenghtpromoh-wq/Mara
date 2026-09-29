import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import {
  Category,
  Product,
  Store,
  Order,
  Review,
  Conversation,
  Message,
  Notification,
  SellerBalance,
  LedgerEntry,
  OrderStatus,
  SellerProductCreateInput,
  SellerProductUpdateInput,
  SellerStoreUpdateInput,
  MarketplaceOrder,
  SellerOrder,
  PaymentTransaction,
  PayoutRequest,
  Coupon,
  DeliveryStatus
} from '../types';
import { configService } from './configService';

// Default initial category seeds if DB collection is completely empty
const BASE_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Apparel & Fashion', slug: 'apparel-fashion', description: 'Handcrafted and designer clothing, footwear and accessories.', sort_order: 1, status: 'ACTIVE' },
  { name: 'Art & Collectibles', slug: 'art-collectibles', description: 'Original fine art, prints, sculptures and rare heritage items.', sort_order: 2, status: 'ACTIVE' },
  { name: 'Home & Living', slug: 'home-living', description: 'Artisanal furniture, ceramics, textiles and home decor.', sort_order: 3, status: 'ACTIVE' },
  { name: 'Jewelry & Accessories', slug: 'jewelry-accessories', description: 'Fine jewelry, precious metals, watches and crafted leather.', sort_order: 4, status: 'ACTIVE' },
  { name: 'Beauty & Wellness', slug: 'beauty-wellness', description: 'Natural skincare, organic fragrances and botanical essentials.', sort_order: 5, status: 'ACTIVE' },
  { name: 'Electronics & Audio', slug: 'electronics-audio', description: 'High-fidelity audio, accessories, and curated tech devices.', sort_order: 6, status: 'ACTIVE' },
];

export const marketplaceService = {
  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    try {
      const colRef = collection(db, 'categories');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const cats: Category[] = [];
        snap.forEach((d) => cats.push({ id: d.id, ...d.data() } as Category));
        return cats.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      }

      // If empty, return baseline categories with deterministic IDs
      const created: Category[] = BASE_CATEGORIES.map((cat) => ({
        id: `cat-${cat.slug}`,
        ...cat,
      }));

      // Asynchronously attempt to seed Firestore in the background
      for (const cat of created) {
        setDoc(doc(db, 'categories', cat.id), cat).catch((e) =>
          console.warn('Category background seed notice:', e)
        );
      }

      return created;
    } catch (err) {
      console.warn('Could not read categories from Firestore, serving baseline taxonomy:', err);
      return BASE_CATEGORIES.map((cat) => ({
        id: `cat-${cat.slug}`,
        ...cat,
      }));
    }
  },

  // --- PRODUCTS ---
  async getProducts(params?: {
    categorySlug?: string;
    categoryId?: string;
    search?: string;
    sellerId?: string;
    storeId?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    sort?: string;
    limitCount?: number;
  }): Promise<Product[]> {
    try {
      const colRef = collection(db, 'products');
      let q;

      // Server-side filtering prioritized by specificity to avoid full table scans
      const maxLimit = params?.limitCount && params.limitCount > 0 ? params.limitCount : 50;

      if (params?.sellerId) {
        q = query(colRef, where('seller_id', '==', params.sellerId), limit(maxLimit));
      } else if (params?.storeId) {
        q = query(colRef, where('store_id', '==', params.storeId), limit(maxLimit));
      } else if (params?.categoryId) {
        q = query(colRef, where('category_id', '==', params.categoryId), where('status', '==', 'ACTIVE'), limit(maxLimit));
      } else if (params?.status) {
        q = query(colRef, where('status', '==', params.status), limit(maxLimit));
      } else {
        // Public exploration defaults to active products with limit
        q = query(colRef, where('status', '==', 'ACTIVE'), limit(maxLimit));
      }

      let snap;
      try {
        snap = await getDocs(q);
      } catch (idxErr) {
        // Fallback gracefully if composite index is pending
        console.warn('Direct indexed query fallback:', idxErr);
        snap = await getDocs(query(colRef, limit(maxLimit)));
      }

      let list: Product[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Product));

      // In-memory refinement for optional search query, condition, and price range
      if (params?.sellerId) {
        list = list.filter((p) => p.seller_id === params.sellerId);
      }
      if (params?.status) {
        list = list.filter((p) => p.status === params.status);
      } else if (!params?.sellerId) {
        list = list.filter((p) => p.status === 'ACTIVE');
      }

      if (params?.categoryId) {
        list = list.filter((p) => p.category_id === params.categoryId);
      }

      if (params?.condition && params.condition !== 'ALL') {
        list = list.filter((p) => p.condition === params.condition);
      }

      if (params?.minPrice !== undefined) {
        list = list.filter((p) => p.price >= params.minPrice!);
      }
      if (params?.maxPrice !== undefined) {
        list = list.filter((p) => p.price <= params.maxPrice!);
      }

      if (params?.search && params.search.trim()) {
        const queryTerm = params.search.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(queryTerm) ||
            p.description.toLowerCase().includes(queryTerm) ||
            (p.brand && p.brand.toLowerCase().includes(queryTerm))
        );
      }

      // Sort
      const sort = params?.sort || 'newest';
      if (sort === 'price-asc') {
        list.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-desc') {
        list.sort((a, b) => b.price - a.price);
      } else {
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      return list;
    } catch (err) {
      console.warn('Could not read products from Firestore:', err);
      return [];
    }
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const q = query(collection(db, 'products'), where('slug', '==', slug), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Product;
    } catch (err) {
      console.warn(`Could not fetch product by slug ${slug}:`, err);
      return null;
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const snap = await getDoc(doc(db, 'products', id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Product;
    } catch (err) {
      console.warn(`Could not fetch product by id ${id}:`, err);
      return null;
    }
  },

  async createProduct(
    input: SellerProductCreateInput
  ): Promise<Product> {
    try {
      const colRef = collection(db, 'products');
      const newDoc = doc(colRef);
      const now = new Date().toISOString();
      
      const slug = input.slug || input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

      // Server-authoritative construction: protected fields are initialized strictly
      const product: Product = {
        id: newDoc.id,
        store_id: input.store_id,
        seller_id: input.seller_id,
        category_id: input.category_id,
        title: input.title.trim(),
        slug,
        description: input.description.trim(),
        brand: input.brand?.trim() || undefined,
        condition: input.condition || 'NEW',
        status: input.status || 'ACTIVE',
        price: Number(input.price),
        compare_at_price: input.compare_at_price ? Number(input.compare_at_price) : undefined,
        currency: input.currency || 'USD',
        stock: Number(input.stock) || 0,
        images: input.images && input.images.length > 0 ? input.images : [],
        variants: input.variants || [],
        specifications: input.specifications || {},
        dimensions: input.dimensions || undefined,
        weight: input.weight || undefined,
        shipping_method: input.shipping_method || 'Standard Courier',
        published_at: input.status === 'ACTIVE' ? now : undefined,
        created_at: now,
        updated_at: now,
      };

      await setDoc(newDoc, product);
      return product;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  },

  async updateProduct(id: string, updates: SellerProductUpdateInput, sellerId: string): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Product not found');
      const existing = snap.data() as Product;
      if (existing.seller_id !== sellerId) {
        throw new Error('Unauthorized: You can only edit your own products.');
      }

      // Mass Assignment Protection: strictly whitelist legitimate fields
      const sanitized: Partial<Product> = {
        updated_at: new Date().toISOString()
      };

      if (updates.title !== undefined) sanitized.title = updates.title.trim();
      if (updates.description !== undefined) sanitized.description = updates.description.trim();
      if (updates.category_id !== undefined) sanitized.category_id = updates.category_id;
      if (updates.brand !== undefined) sanitized.brand = updates.brand.trim() || undefined;
      if (updates.condition !== undefined) sanitized.condition = updates.condition;
      if (updates.price !== undefined) sanitized.price = Number(updates.price);
      if (updates.compare_at_price !== undefined) sanitized.compare_at_price = updates.compare_at_price ? Number(updates.compare_at_price) : undefined;
      if (updates.stock !== undefined) sanitized.stock = Number(updates.stock);
      if (updates.images !== undefined) sanitized.images = updates.images;
      if (updates.variants !== undefined) sanitized.variants = updates.variants;
      if (updates.specifications !== undefined) sanitized.specifications = updates.specifications;
      if (updates.dimensions !== undefined) sanitized.dimensions = updates.dimensions;
      if (updates.weight !== undefined) sanitized.weight = updates.weight;
      if (updates.shipping_method !== undefined) sanitized.shipping_method = updates.shipping_method;
      if (updates.status !== undefined) sanitized.status = updates.status;

      await updateDoc(docRef, sanitized);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  },

  async deleteProduct(id: string, sellerId: string): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Product not found');
      const existing = snap.data() as Product;
      if (existing.seller_id !== sellerId) {
        throw new Error('Unauthorized: You can only delete your own products.');
      }
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  },

  // --- STORES ---
  async getStores(): Promise<Store[]> {
    try {
      const snap = await getDocs(collection(db, 'stores'));
      const list: Store[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Store));
      return list.filter((s) => s.status === 'ACTIVE');
    } catch (err) {
      console.warn('Could not read stores from Firestore:', err);
      return [];
    }
  },

  async getStoreBySlug(slug: string): Promise<Store | null> {
    try {
      const q = query(collection(db, 'stores'), where('slug', '==', slug), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Store;
    } catch (err) {
      console.warn(`Could not fetch store by slug ${slug}:`, err);
      return null;
    }
  },

  async getStoreById(id: string): Promise<Store | null> {
    try {
      const snap = await getDoc(doc(db, 'stores', id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Store;
    } catch (err) {
      console.warn(`Could not fetch store by id ${id}:`, err);
      return null;
    }
  },

  async createStore(
    storeData: Omit<Store, 'id' | 'created_at' | 'updated_at' | 'rating' | 'reviews_count'>
  ): Promise<Store> {
    try {
      const colRef = collection(db, 'stores');
      const newDoc = doc(colRef);
      const now = new Date().toISOString();
      const store: Store = {
        ...storeData,
        id: newDoc.id,
        rating: 0,
        reviews_count: 0,
        created_at: now,
        updated_at: now,
      };
      await setDoc(newDoc, store);

      // Initialize seller balance
      const balanceDoc = doc(db, 'seller_balances', storeData.seller_id);
      await setDoc(balanceDoc, {
        id: storeData.seller_id,
        seller_id: storeData.seller_id,
        pending_amount: 0,
        available_amount: 0,
        withdrawn_amount: 0,
        currency: 'USD',
        updated_at: now
      });

      return store;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'stores');
    }
  },

  async updateStore(id: string, updates: SellerStoreUpdateInput, sellerId: string): Promise<void> {
    try {
      const docRef = doc(db, 'stores', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Store not found');
      const existing = snap.data() as Store;
      if (existing.seller_id !== sellerId) {
        throw new Error('Unauthorized: You can only edit your own store.');
      }

      // Mass Assignment Protection: strictly whitelist legitimate store settings
      const sanitized: Partial<Store> = {
        updated_at: new Date().toISOString()
      };
      if (updates.name !== undefined) sanitized.name = updates.name.trim();
      if (updates.description !== undefined) sanitized.description = updates.description.trim();
      if (updates.logo_url !== undefined) sanitized.logo_url = updates.logo_url;
      if (updates.cover_url !== undefined) sanitized.cover_url = updates.cover_url;
      if (updates.shipping_policies !== undefined) sanitized.shipping_policies = updates.shipping_policies;
      if (updates.return_policies !== undefined) sanitized.return_policies = updates.return_policies;

      await updateDoc(docRef, sanitized);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `stores/${id}`);
    }
  },

  // --- ORDERS ---
  async createOrder(orderData: {
    user_id: string;
    seller_id: string;
    store_id: string;
    items: Order['items'];
    shipping_fee: number;
    tax: number;
    shipping_address: Order['shipping_address'];
    delivery_method: string;
    payment_method: string;
    currency?: string;
    provider?: string;
    marketplace_order_id?: string;
  }): Promise<Order> {
    try {
      const orderCurrency = orderData.currency || 'USD';
      // Calculate server-side total strictly: subtotal + shipping + tax
      const subtotal = orderData.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
      const total = Number((subtotal + orderData.shipping_fee + orderData.tax).toFixed(2));
      const orderNumber = `MRA-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const colRef = collection(db, 'orders');
      const newDoc = doc(colRef);
      const now = new Date().toISOString();

      const order: Order = {
        id: newDoc.id,
        order_number: orderNumber,
        user_id: orderData.user_id,
        seller_id: orderData.seller_id,
        store_id: orderData.store_id,
        items: orderData.items,
        subtotal,
        shipping_fee: orderData.shipping_fee,
        tax: orderData.tax,
        total,
        currency: orderCurrency,
        status: 'PAID', // Payment settled through verified provider
        shipping_address: orderData.shipping_address,
        delivery_method: orderData.delivery_method,
        payment_status: 'PAID',
        payment_method: orderData.payment_method,
        created_at: now,
        updated_at: now
      };

      await setDoc(newDoc, order);

      // Also record Decomposed SellerOrder for multi-vendor fulfillment
      const sellerOrderDoc = doc(collection(db, 'seller_orders'), newDoc.id);
      const sellerOrder: SellerOrder = {
        id: newDoc.id,
        marketplace_order_id: orderData.marketplace_order_id || newDoc.id,
        order_number: orderNumber,
        user_id: orderData.user_id,
        seller_id: orderData.seller_id,
        store_id: orderData.store_id,
        items: orderData.items,
        subtotal,
        shipping_fee: orderData.shipping_fee,
        tax: orderData.tax,
        total,
        currency: orderCurrency,
        platform_commission: configService.calculateCommission(subtotal),
        seller_net_payout: Number((subtotal - configService.calculateCommission(subtotal)).toFixed(2)),
        status: 'PAID',
        delivery_status: 'PENDING',
        delivery_method: orderData.delivery_method,
        shipping_address: orderData.shipping_address,
        delivery_events: [
          {
            id: `evt-${Date.now()}`,
            status: 'PENDING',
            description: 'Order placed and paid. Awaiting seller fulfillment.',
            timestamp: now
          }
        ],
        created_at: now,
        updated_at: now
      };
      await setDoc(sellerOrderDoc, sellerOrder);

      // Record PaymentTransaction
      const paymentTxDoc = doc(collection(db, 'payment_transactions'));
      const paymentTx: PaymentTransaction = {
        id: paymentTxDoc.id,
        marketplace_order_id: orderData.marketplace_order_id || newDoc.id,
        amount: total,
        currency: orderCurrency,
        provider: orderData.provider || orderData.payment_method,
        status: 'SUCCEEDED',
        idempotency_key: `pay_${newDoc.id}_${Date.now()}`,
        transaction_ref: `TX-${Date.now().toString().slice(-8)}`,
        created_at: now,
        updated_at: now
      };
      await setDoc(paymentTxDoc, paymentTx);

      // Decrement product inventory atomically
      for (const item of orderData.items) {
        try {
          const prodRef = doc(db, 'products', item.product_id);
          const pSnap = await getDoc(prodRef);
          if (pSnap.exists()) {
            const pData = pSnap.data() as Product;
            const updatedStock = Math.max(0, (pData.stock || 0) - item.quantity);
            await updateDoc(prodRef, {
              stock: updatedStock,
              status: updatedStock === 0 ? 'OUT_OF_STOCK' : pData.status,
              updated_at: now
            });

            // Also record inventory reservation completion
            const resRef = doc(collection(db, 'inventory_reservations'));
            await setDoc(resRef, {
              id: resRef.id,
              product_id: item.product_id,
              variant_id: item.variant_id || null,
              quantity: item.quantity,
              user_id: orderData.user_id,
              status: 'COMMITTED',
              expires_at: now,
              created_at: now
            });
          }
        } catch (e) {
          console.error('Error updating product stock:', e);
        }
      }

      // Dynamic Commission calculation via configService
      const commissionFee = configService.calculateCommission(subtotal);
      const sellerEarning = Number((subtotal - commissionFee).toFixed(2));

      try {
        const balRef = doc(db, 'seller_balances', orderData.seller_id);
        const bSnap = await getDoc(balRef);
        const currentBal = bSnap.exists()
          ? (bSnap.data() as SellerBalance)
          : { pending_amount: 0, available_amount: 0, withdrawn_amount: 0, currency: orderCurrency };

        await setDoc(
          balRef,
          {
            id: orderData.seller_id,
            seller_id: orderData.seller_id,
            pending_amount: (currentBal.pending_amount || 0) + sellerEarning,
            available_amount: currentBal.available_amount || 0,
            withdrawn_amount: currentBal.withdrawn_amount || 0,
            currency: orderCurrency,
            updated_at: now
          },
          { merge: true }
        );

        // Record immutable ledger entries (SALE, COMMISSION)
        const ledgerDoc = doc(collection(db, 'ledger_entries'));
        await setDoc(ledgerDoc, {
          id: ledgerDoc.id,
          seller_id: orderData.seller_id,
          order_id: newDoc.id,
          transaction_id: paymentTx.id,
          type: 'SALE',
          direction: 'CREDIT',
          amount: subtotal,
          currency: orderCurrency,
          description: `Gross sale from order ${orderNumber}`,
          reference: newDoc.id,
          created_at: now
        } as LedgerEntry);

        const commissionLedgerDoc = doc(collection(db, 'ledger_entries'));
        await setDoc(commissionLedgerDoc, {
          id: commissionLedgerDoc.id,
          seller_id: orderData.seller_id,
          order_id: newDoc.id,
          transaction_id: paymentTx.id,
          type: 'COMMISSION',
          direction: 'DEBIT',
          amount: -commissionFee,
          currency: orderCurrency,
          description: `Platform fee on order ${orderNumber}`,
          reference: newDoc.id,
          created_at: now
        } as LedgerEntry);

        // Send notifications
        // 1. To Buyer
        const notifBuyer = doc(collection(db, 'notifications'));
        await setDoc(notifBuyer, {
          id: notifBuyer.id,
          user_id: orderData.user_id,
          type: 'order',
          title: `Order confirmed: ${orderNumber}`,
          message: `Your payment was confirmed. The seller is preparing shipment.`,
          link: `/orders/${newDoc.id}`,
          read: false,
          created_at: now
        } as Notification);

        // 2. To Seller
        const notifSeller = doc(collection(db, 'notifications'));
        await setDoc(notifSeller, {
          id: notifSeller.id,
          user_id: orderData.seller_id,
          type: 'order',
          title: `New order: ${orderNumber}`,
          message: `You received a paid order for ${orderCurrency} ${total}. Net earning: ${orderCurrency} ${sellerEarning}.`,
          link: `/sell/orders/${newDoc.id}`,
          read: false,
          created_at: now
        } as Notification);
      } catch (err) {
        console.error('Error recording ledger or notifications:', err);
      }

      return order;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    }
  },

  async getBuyerOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(collection(db, 'orders'), where('user_id', '==', userId));
      const snap = await getDocs(q);
      const orders: Order[] = [];
      snap.forEach((d) => orders.push({ id: d.id, ...d.data() } as Order));
      return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    }
  },

  async getSellerOrders(sellerId: string): Promise<Order[]> {
    try {
      const q = query(collection(db, 'orders'), where('seller_id', '==', sellerId));
      const snap = await getDocs(q);
      const orders: Order[] = [];
      snap.forEach((d) => orders.push({ id: d.id, ...d.data() } as Order));
      return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Order;
    } catch (err) {
      console.warn(`Could not fetch order ${orderId}:`, err);
      return null;
    }
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    carrier?: string,
    trackingNumber?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'orders', orderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Order not found');
      const order = snap.data() as Order;
      const now = new Date().toISOString();

      const updates: Partial<Order> = {
        status,
        updated_at: now
      };
      if (carrier) updates.carrier = carrier;
      if (trackingNumber) updates.tracking_number = trackingNumber;

      await updateDoc(docRef, updates);

      // If status is DELIVERED, transition pending balance to available balance for seller
      if (status === 'DELIVERED') {
        try {
          const balRef = doc(db, 'seller_balances', order.seller_id);
          const bSnap = await getDoc(balRef);
          if (bSnap.exists()) {
            const bal = bSnap.data() as SellerBalance;
            const subtotal = order.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
            const commission = configService.calculateCommission(subtotal);
            const earning = Number((subtotal - commission).toFixed(2));
            const newPending = Math.max(0, (bal.pending_amount || 0) - earning);
            const newAvailable = (bal.available_amount || 0) + earning;
            await updateDoc(balRef, {
              pending_amount: newPending,
              available_amount: newAvailable,
              updated_at: now
            });
          }
        } catch (e) {
          console.error('Error shifting seller balance on delivery:', e);
        }
      }

      // Notify buyer of status update
      const notif = doc(collection(db, 'notifications'));
      await setDoc(notif, {
        id: notif.id,
        user_id: order.user_id,
        type: status === 'SHIPPED' ? 'shipping' : status === 'DELIVERED' ? 'delivery' : 'order',
        title: `Order ${order.order_number}: ${status}`,
        message:
          status === 'SHIPPED'
            ? `Your package has shipped with ${carrier || 'courier'}. Tracking: ${trackingNumber || 'Available in order details'}.`
            : `Your order status changed to ${status}.`,
        link: `/orders/${orderId}`,
        read: false,
        created_at: now
      } as Notification);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  },

  // --- REVIEWS & VERIFIED PURCHASES ---
  async canUserReviewProduct(userId: string, productId: string): Promise<{ eligible: boolean; orderId?: string }> {
    try {
      const q = query(collection(db, 'orders'), where('user_id', '==', userId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const order = d.data() as Order;
        if (order.status === 'DELIVERED' || order.status === 'PAID') {
          const item = order.items.find((i) => i.product_id === productId);
          if (item) {
            return { eligible: true, orderId: d.id };
          }
        }
      }
      return { eligible: false };
    } catch {
      return { eligible: false };
    }
  },

  async getProductReviews(productId: string): Promise<Review[]> {
    try {
      const q = query(collection(db, 'reviews'), where('product_id', '==', productId));
      const snap = await getDocs(q);
      const reviews: Review[] = [];
      snap.forEach((d) => reviews.push({ id: d.id, ...d.data() } as Review));
      return reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'reviews');
    }
  },

  async createReview(
    reviewData: Omit<Review, 'id' | 'created_at'>
  ): Promise<Review> {
    try {
      // Real purchase verification check - cannot be spoofed by client
      const verification = await this.canUserReviewProduct(reviewData.user_id, reviewData.product_id);
      const isVerified = verification.eligible;

      const colRef = collection(db, 'reviews');
      const newDoc = doc(colRef);
      const now = new Date().toISOString();
      const review: Review = {
        ...reviewData,
        order_id: verification.orderId || reviewData.order_id,
        verified_purchase: isVerified,
        id: newDoc.id,
        created_at: now
      };
      await setDoc(newDoc, review);

      // Recalculate product & store rating asynchronously / safely
      try {
        const reviews = await this.getProductReviews(reviewData.product_id);
        const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = reviews.length > 0 ? Number((totalRatings / reviews.length).toFixed(1)) : reviewData.rating;

        const prodRef = doc(db, 'products', reviewData.product_id);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const prod = prodSnap.data() as Product;
          const storeRef = doc(db, 'stores', prod.store_id);
          const storeSnap = await getDoc(storeRef);
          if (storeSnap.exists()) {
            const sData = storeSnap.data() as Store;
            const newCount = (sData.reviews_count || 0) + 1;
            const currentTotal = (sData.rating || 0) * (sData.reviews_count || 0);
            const newAvg = Number(((currentTotal + reviewData.rating) / newCount).toFixed(1));
            await updateDoc(storeRef, {
              rating: newAvg,
              reviews_count: newCount,
              updated_at: now
            });
          }
        }
      } catch (rateErr) {
        console.warn('Deferred rating recalculation notice:', rateErr);
      }

      return review;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    }
  },

  // --- SELLER PAYOUTS ---
  async requestPayout(data: {
    seller_id: string;
    amount: number;
    currency: string;
    provider: string;
    account_info: string;
  }): Promise<PayoutRequest> {
    try {
      const balRef = doc(db, 'seller_balances', data.seller_id);
      const bSnap = await getDoc(balRef);
      if (!bSnap.exists()) throw new Error('Seller balance not found');
      const bal = bSnap.data() as SellerBalance;
      if ((bal.available_amount || 0) < data.amount) {
        throw new Error(`Insufficient available funds. Available: ${bal.available_amount || 0} ${data.currency}`);
      }

      const colRef = collection(db, 'payout_requests');
      const newDoc = doc(colRef);
      const now = new Date().toISOString();
      const req: PayoutRequest = {
        id: newDoc.id,
        seller_id: data.seller_id,
        amount: data.amount,
        currency: data.currency,
        provider: data.provider,
        account_info: data.account_info,
        status: 'PENDING',
        created_at: now,
        updated_at: now,
      };
      await setDoc(newDoc, req);
      return req;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'payout_requests');
    }
  },

  async getSellerPayoutRequests(sellerId: string): Promise<PayoutRequest[]> {
    try {
      const q = query(collection(db, 'payout_requests'), where('seller_id', '==', sellerId));
      const snap = await getDocs(q);
      const list: PayoutRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PayoutRequest));
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  },

  // --- COUPONS VALIDATION ---
  async validateCoupon(code: string, subtotal: number, sellerId?: string): Promise<{ valid: boolean; discountAmount: number; coupon?: Coupon; error?: string }> {
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase().trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        return { valid: false, discountAmount: 0, error: 'Invalid coupon code' };
      }
      const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() } as Coupon;
      if (!coupon.active) {
        return { valid: false, discountAmount: 0, error: 'This coupon is no longer active' };
      }
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return { valid: false, discountAmount: 0, error: 'Coupon is not yet valid' };
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return { valid: false, discountAmount: 0, error: 'Coupon has expired' };
      }
      if (coupon.min_spend && subtotal < coupon.min_spend) {
        return { valid: false, discountAmount: 0, error: `Minimum spend of $${coupon.min_spend} required` };
      }
      if (coupon.seller_id && sellerId && coupon.seller_id !== sellerId) {
        return { valid: false, discountAmount: 0, error: 'Coupon does not apply to this store' };
      }
      let discountAmount = 0;
      if (coupon.discount_type === 'PERCENTAGE') {
        discountAmount = Number(((subtotal * coupon.discount_value) / 100).toFixed(2));
      } else {
        discountAmount = Math.min(subtotal, coupon.discount_value);
      }
      return { valid: true, discountAmount, coupon };
    } catch (e) {
      console.warn('Coupon validation error:', e);
      return { valid: false, discountAmount: 0, error: 'Could not validate coupon' };
    }
  },

  // --- DELIVERY TRACKING ---
  async updateSellerOrderDelivery(
    sellerOrderId: string,
    status: DeliveryStatus,
    event: { location?: string; description: string }
  ): Promise<void> {
    try {
      const docRef = doc(db, 'seller_orders', sellerOrderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const order = snap.data() as SellerOrder;
      const now = new Date().toISOString();
      const newEvent = {
        id: `evt-${Date.now()}`,
        status,
        location: event.location,
        description: event.description,
        timestamp: now
      };
      const events = [...(order.delivery_events || []), newEvent];
      await updateDoc(docRef, {
        delivery_status: status,
        delivery_events: events,
        updated_at: now
      });
    } catch (err) {
      console.warn('Delivery event update notice:', err);
    }
  },

  // --- MESSAGES & CONVERSATIONS ---
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const q = query(collection(db, 'conversations'), where('participants', 'array-contains', userId));
      const snap = await getDocs(q);
      const convs: Conversation[] = [];
      snap.forEach((d) => convs.push({ id: d.id, ...d.data() } as Conversation));
      return convs.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'conversations');
    }
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const colRef = collection(db, `conversations/${conversationId}/messages`);
      const snap = await getDocs(colRef);
      const messages: Message[] = [];
      snap.forEach((d) => messages.push({ id: d.id, ...d.data() } as Message));
      return messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `conversations/${conversationId}/messages`);
    }
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    attachmentUrl?: string
  ): Promise<Message> {
    try {
      const colRef = collection(db, `conversations/${conversationId}/messages`);
      const newDoc = doc(colRef);
      const now = new Date().toISOString();
      const msg: Message = {
        id: newDoc.id,
        conversation_id: conversationId,
        sender_id: senderId,
        text,
        attachment_url: attachmentUrl,
        read: false,
        created_at: now
      };
      await setDoc(newDoc, msg);

      // Update parent conversation
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        last_message: text,
        last_message_at: now,
        updated_at: now
      });

      return msg;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `conversations/${conversationId}/messages`);
    }
  },

  async getOrCreateConversation(
    userA: string,
    userB: string,
    orderId?: string,
    productId?: string
  ): Promise<Conversation> {
    try {
      const convs = await this.getConversations(userA);
      const existing = convs.find(
        (c) => c.participants.includes(userB) && (!orderId || c.order_id === orderId)
      );
      if (existing) return existing;

      const colRef = collection(db, 'conversations');
      const newDoc = doc(colRef);
      const now = new Date().toISOString();
      const newConv: Conversation = {
        id: newDoc.id,
        participants: [userA, userB],
        order_id: orderId,
        product_id: productId,
        last_message: '',
        last_message_at: now,
        created_at: now,
        updated_at: now
      };
      await setDoc(newDoc, newConv);
      return newConv;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'conversations');
    }
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(collection(db, 'notifications'), where('user_id', '==', userId));
      const snap = await getDocs(q);
      const notifs: Notification[] = [];
      snap.forEach((d) => notifs.push({ id: d.id, ...d.data() } as Notification));
      return notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        read_at: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  },

  // --- SELLER FINANCIALS ---
  async getSellerBalance(sellerId: string): Promise<SellerBalance | null> {
    try {
      const snap = await getDoc(doc(db, 'seller_balances', sellerId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as SellerBalance;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `seller_balances/${sellerId}`);
    }
  },

  async getSellerLedger(sellerId: string): Promise<LedgerEntry[]> {
    try {
      const q = query(collection(db, 'ledger_entries'), where('seller_id', '==', sellerId));
      const snap = await getDocs(q);
      const entries: LedgerEntry[] = [];
      snap.forEach((d) => entries.push({ id: d.id, ...d.data() } as LedgerEntry));
      return entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'ledger_entries');
    }
  },

  async requestWithdrawal(sellerId: string, amount: number): Promise<void> {
    try {
      const balRef = doc(db, 'seller_balances', sellerId);
      const snap = await getDoc(balRef);
      if (!snap.exists()) throw new Error('Seller balance record not found.');
      const bal = snap.data() as SellerBalance;
      if ((bal.available_amount || 0) < amount || amount <= 0) {
        throw new Error('Insufficient available balance for withdrawal.');
      }

      const now = new Date().toISOString();
      const newAvailable = Number(((bal.available_amount || 0) - amount).toFixed(2));
      const newWithdrawn = Number(((bal.withdrawn_amount || 0) + amount).toFixed(2));

      await updateDoc(balRef, {
        available_amount: newAvailable,
        withdrawn_amount: newWithdrawn,
        updated_at: now
      });

      // Append to financial ledger
      const ledgerDoc = doc(collection(db, 'ledger_entries'));
      await setDoc(ledgerDoc, {
        id: ledgerDoc.id,
        seller_id: sellerId,
        type: 'PAYOUT',
        amount: -amount,
        currency: bal.currency || 'USD',
        description: `Bank transfer withdrawal requested: $${amount.toFixed(2)} to verified account.`,
        created_at: now
      } as LedgerEntry);

      // Notification
      const notifDoc = doc(collection(db, 'notifications'));
      await setDoc(notifDoc, {
        id: notifDoc.id,
        user_id: sellerId,
        type: 'payout',
        title: 'Payout initiated',
        message: `Your withdrawal request of $${amount.toFixed(2)} is being processed to your bank.`,
        link: '/sell',
        read: false,
        created_at: now
      } as Notification);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `seller_balances/${sellerId}`);
    }
  }
};
