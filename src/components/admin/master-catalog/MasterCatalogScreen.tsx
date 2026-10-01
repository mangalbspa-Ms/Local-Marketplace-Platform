/**
 * Central Master Catalogue Management Screen
 * 
 * Central repository of master grocery products managed by Admin.
 * Stores canonical identity: Name, Hindi Name, Photo, Category, Subcategory, Aliases, Brand.
 * Prices and stock are strictly NOT defined here (set by individual shops).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Tag,
  RefreshCw,
  Layers,
  Sparkles,
  ExternalLink,
  Store,
  X,
  Info,
} from 'lucide-react';
import { MasterProduct, CreateMasterProductDTO, UpdateMasterProductDTO } from '../../../types/product.ts';
import { adminApi } from '../../../services/adminApi.ts';

const KIRANA_CATEGORIES = [
  'अनाज / चावल / आटा',
  'दाल / बीन्स / चना',
  'तेल / घी',
  'नमक / चीनी / गुड़',
  'मसाले / साबुत मसाले / मसाला पैक',
  'ड्राई फ्रूट / मेवा / बीज',
  'चाय / कॉफी / पेय',
  'बिस्कुट',
  'नमकीन / चिप्स / स्नैक्स',
  'चॉकलेट / टॉफी / कैंडी',
  'नूडल्स / पास्ता / इंस्टेंट फूड',
  'सॉस / केचप / अचार / जैम',
  'डेयरी',
  'ब्रेड / बेकरी',
  'साबुन / शैंपू / पर्सनल केयर',
  'टूथपेस्ट / टूथब्रश / ओरल केयर',
  'हेयर ऑयल / क्रीम / कॉस्मेटिक्स',
  'डिटर्जेंट / कपड़े धोने का सामान',
  'बर्तन साफ करने का सामान',
  'फर्श / टॉयलेट / घर की सफाई',
  'पेपर / टिश्यू / डिस्पोजेबल',
  'पूजा सामग्री',
  'बेबी केयर',
  'स्टेशनरी',
  'घरेलू / किचन उपयोगी सामान',
  'अन्य सामान्य किराना / जनरल स्टोर सामान',
];

const PRESET_IMAGE_SUGGESTIONS: Record<string, string> = {
  'आटा / अनाज': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60',
  'चावल (Rice)': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60',
  'दाल (Pulses)': 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=500&auto=format&fit=crop&q=60',
  'तेल (Edible Oil)': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60',
  'देसी घी (Ghee)': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=60',
  'मसाले (Spices)': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60',
  'चाय पत्ती (Tea)': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=60',
  'बिस्कुट (Biscuits)': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60',
  'साबुन (Soap)': 'https://images.unsplash.com/photo-1608248597359-00994f068c2d?w=500&auto=format&fit=crop&q=60',
  'डिटर्जेंट (Detergent)': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=60',
  'किराना सामान्य': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
};

interface MasterCatalogScreenProps {
  onNavigateToShops?: () => void;
}

export const MasterCatalogScreen: React.FC<MasterCatalogScreenProps> = ({ onNavigateToShops }) => {
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<CreateMasterProductDTO & { isActive?: boolean }>({
    name: '',
    nameHindi: '',
    category: KIRANA_CATEGORIES[0],
    subCategory: '',
    imageUrl: '',
    aliases: [],
    brand: '',
    defaultUnit: 'kg',
    barcode: '',
    description: '',
    isActive: true,
  });
  const [aliasesInput, setAliasesInput] = useState('');

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMasterProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getMasterProducts();
      setProducts(res.products || []);
    } catch (err: any) {
      console.error('Failed to fetch master catalog products', err);
      setError(err.message || 'मास्टर कैटलॉग लोड करने में असमर्थ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterProducts();
  }, []);

  // Compute available subcategories for selected category
  const availableSubcategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (selectedCategory === 'ALL' || p.category === selectedCategory) {
        if (p.subCategory && p.subCategory.trim() !== '') {
          set.add(p.subCategory.trim());
        }
      }
    });
    return Array.from(set).sort();
  }, [products, selectedCategory]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      // Subcategory filter
      if (selectedSubCategory !== 'ALL' && p.subCategory !== selectedSubCategory) {
        return false;
      }
      // Search term
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const eng = (p.name || '').toLowerCase();
        const hindi = (p.nameHindi || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const subcat = (p.subCategory || '').toLowerCase();
        const aliasMatch = p.aliases?.some((a) => a.toLowerCase().includes(q));
        return eng.includes(q) || hindi.includes(q) || brand.includes(q) || subcat.includes(q) || Boolean(aliasMatch);
      }
      return true;
    });
  }, [products, selectedCategory, selectedSubCategory, searchTerm]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = products.length;
    const categoriesCount = new Set(products.map((p) => p.category)).size;
    const withPhotos = products.filter((p) => p.imageUrl && p.imageUrl.trim() !== '').length;
    const withBrands = products.filter((p) => p.brand && p.brand.trim() !== '').length;
    return { total, categoriesCount, withPhotos, withBrands };
  }, [products]);

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      nameHindi: '',
      category: selectedCategory !== 'ALL' ? selectedCategory : KIRANA_CATEGORIES[0],
      subCategory: '',
      imageUrl: '',
      aliases: [],
      brand: '',
      defaultUnit: 'kg',
      barcode: '',
      description: '',
      isActive: true,
    });
    setAliasesInput('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (p: MasterProduct) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      nameHindi: p.nameHindi,
      category: p.category,
      subCategory: p.subCategory || '',
      imageUrl: p.imageUrl || '',
      aliases: p.aliases || [],
      brand: p.brand || '',
      defaultUnit: p.defaultUnit || 'kg',
      barcode: p.barcode || '',
      description: p.description || '',
      isActive: p.isActive !== false,
    });
    setAliasesInput((p.aliases || []).join(', '));
    setFormError(null);
    setIsModalOpen(true);
  };

  // Quick toggle active / inactive status
  const handleToggleActive = async (p: MasterProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextActive = p.isActive === false ? true : false;
    try {
      await adminApi.updateMasterProduct(p.id, {
        isActive: nextActive,
      });
      setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, isActive: nextActive } : item)));
      showToast(`'${p.nameHindi}' अब ${nextActive ? 'सक्रिय (Active)' : 'निष्क्रिय (Inactive)'} है`);
    } catch (err: any) {
      console.error('Failed to toggle master product status', err);
      showToast(err.message || 'स्थिति बदलने में विफल');
    }
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('सामान का नाम (अंग्रेजी / सामान्य नाम) अनिवार्य है');
      return;
    }
    if (!formData.nameHindi.trim()) {
      setFormError('सामान का नाम (हिंदी में) अनिवार्य है');
      return;
    }
    if (!formData.category) {
      setFormError('श्रेणी (Category) चुनना अनिवार्य है');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const aliases = aliasesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingProduct) {
        const updated = await adminApi.updateMasterProduct(editingProduct.id, {
          ...formData,
          aliases,
          isActive: formData.isActive !== false,
        });
        setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        showToast(`'${updated.nameHindi}' मास्टर कैटलॉग में अपडेट हो गया`);
      } else {
        const created = await adminApi.createMasterProduct({
          ...formData,
          aliases,
        });
        setProducts((prev) => [created, ...prev]);
        showToast(`'${created.nameHindi}' मास्टर कैटलॉग में सफलतापूर्वक जुड़ गया`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save master product', err);
      setFormError(err.message || 'सामान सेव करने में त्रुटि हुई');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteProduct = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteMasterProduct(deleteId);
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      showToast('मास्टर सामान सफलतापूर्वक हटा दिया गया');
      setDeleteId(null);
    } catch (err: any) {
      console.error('Failed to delete master product', err);
      alert(err.message || 'सामान हटाने में त्रुटि हुई');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="master-catalog-screen" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white shadow-xl transition-all duration-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Compact Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-linear-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-2">
                <span>सेंट्रल मास्टर कैटलॉग (Master Catalogue)</span>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                  Admin
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                सभी दुकानों के लिए सामान्य किराना सामान का केंद्रीय भंडार — नाम, फोटो और पहचान प्रबंधित करें
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="refresh-master-catalog-btn"
              onClick={fetchMasterProducts}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition active:scale-95"
              title="रीफ्रेश करें"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              रीफ्रेश
            </button>

            {onNavigateToShops && (
              <button
                id="navigate-shops-btn"
                onClick={onNavigateToShops}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition active:scale-95"
              >
                <Store className="h-3.5 w-3.5" />
                दुकानें
              </button>
            )}

            <button
              id="add-master-product-btn"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-500 transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              + नया मास्टर सामान
            </button>
          </div>
        </div>

        {/* Compact Rule Notice Box */}
        <div className="mt-3 rounded-lg border border-indigo-500/20 bg-indigo-950/30 p-2.5 text-[11px] text-indigo-200 flex items-start gap-2">
          <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-indigo-300">नियम:</span>{' '}
            सामान का नाम, फोटो, श्रेणी और पहचान उपनाम (aliases) एक ही बार जोड़े जाते हैं।{' '}
            <strong className="text-white">मूल्य (Price) और स्टॉक (Stock)</strong> दुकानदार अपनी दुकान में तय करते हैं।
          </div>
        </div>

        {/* Compact Quick Stats Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase">कुल मास्टर सामान</div>
            <div className="mt-0.5 text-lg font-black text-white">{stats.total}</div>
            <div className="text-[10px] text-emerald-400">केंद्रीय रूप से उपलब्ध</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase">कुल श्रेणियां</div>
            <div className="mt-0.5 text-lg font-black text-indigo-300">{stats.categoriesCount}</div>
            <div className="text-[10px] text-slate-400">किराना श्रेणियां</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase">फोटो सहित सामान</div>
            <div className="mt-0.5 text-lg font-black text-emerald-400">{stats.withPhotos}</div>
            <div className="text-[10px] text-slate-400">ऑटो-कॉपी फोटो</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase">ब्रांडेड सामान</div>
            <div className="mt-0.5 text-lg font-black text-amber-300">{stats.withBrands}</div>
            <div className="text-[10px] text-slate-400">टाटा, एमडीएच, पार्ले आदि</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 sm:p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            id="master-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="सामान का नाम खोजें (हिंदी, English, Aliases, Brand)..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-9 pr-8 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              id="master-category-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubCategory('ALL');
              }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-hidden max-w-[220px]"
            >
              <option value="ALL">सभी श्रेणियां (All Categories)</option>
              {KIRANA_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Dropdown */}
          {availableSubcategories.length > 0 && (
            <select
              id="master-subcategory-select"
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-hidden max-w-[180px]"
            >
              <option value="ALL">सभी उप-श्रेणियां</option>
              {availableSubcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          )}

          <div className="text-xs font-semibold text-slate-400 pl-2">
            कुल: <span className="text-white font-bold">{filteredProducts.length}</span> सामान
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="h-10 w-10 animate-spin text-indigo-400 mb-4" />
          <p className="text-slate-300 font-medium">सेंट्रल मास्टर कैटलॉग लोड हो रहा है...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-xl border border-rose-800 bg-rose-950/40 p-6 text-center text-rose-200">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-400 mb-2" />
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchMasterProducts}
            className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600"
          >
            पुनः प्रयास करें
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-300">कोई सामान नहीं मिला</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm || selectedCategory !== 'ALL'
              ? 'दिए गए फ़िल्टर के अनुसार कोई मास्टर सामान उपलब्ध नहीं है।'
              : 'मास्टर कैटलॉग अभी खाली है। नया सामान जोड़ें।'}
          </p>
          {(searchTerm || selectedCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
                setSelectedSubCategory('ALL');
              }}
              className="mt-4 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              फ़िल्टर हटाएं
            </button>
          )}
        </div>
      )}

      {/* Products Compact List / Table Layout */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          {/* Table Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-3 py-2 text-[11px] font-bold text-slate-400">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>मास्टर सामान सूची (Master Items List)</span>
            </div>
            <div className="text-[10px] text-slate-500">
              कुल: <span className="text-slate-200 font-semibold">{filteredProducts.length}</span> सामान
            </div>
          </div>

          {/* Product Rows List */}
          <div className="divide-y divide-slate-800/60">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                id={`master-card-${p.id}`}
                className="group flex items-center gap-2.5 px-2.5 py-1.5 sm:px-3 sm:py-2 hover:bg-slate-800/40 transition"
              >
                {/* Small Product Thumbnail */}
                <div className="relative h-8 w-8 sm:h-9 sm:w-9 shrink-0 overflow-hidden rounded-md border border-slate-800 bg-slate-950">
                  <img
                    src={p.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';
                    }}
                  />
                </div>

                {/* Product Name & Info (Middle) */}
                <div className="flex-1 min-w-0">
                  {/* Line 1: Hindi Name + English Name + Brand */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[150px] sm:max-w-[240px]">
                      {p.nameHindi}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-medium truncate max-w-[130px] sm:max-w-[200px]">
                      ({p.name})
                    </span>
                    {p.brand && (
                      <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-bold text-amber-300 border border-amber-500/25">
                        {p.brand}
                      </span>
                    )}
                  </div>

                  {/* Line 2: Category, Subcategory, Aliases, Unit */}
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 mt-0.5 flex-wrap">
                    <span className="text-indigo-300 font-medium truncate max-w-[130px] sm:max-w-[180px]">
                      {p.category}
                    </span>
                    {p.subCategory && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 truncate max-w-[110px] sm:max-w-[160px]">
                          {p.subCategory}
                        </span>
                      </>
                    )}
                    {p.aliases && p.aliases.length > 0 && (
                      <>
                        <span className="text-slate-600 hidden xs:inline">•</span>
                        <span
                          className="text-slate-500 truncate max-w-[120px] sm:max-w-[220px] hidden xs:inline"
                          title={`पहचान / Aliases: ${p.aliases.join(', ')}`}
                        >
                          पहचान: {p.aliases.slice(0, 3).join(', ')}
                          {p.aliases.length > 3 ? ` +${p.aliases.length - 3}` : ''}
                        </span>
                      </>
                    )}
                    <span className="text-slate-600">•</span>
                    <span className="rounded bg-slate-800/80 px-1 py-0.2 text-[9.5px] font-mono text-slate-300 border border-slate-700/60">
                      {p.defaultUnit || 'kg'}
                    </span>
                  </div>
                </div>

                {/* Right: Active/Inactive Status, Edit, Delete Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Active/Inactive Status Toggle / Badge */}
                  <button
                    onClick={(e) => handleToggleActive(p, e)}
                    title={p.isActive !== false ? 'सक्रिय (क्लिक करके निष्क्रिय करें)' : 'निष्क्रिय (क्लिक करके सक्रिय करें)'}
                    className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-semibold border transition ${
                      p.isActive !== false
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/60'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        p.isActive !== false ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                    />
                    <span>{p.isActive !== false ? 'सक्रिय' : 'निष्क्रिय'}</span>
                  </button>

                  {/* Edit Action Button */}
                  <button
                    id={`edit-master-btn-${p.id}`}
                    onClick={() => handleOpenEditModal(p)}
                    className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition"
                    title="संपादित करें"
                  >
                    <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>

                  {/* Delete Action Button */}
                  <button
                    id={`delete-master-btn-${p.id}`}
                    onClick={() => setDeleteId(p.id)}
                    className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-rose-400 hover:border-rose-500 hover:bg-rose-950/40 transition"
                    title="हटाएं"
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Master Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                  {editingProduct ? 'मास्टर सामान संपादित करें' : 'मास्टर कैटलॉग में नया सामान जोड़ें'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  यह सामान मास्टर कैटलॉग में जुड़ेगा और किसी भी दुकान में सीधे इम्पोर्ट किया जा सकेगा
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-rose-800 bg-rose-950/50 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Hindi Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    सामान का नाम (हिंदी में) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameHindi}
                    onChange={(e) => setFormData({ ...formData, nameHindi: e.target.value })}
                    placeholder="उदा. आशीर्वाद आटा / बासमती चावल"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* English Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    सामान का नाम (English) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="उदा. Aashirvaad Shudh Chakki Atta"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    श्रेणी (Category) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-hidden"
                  >
                    {KIRANA_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    उप-श्रेणी (Subcategory)
                  </label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    placeholder="उदा. गेहूं का आटा / सरसों का तेल"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Photo URL with Preview & Quick Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  सामान की फोटो URL (Photo URL)
                </label>
                <div className="mt-1.5 flex gap-3">
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                  />
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                    <img
                      src={formData.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';
                      }}
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500">त्वरित फोटो सुझाव:</span>
                  {Object.entries(PRESET_IMAGE_SUGGESTIONS).slice(0, 5).map(([label, url]) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() => setFormData({ ...formData, imageUrl: url })}
                      className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Brand */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    ब्रांड (Brand / निर्माता)
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="उदा. Aashirvaad / Tata"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Default Unit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    डिफ़ॉल्ट इकाई (Unit)
                  </label>
                  <select
                    value={formData.defaultUnit}
                    onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="kg">किलोग्राम (kg)</option>
                    <option value="gram">ग्राम (gram)</option>
                    <option value="packet">पैकेट (packet)</option>
                    <option value="piece">पीस / नग (piece)</option>
                    <option value="L">लीटर (L)</option>
                    <option value="ml">मिलीलीटर (ml)</option>
                    <option value="box">बॉक्स (box)</option>
                    <option value="dozen">दर्जन (dozen)</option>
                    <option value="plate">प्लेट (plate)</option>
                  </select>
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    बारकोड / EAN (वैकल्पिक)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="8901234567890"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Aliases */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  पहचान के लिए अन्य नाम / Aliases (अल्पविराम ',' से अलग करें)
                </label>
                <input
                  type="text"
                  value={aliasesInput}
                  onChange={(e) => setAliasesInput(e.target.value)}
                  placeholder="उदा. चक्की आटा, gehu pisaan, gehun atta, wheat flour"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  ग्राहकों व दुकानदारों द्वारा खोजे जाने वाले सामान्य बोलचाल के नाम
                </p>
              </div>

              {/* Active / Inactive Status Toggle */}
              <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block">
                    सामान की स्थिति (Active / Inactive Status)
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formData.isActive !== false
                      ? 'सक्रिय (Active) — दुकानों द्वारा कैटलॉग में जोड़ने हेतु उपलब्ध'
                      : 'निष्क्रिय (Inactive) — अस्थायी रूप से कैटलॉग से छुपा हुआ'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: formData.isActive === false ? true : false })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    formData.isActive !== false ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      formData.isActive !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  विवरण / टिप्पणी (Description - वैकल्पिक)
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="उदा. सामान्य Kirana दैनिक उपयोग सामान"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Notice that price is not set here */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-200/90">
                ⚠️ <strong>कृपया ध्यान दें:</strong> मास्टर कैटलॉग में कोई Price या Stock फ़ील्ड नहीं है। जब इस सामान को किसी दुकान में जोड़ा जाएगा, तब दुकानदार या एडमिन उस दुकान के हिसाब से Price तय करेंगे।
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30"
                >
                  {formSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {editingProduct ? 'मास्टर सामान अपडेट करें' : 'मास्टर कैटलॉग में जोड़ें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">मास्टर सामान हटाएं?</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              क्या आप वाकई इस सामान को सेंट्रल मास्टर कैटलॉग से हटाना चाहते हैं?{' '}
              <span className="text-slate-300">
                (नोट: जिन दुकानों में यह सामान पहले से जुड़ा हुआ है, वहां उनका डेटा सुरक्षित रहेगा और नहीं हटेगा।)
              </span>
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                रद्द करें
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30"
              >
                {isDeleting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                हटाएं
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
