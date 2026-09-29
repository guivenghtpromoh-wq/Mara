import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductCard } from '../../components/product/ProductCard';
import { useCart } from '../../context/CartContext';
import { marketplaceService } from '../../services/marketplaceService';
import { Product } from '../../types';
import { useI18n } from '../../lib/i18n';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { wishlist } = useCart();
  const { t } = useI18n();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlistItems = async () => {
      setLoading(true);
      try {
        if (wishlist.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }
        const prods = await Promise.all(
          wishlist.map((id) => marketplaceService.getProductById(id))
        );
        setProducts(prods.filter(Boolean) as Product[]);
      } catch (err) {
        console.error('Failed to load wishlist products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWishlistItems();
  }, [wishlist]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
          {t('nav.wishlist')}
        </h1>
        <p className="text-xs text-[#6E746F] mt-1">
          {products.length} {products.length === 1 ? 'saved item' : 'saved items'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-8 h-8 text-[#6E746F]" />}
          title="Your wishlist is empty"
          description="Save items you love so you can easily find and purchase them later."
          actionText="Explore marketplace"
          onAction={() => navigate('/explore')}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
