import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search as SearchIcon, X, Check } from 'lucide-react';
import { ProductCard } from '../../components/product/ProductCard';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { marketplaceService } from '../../services/marketplaceService';
import { Product, Category } from '../../types';
import { useI18n } from '../../lib/i18n';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, formatPrice } = useI18n();

  const searchQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialSort = searchParams.get('sort') || 'newest';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortOption, setSortOption] = useState<string>(initialSort);
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    marketplaceService.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const cat = categories.find((c) => c.slug === selectedCategory);
        const prods = await marketplaceService.getProducts({
          categoryId: cat?.id,
          search: searchQuery,
          sort: sortOption,
          condition: conditionFilter,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
        });
        setProducts(prods);
      } catch (err) {
        console.error('Error fetching explore products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiltered();
  }, [selectedCategory, sortOption, conditionFilter, minPrice, maxPrice, searchQuery, categories]);

  const handleClearFilters = () => {
    setSelectedCategory('ALL');
    setSortOption('newest');
    setConditionFilter('ALL');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search Query Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
          {searchQuery ? `Search results for "${searchQuery}"` : t('nav.explore')}
        </h1>
        <p className="text-xs text-[#6E746F] mt-1">
          {t('search.resultsCount', { count: products.length })}
        </p>
      </div>

      {/* Category Shortcuts Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-[#101312] text-white shadow-xs'
              : 'bg-white border border-[#E2E4DF] text-[#101312] hover:border-[#101312]'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.slug)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              selectedCategory === c.slug
                ? 'bg-[#101312] text-white shadow-xs'
                : 'bg-white border border-[#E2E4DF] text-[#101312] hover:border-[#101312]'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Toolbar: Sort + Filter trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E2E4DF]">
        <div className="flex items-center gap-2">
          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          >
            <span>{t('search.filters')}</span>
            {(conditionFilter !== 'ALL' || minPrice || maxPrice) && (
              <span className="w-2 h-2 rounded-full bg-[#F4C430]" />
            )}
          </Button>

          {(conditionFilter !== 'ALL' || minPrice || maxPrice || selectedCategory !== 'ALL') && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-[#6E746F] hover:text-[#101312] underline cursor-pointer"
            >
              {t('search.clearFilters')}
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sortSelect" className="text-xs text-[#6E746F] font-medium hidden sm:inline">
            {t('search.sort')}:
          </label>
          <select
            id="sortSelect"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="text-xs font-semibold bg-[#F7F7F3] border border-[#E2E4DF] rounded-xl px-3 py-1.5 text-[#101312] focus:outline-none focus:border-[#101312] cursor-pointer"
          >
            <option value="relevance">{t('sort.relevance')}</option>
            <option value="newest">{t('sort.newest')}</option>
            <option value="price-asc">{t('sort.priceAsc')}</option>
            <option value="price-desc">{t('sort.priceDesc')}</option>
            <option value="top-rated">{t('sort.topRated')}</option>
          </select>
        </div>
      </div>

      {/* Main Grid & Desktop Filter Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block lg:col-span-1 space-y-6 bg-white p-5 rounded-2xl border border-[#E2E4DF] h-fit sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E4DF]">
            <h3 className="text-sm font-bold text-[#101312] uppercase tracking-wider">
              {t('search.filters')}
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-xs text-[#6E746F] hover:text-[#101312] cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#101312]">Condition</h4>
            <div className="space-y-1.5">
              {['ALL', 'NEW', 'LIKE_NEW', 'GOOD'].map((c) => (
                <label key={c} className="flex items-center gap-2 text-xs text-[#6E746F] cursor-pointer hover:text-[#101312]">
                  <input
                    type="radio"
                    name="condition"
                    checked={conditionFilter === c}
                    onChange={() => setConditionFilter(c)}
                    className="text-[#101312] focus:ring-[#101312]"
                  />
                  <span>{c === 'ALL' ? 'Any Condition' : c.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2 pt-2 border-t border-[#E2E4DF]">
            <h4 className="text-xs font-semibold text-[#101312]">Price (USD)</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
              />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="w-8 h-8 text-[#6E746F]" />}
              title={t('search.noResults')}
              description={t('search.noResultsDesc')}
              actionText={t('search.clearFilters')}
              onAction={handleClearFilters}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-xl space-y-5 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E4DF]">
              <h3 className="text-base font-bold text-[#101312]">{t('search.filters')}</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-[#6E746F] hover:text-[#101312]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#101312]">Condition</h4>
              <div className="grid grid-cols-2 gap-2">
                {['ALL', 'NEW', 'LIKE_NEW', 'GOOD'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setConditionFilter(c)}
                    className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      conditionFilter === c
                        ? 'border-[#101312] bg-[#101312] text-white'
                        : 'border-[#E2E4DF] bg-white text-[#101312]'
                    }`}
                  >
                    {c === 'ALL' ? 'Any Condition' : c.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#101312]">Price (USD)</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={handleClearFilters}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => setMobileFilterOpen(false)}
              >
                Show results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
