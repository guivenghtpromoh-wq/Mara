import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle2, XCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { marketplaceService } from '../../services/marketplaceService';
import { Order, OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';

export const OrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t, formatPrice } = useI18n();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    if (!currentUser) return;
    marketplaceService
      .getBuyerOrders(currentUser.uid)
      .then(setOrders)
      .catch((err) => console.error('Failed to load buyer orders:', err))
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-[#101312]">Sign in to view your orders</h2>
        <p className="text-xs text-[#6E746F]">Track packages and view receipts for your orders.</p>
        <Link to="/auth/sign-in?redirect=/orders">
          <Button variant="primary" size="lg" className="w-full">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PROCESSING') return o.status === 'PROCESSING' || o.status === 'PAID';
    if (activeTab === 'SHIPPED') return o.status === 'SHIPPED';
    if (activeTab === 'DELIVERED') return o.status === 'DELIVERED';
    if (activeTab === 'CANCELLED') return o.status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="green">Delivered</Badge>;
      case 'SHIPPED':
        return <Badge variant="yellow">Shipped</Badge>;
      case 'PAID':
      case 'PROCESSING':
        return <Badge variant="blue">Processing</Badge>;
      case 'CANCELLED':
        return <Badge variant="red">Cancelled</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
          {t('orders.title')}
        </h1>
        <p className="text-xs text-[#6E746F] mt-1">
          Review details, tracking information and delivery history
        </p>
      </div>

      {/* Tabs: All, Processing, Shipped, Delivered, Cancelled */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E2E4DF]">
        {[
          { id: 'ALL', label: t('orders.tab.all') },
          { id: 'PROCESSING', label: t('orders.tab.processing') },
          { id: 'SHIPPED', label: t('orders.tab.shipped') },
          { id: 'DELIVERED', label: t('orders.tab.delivered') },
          { id: 'CANCELLED', label: t('orders.tab.cancelled') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'bg-[#101312] text-white shadow-xs'
                : 'text-[#6E746F] hover:text-[#101312] hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-[#6E746F]" />}
          title={t('orders.empty')}
          description={t('orders.emptyDesc')}
          actionText={t('home.hero.cta')}
          onAction={() => window.location.assign('/explore')}
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-[#E2E4DF] p-5 shadow-xs space-y-4"
            >
              {/* Top Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E4DF] text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#101312]">Order {order.order_number}</span>
                  <span className="text-[#6E746F]">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                  <span className="font-bold text-[#101312]">{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Items Preview */}
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F7F7F3] border border-[#E2E4DF] overflow-hidden shrink-0">
                        <img src={item.image || ''} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#101312] line-clamp-1">{item.title}</p>
                        <p className="text-[#6E746F]">
                          Qty: {item.quantity} × {formatPrice(item.unit_price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[#101312]">{formatPrice(item.total_price)}</span>
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#E2E4DF]/60 flex items-center justify-between text-xs">
                <span className="text-[#6E746F]">
                  Delivery: {order.delivery_method}
                </span>
                <Link to={`/orders/${order.id}`}>
                  <Button variant="outline" size="sm">
                    <span>View details</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
