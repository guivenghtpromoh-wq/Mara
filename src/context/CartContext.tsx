import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant } from '../types';
import { useAuth } from './AuthContext';
import { db, doc, getDoc, setDoc } from '../lib/firebase';

interface CartContextType {
  cart: CartItem[];
  wishlist: string[]; // product IDs
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  subtotal: number;
  itemsCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mara_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mara_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('mara_cart', JSON.stringify(cart));
  }, [cart]);

  // Load wishlist from Firestore when logged in
  useEffect(() => {
    if (!currentUser) return;
    const loadWishlist = async () => {
      try {
        const snap = await getDoc(doc(db, 'wishlists', currentUser.uid));
        if (snap.exists()) {
          const ids = snap.data().product_ids || [];
          setWishlist(ids);
          localStorage.setItem('mara_wishlist', JSON.stringify(ids));
        }
      } catch (err) {
        console.error('Failed to load wishlist from server:', err);
      }
    };
    loadWishlist();
  }, [currentUser]);

  const addToCart = (product: Product, variant?: ProductVariant, quantity = 1) => {
    setCart((prev) => {
      const targetVariantId = variant?.id;
      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.variantId === targetVariantId
      );

      const unitPrice = variant?.price ?? product.price;
      const availableStock = variant?.stock ?? product.stock;

      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIdx].quantity + quantity, availableStock);
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          unitPrice,
          stock: availableStock
        };
        return updated;
      }

      const newItem: CartItem = {
        productId: product.id,
        variantId: targetVariantId,
        quantity: Math.min(quantity, availableStock),
        unitPrice,
        currency: product.currency || 'USD',
        productTitle: product.title,
        variantTitle: variant?.title,
        image: product.images?.[0],
        storeId: product.store_id,
        sellerId: product.seller_id,
        stock: availableStock
      };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variantId === variantId))
    );
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.variantId === variantId) {
          const maxQty = Math.min(quantity, item.stock);
          return { ...item, quantity: maxQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('mara_cart');
  };

  const toggleWishlist = async (productId: string) => {
    const isSaved = wishlist.includes(productId);
    const updated = isSaved ? wishlist.filter((id) => id !== productId) : [...wishlist, productId];
    setWishlist(updated);
    localStorage.setItem('mara_wishlist', JSON.stringify(updated));

    if (currentUser) {
      try {
        await setDoc(doc(db, 'wishlists', currentUser.uid), {
          id: currentUser.uid,
          user_id: currentUser.uid,
          product_ids: updated,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to sync wishlist to Firestore:', err);
      }
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        subtotal,
        itemsCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
