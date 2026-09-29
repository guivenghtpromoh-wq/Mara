import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useI18n } from '../../lib/i18n';

interface ProductCardProps {
  product: Product;
  storeName?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, storeName }) => {
  const { isInWishlist, toggleWishlist } = useCart();
  const { formatPrice } = useI18n();
  const isFavorite = isInWishlist(product.id);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const imageSrc =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-[#E2E4DF] overflow-hidden transition-all duration-200 hover:border-[#101312]/30 hover:shadow-xs">
      {/* 1. Image & 2. Favorite button */}
      <div className="relative aspect-square w-full bg-[#F7F7F3] overflow-hidden">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={imageSrc}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-103"
          />
        </Link>
        <button
          onClick={handleHeartClick}
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#101312] shadow-xs hover:bg-white transition-all cursor-pointer z-10"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-[#F4C430] text-[#F4C430]' : 'text-[#6E746F] hover:text-[#101312]'
            }`}
          />
        </button>

        {product.stock <= 3 && product.stock > 0 && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-semibold bg-[#101312]/80 text-white rounded-md backdrop-blur-xs">
            Only {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-semibold bg-red-600 text-white rounded-md">
            Out of stock
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          {storeName && (
            <p className="text-xs text-[#6E746F] truncate mb-0.5">{storeName}</p>
          )}
          {/* 3. Title */}
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="text-sm font-medium text-[#101312] line-clamp-2 hover:text-[#123C2F] transition-colors leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* 4. Price & 5. Optional metadata */}
        <div className="flex items-center justify-between pt-1 border-t border-[#E2E4DF]/50 mt-auto">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-[#101312]">
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs text-[#6E746F] line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>

          {product.brand && (
            <span className="text-[11px] text-[#6E746F] truncate max-w-[80px]">
              {product.brand}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
