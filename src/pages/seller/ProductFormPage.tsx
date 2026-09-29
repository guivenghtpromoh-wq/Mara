import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  DollarSign,
  Truck,
  Eye
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { Category, Product, ProductCondition, ProductStatus, ProductVariant } from '../../types';
import { useI18n } from '../../lib/i18n';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { currentUser, sellerStore } = useAuth();
  const { formatPrice } = useI18n();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  // 1. Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('NEW');

  // 2. Media
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // 3. Pricing
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('10');

  // 4. Variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantTitle, setVariantTitle] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantStock, setVariantStock] = useState('5');

  // 5. Shipping
  const [dimensions, setDimensions] = useState('');
  const [weight, setWeight] = useState('');
  const [shippingMethod, setShippingMethod] = useState('Standard Courier');

  // Active section tab for clean workflow
  const [activeSection, setActiveSection] = useState<'basic' | 'media' | 'pricing' | 'variants' | 'shipping' | 'review'>('basic');

  useEffect(() => {
    marketplaceService.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
    }).catch(console.error);

    if (isEditing && id) {
      setLoading(true);
      marketplaceService.getProductById(id).then((prod) => {
        if (prod) {
          setTitle(prod.title);
          setDescription(prod.description);
          setCategoryId(prod.category_id);
          setBrand(prod.brand || '');
          setCondition(prod.condition);
          setImages(prod.images || []);
          setPrice(String(prod.price));
          setCompareAtPrice(prod.compare_at_price ? String(prod.compare_at_price) : '');
          setStock(String(prod.stock));
          setVariants(prod.variants || []);
          setDimensions(prod.dimensions || '');
          setWeight(prod.weight || '');
          setShippingMethod(prod.shipping_method || 'Standard Courier');
        }
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleAddImage = () => {
    if (!imageUrl.trim()) return;
    setImages([...images, imageUrl.trim()]);
    setImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    if (!variantTitle.trim()) return;
    const newVar: ProductVariant = {
      id: `var-${Date.now()}`,
      title: variantTitle.trim(),
      price: variantPrice ? Number(variantPrice) : Number(price) || 0,
      stock: variantStock ? Number(variantStock) : 5,
      options: { Option: variantTitle.trim() },
    };
    setVariants([...variants, newVar]);
    setVariantTitle('');
    setVariantPrice('');
    setVariantStock('5');
  };

  const handleRemoveVariant = (varId: string) => {
    setVariants(variants.filter((v) => v.id !== varId));
  };

  const generateSlug = (t: string) => {
    return t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;
  };

  const handleSubmit = async (publishStatus: ProductStatus) => {
    if (!currentUser || !sellerStore) {
      setError('You must have an active store to publish products.');
      return;
    }

    if (!title.trim() || !description.trim() || !price) {
      setError('Title, description and price are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const parsedPrice = Number(price);
      const parsedStock = Number(stock) || 0;
      const parsedCompare = compareAtPrice ? Number(compareAtPrice) : undefined;

      const productPayload = {
        store_id: sellerStore.id,
        seller_id: currentUser.uid,
        category_id: categoryId || categories[0]?.id || 'cat-general',
        title: title.trim(),
        slug: isEditing ? undefined : generateSlug(title),
        description: description.trim(),
        brand: brand.trim() || undefined,
        condition,
        status: publishStatus,
        price: parsedPrice,
        compare_at_price: parsedCompare,
        currency: 'USD',
        stock: parsedStock,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
        variants,
        dimensions: dimensions.trim() || undefined,
        weight: weight.trim() || undefined,
        shipping_method: shippingMethod,
        published_at: publishStatus === 'ACTIVE' ? new Date().toISOString() : undefined,
      };

      if (isEditing && id) {
        await marketplaceService.updateProduct(id, productPayload, currentUser.uid);
      } else {
        await marketplaceService.createProduct(productPayload as any);
      }

      navigate('/sell/products');
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setError(err.message || 'Could not save product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E4DF]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sell/products')}
            className="p-1.5 rounded-lg hover:bg-white text-[#6E746F] hover:text-[#101312] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-[#101312]">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            isLoading={submitting}
            onClick={() => handleSubmit('DRAFT')}
          >
            Save draft
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isLoading={submitting}
            onClick={() => handleSubmit('ACTIVE')}
          >
            Publish
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sections Nav */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E2E4DF]">
        {[
          { id: 'basic', label: '1. Basic Info' },
          { id: 'media', label: '2. Media' },
          { id: 'pricing', label: '3. Pricing & Stock' },
          { id: 'variants', label: '4. Variants' },
          { id: 'shipping', label: '5. Shipping' },
          { id: 'review', label: '6. Review' },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeSection === sec.id
                ? 'bg-[#123C2F] text-white shadow-xs'
                : 'text-[#6E746F] hover:text-[#101312] hover:bg-white'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Section 1: Basic Info */}
      {activeSection === 'basic' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#101312]">Basic Information</h2>

          <Input
            label="Product Title"
            required
            placeholder="Handmade Ceramic Mug, Linen Throw Blanket..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#101312] mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs font-semibold bg-[#F7F7F3] border border-[#E2E4DF] rounded-xl px-3 py-2.5 text-[#101312] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Brand / Artisan Name (Optional)"
              placeholder="e.g. Atelier Nord"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101312] mb-1">
              Condition
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'] as ProductCondition[]).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    condition === c
                      ? 'border-[#123C2F] bg-[#123C2F] text-white'
                      : 'border-[#E2E4DF] bg-white text-[#101312]'
                  }`}
                >
                  {c.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101312] mb-1">
              Description
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe materials, craft technique, sizing and usage instructions..."
              className="w-full text-xs p-3.5 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="md" onClick={() => setActiveSection('media')}>
              Next: Media →
            </Button>
          </div>
        </div>
      )}

      {/* Section 2: Media */}
      {activeSection === 'media' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#101312]">Product Media</h2>
          <p className="text-xs text-[#6E746F]">
            Add high-resolution image URLs showcasing different angles and details of your product.
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="Paste public image URL (https://...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Button variant="outline" size="md" onClick={handleAddImage} icon={<Plus className="w-4 h-4" />}>
              Add
            </Button>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-[#E2E4DF] group"
                >
                  <img src={img} alt={`Product ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#101312]/80 text-white">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-[#E2E4DF] rounded-2xl text-center text-xs text-[#6E746F]">
              No images added yet. Add an image URL above.
            </div>
          )}

          <div className="pt-2 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setActiveSection('basic')}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setActiveSection('pricing')}>
              Next: Pricing →
            </Button>
          </div>
        </div>
      )}

      {/* Section 3: Pricing & Stock */}
      {activeSection === 'pricing' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#101312]">Pricing & Stock</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Price (USD)"
              required
              type="number"
              step="0.01"
              placeholder="49.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              label="Compare-at Price (Optional)"
              type="number"
              step="0.01"
              placeholder="65.00"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
            />
            <Input
              label="Initial Stock Quantity"
              required
              type="number"
              placeholder="10"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setActiveSection('media')}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setActiveSection('variants')}>
              Next: Variants →
            </Button>
          </div>
        </div>
      )}

      {/* Section 4: Variants */}
      {activeSection === 'variants' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#101312]">Product Variants</h2>
          <p className="text-xs text-[#6E746F]">
            Add options such as sizes (S, M, L), colors or finishes with their own inventory.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F7F7F3] rounded-2xl border border-[#E2E4DF]">
            <Input
              label="Option Title"
              placeholder="e.g. Size M, Black Finish"
              value={variantTitle}
              onChange={(e) => setVariantTitle(e.target.value)}
            />
            <Input
              label="Variant Price"
              placeholder={price || 'Same as base'}
              value={variantPrice}
              onChange={(e) => setVariantPrice(e.target.value)}
            />
            <Input
              label="Stock"
              placeholder="5"
              value={variantStock}
              onChange={(e) => setVariantStock(e.target.value)}
            />
            <div className="sm:col-span-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={handleAddVariant} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Variant
              </Button>
            </div>
          </div>

          {variants.length > 0 && (
            <div className="space-y-2 pt-2">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#E2E4DF] text-xs"
                >
                  <div>
                    <strong className="text-[#101312]">{v.title}</strong>
                    <span className="text-[#6E746F] ml-2">
                      Price: {formatPrice(v.price)} • Stock: {v.stock}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(v.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setActiveSection('pricing')}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setActiveSection('shipping')}>
              Next: Shipping →
            </Button>
          </div>
        </div>
      )}

      {/* Section 5: Shipping */}
      {activeSection === 'shipping' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#101312]">Shipping Configuration</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Package Dimensions (L × W × H)"
              placeholder="e.g. 20 × 15 × 10 cm"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
            />
            <Input
              label="Weight"
              placeholder="e.g. 450 g / 1 lb"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <Input
            label="Shipping Method / Carrier"
            placeholder="Standard Tracked Air Post, DHL Express..."
            value={shippingMethod}
            onChange={(e) => setShippingMethod(e.target.value)}
          />

          <div className="pt-2 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setActiveSection('variants')}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setActiveSection('review')}>
              Review & Publish →
            </Button>
          </div>
        </div>
      )}

      {/* Section 6: Review */}
      {activeSection === 'review' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E4DF] shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[#101312]">Review & Publish</h2>

          <div className="space-y-3 bg-[#F7F7F3] p-5 rounded-2xl border border-[#E2E4DF] text-xs">
            <div className="flex justify-between">
              <span className="text-[#6E746F]">Title:</span>
              <span className="font-bold text-[#101312]">{title || '(Empty title)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E746F]">Price:</span>
              <span className="font-bold text-[#123C2F]">
                {price ? formatPrice(Number(price)) : '$0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E746F]">Stock:</span>
              <span className="font-bold text-[#101312]">{stock} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E746F]">Condition:</span>
              <span className="font-bold text-[#101312]">{condition}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E746F]">Images:</span>
              <span className="font-bold text-[#101312]">{images.length} added</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E746F]">Variants:</span>
              <span className="font-bold text-[#101312]">{variants.length} configured</span>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <Button variant="ghost" size="md" onClick={() => setActiveSection('shipping')}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="md"
                isLoading={submitting}
                onClick={() => handleSubmit('DRAFT')}
              >
                Save as draft
              </Button>
              <Button
                variant="secondary"
                size="lg"
                isLoading={submitting}
                onClick={() => handleSubmit('ACTIVE')}
              >
                Publish to MARA
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
