import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../../components/product/ProductCard';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { marketplaceService } from '../../services/marketplaceService';
import { Category, Product } from '../../types';
import { useI18n } from '../../lib/i18n';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useI18n();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<string>('newest');

  useEffect(() => {
    if (!slug) return;
    const loadCategory = async () => {
      setLoading(true);
      try {
        const cats = await marketplaceService.getCategories();
        const found = cats.find((c) => c.slug === slug);
        if (found) {
          setCategory(found);
          const prods = await marketplaceService.getProducts({
            categoryId: found.id,
            sort: sortOption
          });
          setProducts(prods);
        }
      } catch (err) {
        console.error('Error loading category:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [slug, sortOption]);

  if (!loading && !category) {
    return (
      <EmptyState
        title="Category not found"
        description="The category you requested does not exist or has been removed."
        actionText="Back to Explore"
        onAction={() => window.location.assign('/explore')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[#6E746F]">
        <Link to="/" className="hover:text-[#101312] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/explore" className="hover:text-[#101312] transition-colors">
          Explore
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-[#101312]">{category?.name || 'Category'}</span>
      </nav>

      {/* Header Info */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
          {category?.name}
        </h1>
        {category?.description && (
          <p className="mt-2 text-sm text-[#6E746F] max-w-2xl leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      {/* Sorting bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6E746F]">
          {products.length} {products.length === 1 ? 'product' : 'products'} available
        </span>
        <div className="flex items-center gap-2">
          <label htmlFor="catSort" className="text-xs text-[#6E746F] font-medium">
            Sort:
          </label>
          <select
            id="catSort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="text-xs font-semibold bg-white border border-[#E2E4DF] rounded-xl px-3 py-1.5 text-[#101312] focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price low to high</option>
            <option value="price-desc">Price high to low</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title={`No products in ${category?.name} yet`}
          description="Independent sellers have not published items in this category yet."
          actionText="Explore other categories"
          onAction={() => window.location.assign('/explore')}
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
