import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ArrowRight, Package, Truck, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { Order, OrderStatus } from '../../types';
import { useI18n } from '../../lib/i18n';

export const SellerOrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { formatPrice } = useI18n();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'NEW' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('NEW');

  useEffect(() => {
    if (!currentUser) return;
    marketplaceService
      .getSellerOrders(currentUser.uid)
      .then(setOrders)
      .catch((err) => console.error('Failed to load seller orders:', err))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'NEW') return o.status === 'PAID';
    if (activeTab === 'PROCESSING') return o.status === 'PROCESSING';
    if (activeTab === 'SHIPPED') return o.status === 'SHIPPED';
    if (activeTab === 'DELIVERED') return o.status === 'DELIVERED';
    if (activeTab === 'CANCELLED') return o.status === 'CANCELLED' || o.status === 'REFUNDED';
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
          Seller Orders
        </h1>
        <p className="text-xs text-[#6E746F] mt-1">
          Review, fulfill and track incoming buyer orders
        </p>
      </div>

      {/* Tabs: New, Processing, Shipped, Delivered, Cancelled */}
      <div className="flex items-center gap-2 border-b border-[#E2E4DF] pb-2 overflow-x-auto">
        {[
          { id: 'NEW', label: 'New / Paid' },
          { id: 'PROCESSING', label: 'Processing' },
          { id: 'SHIPPED', label: 'Shipped' },
          { id: 'DELIVERED', label: 'Delivered' },
          { id: 'CANCELLED', label: 'Cancelled / Refunded' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'bg-[#123C2F] text-white shadow-xs'
                : 'text-[#6E746F] hover:text-[#101312] hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-8 h-8 text-[#6E746F]" />}
          title="No orders in this category"
          description="Orders assigned to your store will appear here in real time."
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-5 rounded-2xl border border-[#E2E4DF] shadow-xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2E4DF] text-xs">
                <div>
                  <span className="font-bold text-[#101312]">{order.order_number}</span>
                  <span className="text-[#6E746F] ml-2">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={order.status === 'DELIVERED' ? 'green' : 'yellow'} size="sm">
                    {order.status}
                  </Badge>
                  <span className="font-bold text-[#123C2F]">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-[#6E746F]">
                  Buyer:{' '}
                  <strong className="text-[#101312]">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </strong>{' '}
                  ({order.shipping_address.city}, {order.shipping_address.country})
                </p>
                <p className="text-[#6E746F]">
                  Items:{' '}
                  <span className="text-[#101312]">
                    {order.items.map((it) => `${it.quantity}x ${it.title}`).join(', ')}
                  </span>
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Link to={`/sell/orders/${order.id}`}>
                  <Button variant="outline" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Fulfill order
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
