import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Sparkles, TrendingUp, Store as StoreIcon, Clock } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { ProductCard } from '../../components/product/ProductCard';
import { StoreCard } from '../../components/store/StoreCard';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { marketplaceService } from '../../services/marketplaceService';
import { Category, Product, Store } from '../../types';
import { useI18n } from '../../lib/i18n';

export const HomePage: React.FC = () => {
  const { t } = useI18n();

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [cats, prods, sts] = await Promise.all([
          marketplaceService.getCategories(),
          marketplaceService.getProducts({ limitCount: 8 }),
          marketplaceService.getStores(),
        ]);
        setCategories(cats);
        setFeaturedProducts(prods);
        setStores(sts);

        // Load recently viewed IDs from local session
        try {
          const viewedIds: string[] = JSON.parse(localStorage.getItem('mara_recently_viewed') || '[]');
          if (viewedIds.length > 0) {
            const viewed = await Promise.all(viewedIds.slice(0, 4).map((id) => marketplaceService.getProductById(id)));
            setRecentlyViewed(viewed.filter(Boolean) as Product[]);
          }
        } catch (e) {
          console.error('Error reading recently viewed:', e);
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 2. Hero Section: Light on mobile, signature dark on web model */}
      <section className="relative overflow-hidden rounded-3xl bg-white md:bg-[#101312] text-[#101312] md:text-white p-6 sm:p-12 lg:p-16 border border-[#E2E4DF] md:border-[#181B19] shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F7F3] md:bg-white/10 text-[#101312] md:text-white text-xs font-semibold backdrop-blur-xs border border-[#E2E4DF] md:border-white/15">
            <span className="w-2 h-2 rounded-full bg-[#F4C430]" />
            MARA Marketplace
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#101312] md:text-white leading-[1.15]">
            {t('home.hero.title')}
          </h1>
          <p className="text-sm sm:text-base text-[#6E746F] md:text-[#E2E4DF]/80 leading-relaxed max-w-lg">
            {t('home.hero.subtitle')}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link to="/explore">
              <Button variant="primary" size="lg">
                <span>{t('home.hero.cta')}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/sell">
              <Button
                variant="outline"
                size="lg"
                className="border-[#E2E4DF] text-[#101312] bg-[#F7F7F3] hover:bg-[#E2E4DF]/60 md:border-white/30 md:text-white md:bg-white/10 md:hover:bg-white/20"
              >
                <span>Become a seller</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Subtle decorative background gradient on web */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none bg-gradient-to-l from-[#F4C430] to-transparent blur-3xl" />
      </section>

      {/* 3. Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101312]">
            {t('home.categories')}
          </h2>
          <Link
            to="/explore"
            className="text-xs font-semibold text-[#123C2F] hover:underline flex items-center gap-1"
          >
            <span>Browse all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon={<Compass className="w-6 h-6" />}
            title="No categories found"
            description="Categories will appear here once configured."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group p-4 bg-white rounded-2xl border border-[#E2E4DF] hover:border-[#101312] transition-all flex flex-col justify-between hover:shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-[#F4C430]/15 text-[#101312] flex items-center justify-center font-bold text-xs mb-3 group-hover:bg-[#F4C430] transition-colors">
                  {cat.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#101312] group-hover:text-[#123C2F] transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-[#6E746F]">Explore →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. Featured products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F4C430]" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101312]">
              {t('home.featured')}
            </h2>
          </div>
          <Link
            to="/explore"
            className="text-xs font-semibold text-[#123C2F] hover:underline flex items-center gap-1"
          >
            <span>See more</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-6 h-6" />}
            title="No products yet"
            description="Be the first to list an item in the marketplace."
            actionText="Publish product"
            onAction={() => window.location.assign('/sell/products/new')}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Trending Products (Only shown if enough products exist) */}
      {featuredProducts.length >= 4 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#123C2F]" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101312]">
              {t('home.trending')}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.slice(0, 4).map((prod) => (
              <ProductCard key={`trending-${prod.id}`} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Stores */}
      {stores.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StoreIcon className="w-5 h-5 text-[#123C2F]" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101312]">
                {t('home.stores')}
              </h2>
            </div>
            <Link
              to="/explore"
              className="text-xs font-semibold text-[#123C2F] hover:underline flex items-center gap-1"
            >
              <span>All stores</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </section>
      )}

      {/* 7. Recently Viewed (Based on real browsing history) */}
      {recentlyViewed.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-[#E2E4DF]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#6E746F]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#101312]">
              {t('home.recentlyViewed')}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentlyViewed.map((prod) => (
              <ProductCard key={`rec-${prod.id}`} product={prod} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
