import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { Order, OrderStatus } from '../../types';
import { useI18n } from '../../lib/i18n';

export const SellerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { formatPrice } = useI18n();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update & tracking states
  const [updating, setUpdating] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !currentUser) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const ord = await marketplaceService.getOrderById(id);
        if (ord) {
          if (ord.seller_id !== currentUser.uid) {
            navigate('/sell/orders');
            return;
          }
          setOrder(ord);
          setCarrier(ord.carrier || '');
          setTrackingNumber(ord.tracking_number || '');
        }
      } catch (err) {
        console.error('Failed to load seller order details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, currentUser, navigate]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    setError(null);
    try {
      await marketplaceService.updateOrderStatus(order.id, newStatus, carrier, trackingNumber);
      setOrder({
        ...order,
        status: newStatus,
        carrier: carrier || order.carrier,
        tracking_number: trackingNumber || order.tracking_number
      });
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      setError(err.message || 'Could not update order status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold">Order not found</h2>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/sell/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/sell/orders')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E746F] hover:text-[#101312] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders</span>
      </button>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#123C2F] uppercase tracking-wider">
            Fulfillment Processing
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#101312]">
            Order {order.order_number}
          </h1>
          <p className="text-xs text-[#6E746F] mt-0.5">
            Placed {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={order.status === 'DELIVERED' ? 'green' : 'yellow'} size="md">
            Status: {order.status}
          </Badge>
          <Link to={`/sell/messages?recipient=${order.user_id}`}>
            <Button variant="outline" size="sm" icon={<MessageSquare className="w-3.5 h-3.5" />}>
              Contact Buyer
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Fulfillment Actions Bar */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#101312]">Fulfillment Actions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Courier / Carrier"
            placeholder="e.g. DHL, FedEx, UPS, Local Express"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          />
          <Input
            label="Tracking Number"
            placeholder="e.g. TRK-892374923"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {order.status === 'PAID' && (
            <Button
              variant="outline"
              size="md"
              isLoading={updating}
              onClick={() => handleUpdateStatus('PROCESSING')}
            >
              Mark as Processing
            </Button>
          )}

          {['PAID', 'PROCESSING'].includes(order.status) && (
            <Button
              variant="secondary"
              size="md"
              isLoading={updating}
              onClick={() => handleUpdateStatus('SHIPPED')}
              icon={<Truck className="w-4 h-4" />}
            >
              Mark as Shipped
            </Button>
          )}

          {order.status === 'SHIPPED' && (
            <Button
              variant="primary"
              size="md"
              isLoading={updating}
              onClick={() => handleUpdateStatus('DELIVERED')}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm Delivery & Release Escrow
            </Button>
          )}
        </div>
      </div>

      {/* Customer Delivery Information & Order Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Delivery info */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-3 text-xs">
          <h2 className="text-sm font-bold text-[#101312] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#123C2F]" />
            <span>Shipping Destination</span>
          </h2>
          <p className="font-semibold text-[#101312]">
            {order.shipping_address.first_name} {order.shipping_address.last_name}
          </p>
          <p className="text-[#6E746F]">{order.shipping_address.address_line1}</p>
          <p className="text-[#6E746F]">
            {order.shipping_address.city}, {order.shipping_address.region}{' '}
            {order.shipping_address.postal_code}
          </p>
          <p className="text-[#6E746F]">{order.shipping_address.country}</p>
          <p className="text-[#6E746F] pt-2">
            Selected Service: <strong>{order.delivery_method}</strong>
          </p>
        </div>

        {/* Products */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-3 text-xs">
          <h2 className="text-sm font-bold text-[#101312] flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#123C2F]" />
            <span>Items to Ship ({order.items.length})</span>
          </h2>

          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-1 border-b border-[#E2E4DF]/50">
                <div>
                  <p className="font-semibold text-[#101312]">{item.title}</p>
                  <p className="text-[#6E746F]">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-[#101312]">{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-between font-bold text-sm">
            <span>Total Gross:</span>
            <span className="text-[#123C2F]">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
