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
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
  X,
  CheckCircle
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { marketplaceService } from '../../services/marketplaceService';
import { disputeService } from '../../services/disputeService';
import { Order, Store, Dispute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { formatPrice } = useI18n();

  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('ITEM_NOT_RECEIVED');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [disputeMessage, setDisputeMessage] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  useEffect(() => {
    if (!id || !currentUser) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const [ord, disputesList] = await Promise.all([
          marketplaceService.getOrderById(id),
          disputeService.getDisputes({ userId: currentUser.uid })
        ]);

        if (ord) {
          // IDOR check: user must be the buyer or seller
          if (ord.user_id !== currentUser.uid && ord.seller_id !== currentUser.uid) {
            navigate('/orders');
            return;
          }
          setOrder(ord);
          setRefundAmount(ord.total);
          const st = await marketplaceService.getStoreById(ord.store_id);
          setStore(st);

          // Find if there is an active dispute for this order
          const existingDispute = disputesList.find((d) => d.order_id === ord.id);
          if (existingDispute) {
            setDispute(existingDispute);
          }
        }
      } catch (err) {
        console.error('Failed to load order detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, currentUser, navigate]);

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !currentUser || !disputeMessage.trim()) return;

    setSubmittingDispute(true);
    try {
      const created = await disputeService.createDispute({
        order_id: order.id,
        seller_order_id: order.id,
        buyer_id: currentUser.uid,
        seller_id: order.seller_id,
        reason: disputeReason,
        refund_requested_amount: Number(refundAmount) || order.total,
        initial_message: disputeMessage.trim()
      });
      setDispute(created);
      setDisputeSuccess(true);
      setTimeout(() => {
        setDisputeSuccess(false);
        setShowDisputeModal(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to open dispute:', err);
    } finally {
      setSubmittingDispute(false);
    }
  };

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
          <Badge variant={order.status === 'DELIVERED' ? 'green' : order.status === 'REFUNDED' ? 'red' : 'yellow'} size="md">
            Status: {order.status}
          </Badge>
          {store && (
            <Link to={`/sell/messages?recipient=${order.seller_id}`}>
              <Button variant="outline" size="sm" icon={<MessageSquare className="w-3.5 h-3.5" />}>
                Contact Merchant
              </Button>
            </Link>
          )}
          {!dispute && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
            <Button
              variant="outline"
              size="sm"
              icon={<ShieldAlert className="w-3.5 h-3.5 text-amber-700" />}
              onClick={() => setShowDisputeModal(true)}
            >
              Request Refund / Dispute
            </Button>
          )}
        </div>
      </div>

      {/* Active Dispute Banner */}
      {dispute && (
        <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <h3 className="text-sm font-bold">Buyer Protection Case: {dispute.status}</h3>
                <p className="text-xs text-amber-800">
                  Reason: <strong className="font-semibold">{dispute.reason.replace(/_/g, ' ')}</strong> • Requested Refund: {formatPrice(dispute.refund_requested_amount || order.total)}
                </p>
              </div>
            </div>
            <Badge variant={dispute.status === 'RESOLVED' ? 'green' : dispute.status === 'CLOSED' ? 'gray' : 'yellow'} size="sm">
              {dispute.status}
            </Badge>
          </div>

          {dispute.resolution_notes && (
            <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-[#101312]">
              <span className="font-bold text-[#123C2F]">Resolution Notes: </span>
              {dispute.resolution_notes}
            </div>
          )}

          {dispute.messages && dispute.messages.length > 0 && (
            <div className="pt-2 border-t border-amber-200/60 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-900 uppercase">Case Discussion:</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {dispute.messages.map((m) => (
                  <div key={m.id} className="text-xs p-2 rounded-lg bg-white/80 border border-amber-100 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#101312]">{m.sender_role}: </span>
                      <span className="text-[#6E746F]">{m.text}</span>
                    </div>
                    <span className="text-[10px] text-[#6E746F]/70 shrink-0">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2E4DF]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E4DF]">
              <div className="flex items-center gap-2 text-amber-800">
                <ShieldAlert className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-base text-[#101312]">Open Buyer Protection Case</h3>
              </div>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="p-1.5 rounded-full hover:bg-[#F7F7F3] text-[#6E746F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {disputeSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your dispute has been registered. The seller and MARA dispute team have been notified.</span>
              </div>
            ) : (
              <form onSubmit={handleOpenDispute} className="space-y-4 text-xs">
                <p className="text-[#6E746F]">
                  If you have not received your shipment, or the item received differs significantly from the listing, MARA protects your transaction.
                </p>

                <div>
                  <label className="block font-semibold text-[#101312] mb-1">Reason for Claim</label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E2E4DF] bg-white focus:outline-none focus:border-[#101312]"
                  >
                    <option value="ITEM_NOT_RECEIVED">Item not delivered / Tracking stalled</option>
                    <option value="NOT_AS_DESCRIBED">Item significantly different from description</option>
                    <option value="DAMAGED_ITEM">Item arrived damaged or broken</option>
                    <option value="UNAUTHORIZED_CHARGE">Billing or payment discrepancy</option>
                    <option value="OTHER">Other grievance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#101312] mb-1">Requested Refund Amount ({order.currency || 'USD'})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={order.total}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
                  />
                  <p className="text-[11px] text-[#6E746F] mt-1">
                    Up to order total of {formatPrice(order.total)}.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-[#101312] mb-1">Explain the Issue</label>
                  <textarea
                    required
                    rows={4}
                    value={disputeMessage}
                    onChange={(e) => setDisputeMessage(e.target.value)}
                    placeholder="Provide clear details about the package, condition, communication with seller..."
                    className="w-full p-2.5 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E4DF]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisputeModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={submittingDispute}
                  >
                    Submit Dispute
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
