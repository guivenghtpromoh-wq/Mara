import React from 'react';
import { Link } from 'react-router-dom';
import { Store as StoreIcon, Star, CheckCircle } from 'lucide-react';
import { Store } from '../../types';
import { Button } from '../common/Button';

interface StoreCardProps {
  store: Store;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-[#E2E4DF] overflow-hidden p-4 transition-all duration-200 hover:border-[#101312]/30 hover:shadow-xs">
      <div className="flex items-center gap-3.5 mb-3">
        <div className="w-12 h-12 rounded-xl bg-[#F7F7F3] border border-[#E2E4DF] overflow-hidden flex items-center justify-center shrink-0">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <StoreIcon className="w-6 h-6 text-[#123C2F]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold text-[#101312] truncate">{store.name}</h4>
            <CheckCircle className="w-3.5 h-3.5 text-[#123C2F] shrink-0" />
          </div>
          {store.rating > 0 ? (
            <div className="flex items-center gap-1 text-xs text-[#101312] mt-0.5">
              <Star className="w-3.5 h-3.5 fill-[#F4C430] text-[#F4C430]" />
              <span className="font-semibold">{store.rating}</span>
              <span className="text-[#6E746F]">({store.reviews_count})</span>
            </div>
          ) : (
            <span className="text-xs text-[#6E746F]">New store</span>
          )}
        </div>
      </div>

      {store.description && (
        <p className="text-xs text-[#6E746F] line-clamp-2 mb-4 leading-relaxed flex-1">
          {store.description}
        </p>
      )}

      <Link to={`/store/${store.slug}`} className="w-full mt-auto">
        <Button variant="outline" size="sm" className="w-full">
          Visit store
        </Button>
      </Link>
    </div>
  );
};
