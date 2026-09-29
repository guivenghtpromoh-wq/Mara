import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  Store,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { Order, Product, SellerBalance, LedgerEntry } from '../../types';
import { useI18n } from '../../lib/i18n';

export const SellerOverviewPage: React.FC = () => {
  const { currentUser, sellerStore } = useAuth();
  const { formatPrice } = useI18n();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [balance, setBalance] = useState<SellerBalance | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawNotice, setWithdrawNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const loadSellerData = async () => {
      setLoading(true);
      try {
        const [ordList, prodList, bal, ledg] = await Promise.all([
          marketplaceService.getSellerOrders(currentUser.uid),
          marketplaceService.getProducts({ sellerId: currentUser.uid }),
          marketplaceService.getSellerBalance(currentUser.uid),
          marketplaceService.getSellerLedger(currentUser.uid),
        ]);
        setOrders(ordList);
        setProducts(prodList);
        setBalance(bal);
        setLedger(ledg);
      } catch (err) {
        console.error('Failed to load seller overview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSellerData();
  }, [currentUser]);

  if (!sellerStore) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-4">
        <Store className="w-12 h-12 text-[#123C2F] mx-auto" />
        <h2 className="text-2xl font-bold text-[#101312]">No store activated yet</h2>
        <p className="text-xs text-[#6E746F]">
          Activate your storefront on MARA to start publishing products and receiving global orders.
        </p>
        <Link to="/sell/onboarding">
          <Button variant="secondary" size="lg">
            Activate Seller Store
          </Button>
        </Link>
      </div>
    );
  }

  // Real calculations
  const totalSales = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.subtotal : 0), 0);
  const validOrdersCount = orders.filter((o) => o.status !== 'CANCELLED').length;
  const availableBal = balance?.available_amount || 0;
  const pendingBal = balance?.pending_amount || 0;

  const handleWithdraw = async () => {
    if (!currentUser || availableBal <= 0) return;
    setWithdrawing(true);
    setWithdrawNotice(null);
    try {
      await marketplaceService.requestWithdrawal(currentUser.uid, availableBal);
      const [updatedBal, updatedLedger] = await Promise.all([
        marketplaceService.getSellerBalance(currentUser.uid),
        marketplaceService.getSellerLedger(currentUser.uid)
      ]);
      setBalance(updatedBal);
      setLedger(updatedLedger);
      setWithdrawNotice(`Withdrawal of ${formatPrice(availableBal)} successfully submitted to your payout method.`);
    } catch (err: any) {
      setWithdrawNotice(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E2E4DF]">
        <div>
          <span className="text-xs font-bold text-[#123C2F] uppercase tracking-wider">
            Overview Studio
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
            {sellerStore.name}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to={`/store/${sellerStore.slug}`}>
            <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
              View public store
            </Button>
          </Link>
          <Link to="/sell/products/new">
            <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              Add product
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Summary Strip (Strictly Real Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E4DF] shadow-xs space-y-1">
          <span className="text-xs text-[#6E746F] font-semibold">Total Gross Sales</span>
          <p className="text-2xl font-bold text-[#101312]">{formatPrice(totalSales)}</p>
          <span className="text-[11px] text-[#6E746F]">From real fulfilled orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E4DF] shadow-xs space-y-1">
          <span className="text-xs text-[#6E746F] font-semibold">Total Orders</span>
          <p className="text-2xl font-bold text-[#101312]">{validOrdersCount}</p>
          <span className="text-[11px] text-[#6E746F]">Active & fulfilled</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E4DF] shadow-xs space-y-1">
          <span className="text-xs text-[#6E746F] font-semibold">Available Balance</span>
          <p className="text-2xl font-bold text-emerald-800">{formatPrice(availableBal)}</p>
          <span className="text-[11px] text-[#6E746F]">Ready for payout</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E4DF] shadow-xs space-y-1">
          <span className="text-xs text-[#6E746F] font-semibold">Pending Escrow</span>
          <p className="text-2xl font-bold text-amber-700">{formatPrice(pendingBal)}</p>
          <span className="text-[11px] text-[#6E746F]">Clears on buyer delivery</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. Recent Orders & 4. Product Performance */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#101312]">Recent Orders</h2>
              <Link to="/sell/orders" className="text-xs font-semibold text-[#123C2F] hover:underline">
                View all orders →
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-32 rounded-xl" />
            ) : orders.length === 0 ? (
              <p className="text-xs text-[#6E746F] py-4 text-center">
                No orders received yet. Once customers buy your products, they appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 4).map((o) => (
                  <div
                    key={o.id}
                    className="p-3.5 rounded-xl bg-[#F7F7F3] border border-[#E2E4DF] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#101312]">{o.order_number}</p>
                      <p className="text-[#6E746F]">
                        {o.items.length} {o.items.length === 1 ? 'item' : 'items'} •{' '}
                        {new Date(o.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={o.status === 'DELIVERED' ? 'green' : 'yellow'} size="sm">
                        {o.status}
                      </Badge>
                      <span className="font-bold text-[#101312]">{formatPrice(o.total)}</span>
                      <Link to={`/sell/orders/${o.id}`}>
                        <Button variant="outline" size="sm">
                          Process
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Performance */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#101312]">Your Products ({products.length})</h2>
              <Link to="/sell/products" className="text-xs font-semibold text-[#123C2F] hover:underline">
                Manage inventory →
              </Link>
            </div>

            {products.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-xs text-[#6E746F]">You haven&apos;t added any products yet.</p>
                <Link to="/sell/products/new">
                  <Button variant="primary" size="sm">
                    Publish your first product
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {products.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-[#E2E4DF] text-xs hover:bg-[#F7F7F3]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F7F7F3] overflow-hidden shrink-0 border border-[#E2E4DF]">
                        <img src={p.images?.[0] || ''} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-[#101312] line-clamp-1">{p.title}</p>
                        <p className="text-[#6E746F]">Stock: {p.stock} units</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-[#101312]">{formatPrice(p.price)}</span>
                      <Badge variant={p.status === 'ACTIVE' ? 'green' : 'gray'} size="sm">
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. Balance & 6. Activity Ledger */}
        <div className="space-y-6">
          {/* Balance Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#101312]">Balance & Payouts</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-[#E2E4DF]">
                <span className="text-[#6E746F]">Available for Withdrawal:</span>
                <span className="font-bold text-emerald-800">{formatPrice(availableBal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#E2E4DF]">
                <span className="text-[#6E746F]">Pending in Escrow:</span>
                <span className="font-bold text-amber-700">{formatPrice(pendingBal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#6E746F]">Withdrawn to Bank:</span>
                <span className="font-bold text-[#101312]">
                  {formatPrice(balance?.withdrawn_amount || 0)}
                </span>
              </div>
            </div>

            {withdrawNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{withdrawNotice}</span>
              </div>
            )}

            <Button
              variant="outline"
              size="md"
              disabled={availableBal <= 0}
              isLoading={withdrawing}
              className="w-full"
              onClick={handleWithdraw}
            >
              {availableBal > 0 ? `Withdraw ${formatPrice(availableBal)}` : 'No funds to withdraw'}
            </Button>
          </div>

          {/* Activity Ledger */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#101312]">Financial Ledger</h2>
            {ledger.length === 0 ? (
              <p className="text-xs text-[#6E746F] py-2">No ledger entries recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {ledger.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-xl bg-[#F7F7F3] border border-[#E2E4DF] text-xs space-y-0.5"
                  >
                    <div className="flex justify-between font-bold">
                      <span className="text-[#101312] truncate max-w-[150px]">{entry.type}</span>
                      <span className="text-emerald-700">+{formatPrice(entry.amount)}</span>
                    </div>
                    <p className="text-[11px] text-[#6E746F] leading-tight">{entry.description}</p>
                    <span className="text-[10px] text-[#6E746F]/70">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
