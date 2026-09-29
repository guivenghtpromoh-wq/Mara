import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store as StoreIcon, Star, CheckCircle, ShieldCheck, MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { ProductCard } from '../../components/product/ProductCard';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { marketplaceService } from '../../services/marketplaceService';
import { Store, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const PublicStorePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currentUser } = useAuth();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const loadStoreData = async () => {
      setLoading(true);
      try {
        const st = await marketplaceService.getStoreBySlug(slug);
        if (st) {
          setStore(st);
          const prods = await marketplaceService.getProducts({ storeId: st.id });
          setProducts(prods);
        }
      } catch (err) {
        console.error('Error loading public store:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <EmptyState
        title="Store not found"
        description="The merchant storefront you are looking for does not exist or has been paused."
        actionText="Back to Explore"
        onAction={() => window.location.assign('/explore')}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Cover & Brand Banner */}
      <div className="bg-white rounded-3xl border border-[#E2E4DF] overflow-hidden shadow-xs">
        {/* Cover image if available */}
        <div className="h-36 sm:h-48 w-full bg-[#123C2F] relative overflow-hidden">
          {store.cover_url ? (
            <img src={store.cover_url} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-15">
              <StoreIcon className="w-24 h-24 text-white" />
            </div>
          )}
        </div>

        {/* Identity bar */}
        <div className="p-6 sm:p-8 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-end gap-4 -mt-10 sm:-mt-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <StoreIcon className="w-10 h-10 text-[#123C2F]" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101312]">
                  {store.name}
                </h1>
                <CheckCircle className="w-4 h-4 text-[#123C2F] shrink-0" />
              </div>
              {store.rating > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-[#101312]">
                  <Star className="w-3.5 h-3.5 fill-[#F4C430] text-[#F4C430]" />
                  <span className="font-bold">{store.rating}</span>
                  <span className="text-[#6E746F]">({store.reviews_count} reviews)</span>
                </div>
              ) : (
                <p className="text-xs text-[#6E746F]">Independent Artisan Merchant</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant={following ? 'dark' : 'outline'}
              size="sm"
              onClick={() => setFollowing(!following)}
            >
              {following ? 'Following' : 'Follow Store'}
            </Button>
            <Link to={`/sell/messages?recipient=${store.seller_id}`}>
              <Button variant="secondary" size="sm" icon={<MessageSquare className="w-3.5 h-3.5" />}>
                Message
              </Button>
            </Link>
          </div>
        </div>

        {/* Description & Policies */}
        <div className="px-6 sm:px-8 pb-6 border-t border-[#E2E4DF]/60 pt-4 text-xs text-[#6E746F] space-y-3">
          {store.description && (
            <p className="leading-relaxed max-w-3xl text-sm text-[#101312]/90">
              {store.description}
            </p>
          )}

          <div className="flex flex-wrap gap-6 pt-2 text-[11px]">
            {store.shipping_policies && (
              <div>
                <strong className="text-[#101312]">Shipping: </strong>
                <span>{store.shipping_policies}</span>
              </div>
            )}
            {store.return_policies && (
              <div>
                <strong className="text-[#101312]">Returns: </strong>
                <span>{store.return_policies}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store Products Showcase */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-[#101312]">
          Store Collection ({products.length})
        </h2>

        {products.length === 0 ? (
          <EmptyState
            title="No active products listed"
            description="This store has not published products to its public storefront yet."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} storeName={store.name} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
