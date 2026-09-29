import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  Store as StoreIcon,
  MessageSquare
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { marketplaceService } from '../../services/marketplaceService';
import { Order, Store } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { formatPrice } = useI18n();

  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !currentUser) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const ord = await marketplaceService.getOrderById(id);
        if (ord) {
          // IDOR check: user must be the buyer or seller
          if (ord.user_id !== currentUser.uid && ord.seller_id !== currentUser.uid) {
            navigate('/orders');
            return;
          }
          setOrder(ord);
          const st = await marketplaceService.getStoreById(ord.store_id);
          setStore(st);
        }
      } catch (err) {
        console.error('Failed to load order detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, currentUser, navigate]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold text-[#101312]">Order not found</h2>
        <Button variant="primary" onClick={() => navigate('/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  // Visual Timeline Steps
  const timelineSteps = [
    { key: 'PAID', label: 'Payment Confirmed', icon: CreditCard, completed: true },
    {
      key: 'PROCESSING',
      label: 'Processing Order',
      icon: Clock,
      completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
    },
    {
      key: 'SHIPPED',
      label: 'Shipped',
      icon: Truck,
      completed: ['SHIPPED', 'DELIVERED'].includes(order.status),
    },
    {
      key: 'DELIVERED',
      label: 'Delivered',
      icon: CheckCircle2,
      completed: order.status === 'DELIVERED',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/orders')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E746F] hover:text-[#101312] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders</span>
      </button>

      {/* Header Info */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#6E746F] uppercase tracking-wider">
            Order Details
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
            {order.order_number}
          </h1>
          <p className="text-xs text-[#6E746F] mt-1">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={order.status === 'DELIVERED' ? 'green' : 'yellow'} size="md">
            Status: {order.status}
          </Badge>
          {store && (
            <Link to={`/sell/messages?recipient=${order.seller_id}`}>
              <Button variant="outline" size="sm" icon={<MessageSquare className="w-3.5 h-3.5" />}>
                Contact Merchant
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#101312]">Order Status Timeline</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {timelineSteps.map((step, idx) => (
            <div
              key={step.key}
              className={`p-3.5 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all ${
                step.completed
                  ? 'border-[#123C2F] bg-[#123C2F]/5 text-[#123C2F]'
                  : 'border-[#E2E4DF] bg-[#F7F7F3] text-[#6E746F]'
              }`}
            >
              <step.icon className={`w-5 h-5 ${step.completed ? 'text-[#123C2F]' : 'text-[#6E746F]'}`} />
              <span className="text-xs font-semibold">{step.label}</span>
              {step.completed && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Active / Completed
                </span>
              )}
            </div>
          ))}
        </div>

        {order.tracking_number && (
          <div className="p-3.5 bg-[#F7F7F3] rounded-xl border border-[#E2E4DF] text-xs flex items-center justify-between">
            <span className="text-[#6E746F]">
              Carrier: <strong className="text-[#101312]">{order.carrier || 'Tracked Carrier'}</strong>
            </span>
            <span className="text-[#6E746F]">
              Tracking #: <strong className="text-[#101312]">{order.tracking_number}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Order Items & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#101312]">Products</h2>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between pb-3 border-b border-[#E2E4DF]/60 last:border-none last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F7F7F3] border border-[#E2E4DF] overflow-hidden shrink-0">
                    <img src={item.image || ''} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <Link
                      to={`/product/${item.product_id}`}
                      className="text-xs font-bold text-[#101312] hover:underline line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    {item.variant_title && (
                      <p className="text-[11px] text-[#6E746F]">{item.variant_title}</p>
                    )}
                    <p className="text-[11px] text-[#6E746F]">
                      Quantity: {item.quantity} × {formatPrice(item.unit_price)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#101312]">
                  {formatPrice(item.total_price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Payment Summary */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-5 text-xs">
          <div>
            <h3 className="font-bold text-[#101312] mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#123C2F]" />
              <span>Shipping Address</span>
            </h3>
            <p className="text-[#6E746F]">
              {order.shipping_address.first_name} {order.shipping_address.last_name}
            </p>
            <p className="text-[#6E746F]">{order.shipping_address.address_line1}</p>
            <p className="text-[#6E746F]">
              {order.shipping_address.city}, {order.shipping_address.region}{' '}
              {order.shipping_address.postal_code}
            </p>
            <p className="text-[#6E746F]">{order.shipping_address.country}</p>
          </div>

          <div className="pt-3 border-t border-[#E2E4DF]">
            <h3 className="font-bold text-[#101312] mb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#123C2F]" />
              <span>Payment & Summary</span>
            </h3>
            <div className="space-y-1.5 text-[#6E746F]">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-[#101312]">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-semibold text-[#101312]">{formatPrice(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes:</span>
                <span className="font-semibold text-[#101312]">{formatPrice(order.tax)}</span>
              </div>
              <div className="pt-2 border-t border-[#E2E4DF] flex justify-between font-bold text-sm text-[#101312]">
                <span>Total:</span>
                <span className="text-[#123C2F]">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
