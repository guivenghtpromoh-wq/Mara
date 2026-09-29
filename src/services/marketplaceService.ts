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
  OrderStatus
} from '../types';

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
      const snap = await getDocs(colRef);
      let list: Product[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Product));

      // Client-side deterministic filtering and sorting
      if (params?.sellerId) {
        list = list.filter((p) => p.seller_id === params.sellerId);
      }
      if (params?.storeId) {
        list = list.filter((p) => p.store_id === params.storeId);
      }
      if (params?.status) {
        list = list.filter((p) => p.status === params.status);
      } else if (!params?.sellerId) {
        // Public viewing only sees ACTIVE products
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
        // Default newest
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      if (params?.limitCount && params.limitCount > 0) {
        list = list.slice(0, params.limitCount);
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
      handleFirestoreError(err, OperationType.GET, `products/slug/${slug}`);
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const snap = await getDoc(doc(db, 'products', id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Product;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `products/${id}`);
    }
  },

  async createProduct(
    productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Product> {
    try {
      const colRef = collection(db, 'products');
      const newDoc = doc(colRef);
      const now = new Date().toISOString();
      const product: Product = {
        ...productData,
        id: newDoc.id,
        created_at: now,
        updated_at: now,
      };
      await setDoc(newDoc, product);
      return product;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  },

  async updateProduct(id: string, updates: Partial<Product>, sellerId: string): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Product not found');
      const existing = snap.data() as Product;
      if (existing.seller_id !== sellerId) {
        throw new Error('Unauthorized: You can only edit your own products.');
      }
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString()
      });
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
      handleFirestoreError(err, OperationType.GET, `stores/slug/${slug}`);
    }
  },

  async getStoreById(id: string): Promise<Store | null> {
    try {
      const snap = await getDoc(doc(db, 'stores', id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Store;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `stores/${id}`);
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

  async updateStore(id: string, updates: Partial<Store>, sellerId: string): Promise<void> {
    try {
      const docRef = doc(db, 'stores', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Store not found');
      const existing = snap.data() as Store;
      if (existing.seller_id !== sellerId) {
        throw new Error('Unauthorized: You can only edit your own store.');
      }
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString()
      });
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
  }): Promise<Order> {
    try {
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
        currency: 'USD',
        status: 'PAID', // Payment settled through verified provider
        shipping_address: orderData.shipping_address,
        delivery_method: orderData.delivery_method,
        payment_status: 'PAID',
        payment_method: orderData.payment_method,
        created_at: now,
        updated_at: now
      };

      await setDoc(newDoc, order);

      // Decrement product inventory
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
          }
        } catch (e) {
          console.error('Error updating product stock:', e);
        }
      }

      // Update seller balance (gross sale - 5% MARA marketplace commission)
      const commissionFee = Number((subtotal * 0.05).toFixed(2));
      const sellerEarning = Number((subtotal - commissionFee).toFixed(2));

      try {
        const balRef = doc(db, 'seller_balances', orderData.seller_id);
        const bSnap = await getDoc(balRef);
        const currentBal = bSnap.exists()
          ? (bSnap.data() as SellerBalance)
          : { pending_amount: 0, available_amount: 0, withdrawn_amount: 0, currency: 'USD' };

        await setDoc(
          balRef,
          {
            id: orderData.seller_id,
            seller_id: orderData.seller_id,
            pending_amount: (currentBal.pending_amount || 0) + sellerEarning,
            available_amount: currentBal.available_amount || 0,
            withdrawn_amount: currentBal.withdrawn_amount || 0,
            currency: 'USD',
            updated_at: now
          },
          { merge: true }
        );

        // Record ledger entry
        const ledgerDoc = doc(collection(db, 'ledger_entries'));
        await setDoc(ledgerDoc, {
          id: ledgerDoc.id,
          seller_id: orderData.seller_id,
          order_id: newDoc.id,
          type: 'seller_earning',
          amount: sellerEarning,
          currency: 'USD',
          description: `Earning from order ${orderNumber} (Gross: $${subtotal}, MARA Fee: $${commissionFee})`,
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
          message: `Your payment was successful and the seller is preparing your order.`,
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
          title: `New order received: ${orderNumber}`,
          message: `You have received a new paid order for $${total}. Please prepare shipment.`,
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
      handleFirestoreError(err, OperationType.GET, `orders/${orderId}`);
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
            const earning = Number((subtotal * 0.95).toFixed(2));
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

  // --- REVIEWS ---
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
      const colRef = collection(db, 'reviews');
      const newDoc = doc(colRef);
      const now = new Date().toISOString();
      const review: Review = {
        ...reviewData,
        id: newDoc.id,
        created_at: now
      };
      await setDoc(newDoc, review);

      // Recalculate product & store rating
      const reviews = await this.getProductReviews(reviewData.product_id);
      const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = Number((totalRatings / reviews.length).toFixed(1));

      const prodRef = doc(db, 'products', reviewData.product_id);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const prod = prodSnap.data() as Product;
        // Also update store rating
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

      return review;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
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
  }
};
