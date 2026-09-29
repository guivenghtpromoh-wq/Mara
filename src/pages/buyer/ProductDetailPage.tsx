import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  Store as StoreIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Flag,
  X
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { ProductCard } from '../../components/product/ProductCard';
import { marketplaceService } from '../../services/marketplaceService';
import { disputeService } from '../../services/disputeService';
import { Product, Store, Review, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, isInWishlist, toggleWishlist } = useCart();
  const { currentUser } = useAuth();
  const { t, formatPrice } = useI18n();

  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('PROHIBITED_ITEM');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const loadProductData = async () => {
      setLoading(true);
      try {
        const prod = await marketplaceService.getProductBySlug(slug);
        if (prod) {
          setProduct(prod);
          setSelectedVariant(prod.variants?.[0]);

          // Save to recently viewed
          try {
            const viewed: string[] = JSON.parse(localStorage.getItem('mara_recently_viewed') || '[]');
            const updated = [prod.id, ...viewed.filter((id) => id !== prod.id)].slice(0, 10);
            localStorage.setItem('mara_recently_viewed', JSON.stringify(updated));
          } catch (e) {
            console.error('Failed to store recently viewed:', e);
          }

          // Fetch Store, Reviews, Related Products, and Review eligibility
          const [storeData, revs, related, reviewEligibility] = await Promise.all([
            marketplaceService.getStoreById(prod.store_id),
            marketplaceService.getProductReviews(prod.id),
            marketplaceService.getProducts({ categoryId: prod.category_id, limitCount: 4 }),
            currentUser ? marketplaceService.canUserReviewProduct(currentUser.uid, prod.id) : Promise.resolve({ eligible: false })
          ]);
          setStore(storeData);
          setReviews(revs);
          setRelatedProducts(related.filter((p) => p.id !== prod.id));
          if (reviewEligibility?.eligible) {
            setIsVerifiedBuyer(true);
          }
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [slug, currentUser]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !product) {
      navigate('/auth/sign-in');
      return;
    }
    setSubmittingReport(true);
    try {
      await disputeService.createModerationReport({
        reporter_id: currentUser.uid,
        target_type: 'PRODUCT',
        target_id: product.id,
        reason: reportReason,
        details: reportDetails.trim()
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setShowReportModal(false);
        setReportDetails('');
      }, 3000);
    } catch (err) {
      console.error('Failed to submit moderation report:', err);
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-6 w-1/4 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold text-[#101312]">Product not found</h2>
        <p className="text-sm text-[#6E746F]">The product you are looking for is unavailable.</p>
        <Button variant="primary" onClick={() => navigate('/explore')}>
          Back to Explore
        </Button>
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);
  const images = product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'];
  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedVariant, quantity);
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/auth/sign-in');
      return;
    }
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const newRev = await marketplaceService.createReview({
        product_id: product.id,
        user_id: currentUser.uid,
        user_name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Marketplace Member',
        rating: reviewRating,
        comment: reviewComment.trim(),
        verified_purchase: false,
      });
      setReviews([newRev, ...reviews]);
      setShowReviewForm(false);
      setReviewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="space-y-12 pb-24 lg:pb-0">
      {/* 1. Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E746F] hover:text-[#101312] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Product Showcase (Desktop 2-column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left: Product Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-white rounded-3xl border border-[#E2E4DF] overflow-hidden shadow-xs">
            <img
              src={images[activeImageIdx]}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />

            {/* Favorite Button */}
            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#101312] shadow-sm hover:bg-white transition-all cursor-pointer"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFavorite ? 'fill-[#F4C430] text-[#F4C430]' : 'text-[#6E746F] hover:text-[#101312]'
                }`}
              />
            </button>

            {/* Image navigation controls if multiple */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 text-[#101312]" />
                </button>
                <button
                  onClick={() => setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-xs cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 text-[#101312]" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIdx === idx ? 'border-[#101312]' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Purchase actions */}
        <div className="space-y-6">
          <div>
            {product.brand && (
              <p className="text-xs font-bold uppercase tracking-wider text-[#6E746F] mb-1">
                {product.brand}
              </p>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312] leading-snug">
              {product.title}
            </h1>

            {/* Rating */}
            {avgRating ? (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-[#F4C430]">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-xs font-bold text-[#101312] ml-1">{avgRating}</span>
                </div>
                <span className="text-xs text-[#6E746F]">({reviews.length} reviews)</span>
              </div>
            ) : (
              <p className="text-xs text-[#6E746F] mt-2">No reviews yet</p>
            )}
          </div>

          {/* Price & Discount */}
          <div className="flex items-baseline gap-3 pb-4 border-b border-[#E2E4DF]">
            <span className="text-3xl font-bold text-[#101312]">
              {formatPrice(currentPrice)}
            </span>
            {product.compare_at_price && product.compare_at_price > currentPrice && (
              <>
                <span className="text-base text-[#6E746F] line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
                <Badge variant="yellow" size="sm">
                  Save {Math.round(((product.compare_at_price - currentPrice) / product.compare_at_price) * 100)}%
                </Badge>
              </>
            )}
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2 text-xs">
            {currentStock > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-800">
                  In stock ({currentStock} available)
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-semibold text-red-700">Out of stock</span>
              </>
            )}
            <span className="text-[#6E746F]">Condition: {product.condition}</span>
          </div>

          {/* Product Variants (if applicable) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#101312]">
                Select Option:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const isVarOutOfStock = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      disabled={isVarOutOfStock}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#101312] bg-[#101312] text-white shadow-xs'
                          : isVarOutOfStock
                          ? 'border-[#E2E4DF] bg-[#F7F7F3] text-[#6E746F]/50 cursor-not-allowed line-through'
                          : 'border-[#E2E4DF] bg-white text-[#101312] hover:border-[#101312]'
                      }`}
                    >
                      {v.title} {v.price !== product.price ? `(${formatPrice(v.price)})` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="flex items-center gap-3">
              <label htmlFor="qtySelect" className="text-xs font-semibold text-[#101312]">
                Quantity:
              </label>
              <div className="flex items-center border border-[#E2E4DF] rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-sm text-[#101312] hover:bg-[#F7F7F3] cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-[#101312]">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  className="px-3 py-1.5 text-sm text-[#101312] hover:bg-[#F7F7F3] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Desktop Purchase Action Buttons */}
          <div className="hidden lg:flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              Add to cart
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
            >
              Buy now
            </Button>
          </div>

          {/* Shipping & Guarantee Information */}
          <div className="p-4 bg-white rounded-2xl border border-[#E2E4DF] space-y-3 text-xs text-[#6E746F]">
            <div className="flex items-center gap-2.5 text-[#101312]">
              <Truck className="w-4 h-4 text-[#123C2F] shrink-0" />
              <span>International shipping available. Calculated at checkout.</span>
            </div>
            <div className="flex items-center gap-2.5 text-[#101312]">
              <ShieldCheck className="w-4 h-4 text-[#123C2F] shrink-0" />
              <span>MARA Buyer Protection: Verified authenticity & secure payout handling.</span>
            </div>
          </div>

          {/* 11. Seller Card */}
          {store && (
            <div className="p-4 bg-white rounded-2xl border border-[#E2E4DF] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F7F7F3] border border-[#E2E4DF] flex items-center justify-center">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <StoreIcon className="w-5 h-5 text-[#123C2F]" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#101312]">{store.name}</h4>
                  <p className="text-[11px] text-[#6E746F]">
                    {store.rating > 0 ? `★ ${store.rating} Rating` : 'Verified Merchant'}
                  </p>
                </div>
              </div>
              <Link to={`/store/${store.slug}`}>
                <Button variant="outline" size="sm">
                  Visit store
                </Button>
              </Link>
            </div>
          )}

          {/* Report Listing Button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 text-[11px] text-[#6E746F] hover:text-red-700 transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report this listing</span>
            </button>
          </div>
        </div>
      </div>

      {/* Description & Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-[#E2E4DF]">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-[#101312]">Description</h2>
          <div className="prose prose-sm text-[#6E746F] leading-relaxed whitespace-pre-line bg-white p-6 rounded-2xl border border-[#E2E4DF]">
            {product.description}
          </div>
        </div>

        {/* Specifications */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#101312]">Specifications</h2>
          <div className="bg-white p-6 rounded-2xl border border-[#E2E4DF] space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#E2E4DF]/60">
              <span className="text-[#6E746F]">Condition</span>
              <span className="font-semibold text-[#101312]">{product.condition}</span>
            </div>
            {product.brand && (
              <div className="flex justify-between py-1.5 border-b border-[#E2E4DF]/60">
                <span className="text-[#6E746F]">Brand</span>
                <span className="font-semibold text-[#101312]">{product.brand}</span>
              </div>
            )}
            {product.dimensions && (
              <div className="flex justify-between py-1.5 border-b border-[#E2E4DF]/60">
                <span className="text-[#6E746F]">Dimensions</span>
                <span className="font-semibold text-[#101312]">{product.dimensions}</span>
              </div>
            )}
            {product.weight && (
              <div className="flex justify-between py-1.5 border-b border-[#E2E4DF]/60">
                <span className="text-[#6E746F]">Weight</span>
                <span className="font-semibold text-[#101312]">{product.weight}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5">
              <span className="text-[#6E746F]">Listed</span>
              <span className="font-semibold text-[#101312]">
                {new Date(product.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 14. Customer Reviews */}
      <div className="space-y-6 pt-8 border-t border-[#E2E4DF]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#101312]">Customer Reviews</h2>
            <p className="text-xs text-[#6E746F] mt-0.5">
              Verified feedback from marketplace buyers
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {showReviewForm ? 'Cancel review' : 'Write a review'}
          </Button>
        </div>

        {reviewSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Thank you! Your verified review has been published.</span>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="p-6 bg-white rounded-2xl border border-[#E2E4DF] space-y-4 max-w-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#101312]">Share your experience</h3>
              {isVerifiedBuyer ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Buyer
                </span>
              ) : (
                <span className="text-[11px] text-[#6E746F]">
                  Community Review
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E746F] mb-1">
                Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= reviewRating
                          ? 'fill-[#F4C430] text-[#F4C430]'
                          : 'text-[#E2E4DF]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E746F] mb-1">
                Your comments
              </label>
              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="What did you think of the quality, craft, and shipment?"
                className="w-full text-xs p-3 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submittingReview}
            >
              Submit review
            </Button>
          </form>
        )}

        {reviews.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#E2E4DF]">
            <p className="text-xs text-[#6E746F]">No customer reviews for this item yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 bg-white rounded-2xl border border-[#E2E4DF] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? 'fill-[#F4C430] text-[#F4C430]'
                            : 'text-[#E2E4DF]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#6E746F]">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-[#101312] leading-relaxed">{rev.comment}</p>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-[#6E746F]">
                  {rev.verified_purchase && <CheckCircle className="w-3.5 h-3.5 text-[#123C2F] shrink-0" />}
                  <span className={rev.verified_purchase ? 'text-[#123C2F] font-semibold' : ''}>
                    {rev.user_name} {rev.verified_purchase ? '• Verified Purchase' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 15. Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-[#E2E4DF]">
          <h2 className="text-xl font-bold text-[#101312]">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* 16. Mobile Sticky Purchase Actions Bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2E4DF] p-3 flex items-center gap-2 shadow-lg">
        <Button
          variant="outline"
          size="md"
          className="flex-1"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          Add to cart
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          disabled={isOutOfStock}
          onClick={handleBuyNow}
        >
          Buy now
        </Button>
      </div>
      {/* Moderation Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E2E4DF]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E4DF]">
              <div className="flex items-center gap-2 text-red-700">
                <Flag className="w-5 h-5" />
                <h3 className="font-bold text-sm text-[#101312]">Report Listing</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-full hover:bg-[#F7F7F3] text-[#6E746F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thank you. Your report has been submitted to the moderation team.</span>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                <p className="text-[#6E746F]">
                  MARA protects intellectual property and user safety. Please let us know what is wrong with this listing.
                </p>

                <div>
                  <label className="block font-semibold text-[#101312] mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E2E4DF] bg-white focus:outline-none focus:border-[#101312]"
                  >
                    <option value="PROHIBITED_ITEM">Prohibited or illegal item</option>
                    <option value="COUNTERFEIT">Counterfeit / IP Infringement</option>
                    <option value="MISLEADING">Misleading description / Fake images</option>
                    <option value="OFFENSIVE">Offensive or discriminatory content</option>
                    <option value="OTHER">Other violation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#101312] mb-1">Details (Optional)</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide additional details or proof links..."
                    className="w-full p-2.5 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReportModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={submittingReport}
                  >
                    Submit Report
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
