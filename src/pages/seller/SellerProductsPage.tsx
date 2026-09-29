import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ExternalLink, Package } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { Product } from '../../types';
import { useI18n } from '../../lib/i18n';

export const SellerProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, sellerStore } = useAuth();
  const { formatPrice } = useI18n();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK'>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const list = await marketplaceService.getProducts({ sellerId: currentUser.uid });
      setProducts(list);
    } catch (err) {
      console.error('Failed to load seller products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentUser]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      if (currentUser) {
        await marketplaceService.deleteProduct(id, currentUser.uid);
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Could not delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return p.status === 'ACTIVE';
    if (filter === 'DRAFT') return p.status === 'DRAFT';
    if (filter === 'OUT_OF_STOCK') return p.status === 'OUT_OF_STOCK' || p.stock <= 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
            Products
          </h1>
          <p className="text-xs text-[#6E746F] mt-1">
            Manage your storefront inventory, pricing and stock availability
          </p>
        </div>

        <Link to="/sell/products/new">
          <Button variant="secondary" size="md" icon={<Plus className="w-4 h-4" />}>
            Add product
          </Button>
        </Link>
      </div>

      {/* Filter Tabs: All, Active, Drafts, Out of stock */}
      <div className="flex items-center gap-2 border-b border-[#E2E4DF] pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All' },
          { id: 'ACTIVE', label: 'Active' },
          { id: 'DRAFT', label: 'Drafts' },
          { id: 'OUT_OF_STOCK', label: 'Out of stock' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              filter === tab.id
                ? 'bg-[#101312] text-white shadow-xs'
                : 'text-[#6E746F] hover:text-[#101312] hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-[#6E746F]" />}
          title="No products in this view"
          description="Click Add Product to start listing inventory in your store."
          actionText="Add product"
          onAction={() => navigate('/sell/products/new')}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-[#E2E4DF] overflow-hidden shadow-xs divide-y divide-[#E2E4DF]">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F7F3]/50 transition-colors"
            >
              {/* Product Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#F7F7F3] border border-[#E2E4DF] overflow-hidden shrink-0">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#101312] truncate max-w-sm">
                      {p.title}
                    </h3>
                    <Badge variant={p.status === 'ACTIVE' ? 'green' : 'gray'} size="sm">
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#6E746F]">
                    Price: <strong className="text-[#101312]">{formatPrice(p.price)}</strong> • Stock:{' '}
                    <strong className={p.stock <= 2 ? 'text-red-600' : 'text-[#101312]'}>
                      {p.stock} units
                    </strong>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:self-center">
                <Link to={`/product/${p.slug}`}>
                  <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                    View
                  </Button>
                </Link>
                <Link to={`/sell/products/${p.id}`}>
                  <Button variant="outline" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />}>
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  isLoading={deletingId === p.id}
                  onClick={() => handleDelete(p.id, p.title)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
