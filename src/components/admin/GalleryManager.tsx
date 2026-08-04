import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { storageService, BUCKET_NAME } from '../../lib/storage';
import { GalleryImageItem } from '../../types';
import { 
  Upload, Image as ImageIcon, Edit3, Trash2, CheckCircle2, AlertCircle, 
  RefreshCw, Eye, EyeOff, ArrowUp, ArrowDown, Search, Filter, Plus, Save, X, ShieldCheck
} from 'lucide-react';

export const GalleryManager: React.FC = () => {
  const [images, setImages] = useState<GalleryImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // New Image Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Sheep & Goat');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit Image Modal State
  const [editingImage, setEditingImage] = useState<GalleryImageItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Sheep & Goat');
  const [editDescription, setEditDescription] = useState('');
  const [editDisplayOrder, setEditDisplayOrder] = useState<number>(1);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editReplacementFile, setEditReplacementFile] = useState<File | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Preview Modal State
  const [previewImage, setPreviewImage] = useState<GalleryImageItem | null>(null);

  const categories = [
    'Sheep & Goat'
  ];

  useEffect(() => {
    fetchGalleryData();

    // Listen for realtime changes on farm_gallery
    let realtimeChannel: any;
    if (isSupabaseConfigured) {
      realtimeChannel = supabase
        .channel('public:admin_farm_gallery_realtime_v2')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'farm_gallery' }, () => {
          fetchGalleryData();
        })
        .subscribe();
    }

    const handleCustomUpdate = () => fetchGalleryData();
    window.addEventListener('farm_gallery_updated', handleCustomUpdate);

    return () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
      window.removeEventListener('farm_gallery_updated', handleCustomUpdate);
    };
  }, []);

  const fetchGalleryData = async () => {
    setLoading(true);
    try {
      const data = await storageService.getGalleryImages(true);
      setImages(data || []);
    } catch (err: any) {
      console.error('Failed to load gallery images for admin:', err);
      showNotification('Failed to fetch gallery records from database/storage.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  // Upload New Images Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) {
      showNotification('Please select at least one image file to upload.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      let count = 0;
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const title = uploadFiles.length === 1
          ? (uploadTitle.trim() || file.name.replace(/\.[^/.]+$/, ''))
          : `${uploadTitle.trim() || 'Farm Photo'} #${i + 1}`;

        await storageService.addGalleryImage(
          title,
          file,
          uploadCategory,
          uploadDescription.trim(),
          images.length + count + 1
        );
        count++;
      }

      setUploadTitle('');
      setUploadDescription('');
      setUploadFiles(null);
      setShowUploadModal(false);
      showNotification(`Successfully uploaded ${count} image(s) to 'farm-images' bucket & 'farm_gallery' table!`, 'success');
      await fetchGalleryData();
    } catch (err: any) {
      console.error('Upload failed:', err);
      showNotification(`Upload failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Open Edit Modal
  const handleStartEdit = (img: GalleryImageItem) => {
    setEditingImage(img);
    setEditTitle(img.title || '');
    setEditCategory('Sheep & Goat');
    setEditDescription(img.description || '');
    setEditDisplayOrder(img.display_order ?? 1);
    setEditIsActive(img.is_active !== false);
    setEditReplacementFile(null);
  };

  // Save Edit Metadata / Replace Image
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;

    setIsSavingEdit(true);
    try {
      let updatedImageUrl = editingImage.image_url;

      if (editReplacementFile && isSupabaseConfigured) {
        const cleanName = editReplacementFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const fileExt = cleanName.split('.').pop();
        const filePath = `gallery/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, editReplacementFile, { upsert: true, contentType: editReplacementFile.type });

        if (!uploadErr) {
          const { data: pubUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
          if (pubUrl?.publicUrl) {
            updatedImageUrl = pubUrl.publicUrl;
          }
        }
      }

      await storageService.updateGalleryImage(editingImage.id, {
        title: editTitle.trim(),
        category: editCategory,
        description: editDescription.trim(),
        display_order: editDisplayOrder,
        is_active: editIsActive,
        image_url: updatedImageUrl
      });

      setEditingImage(null);
      showNotification(`Updated image "${editTitle}" metadata successfully!`, 'success');
      await fetchGalleryData();
    } catch (err: any) {
      console.error('Failed to save image edits:', err);
      showNotification(`Failed to save edits: ${err.message || 'Error occurred'}`, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Image Record
  const handleDeleteImage = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" from the farm gallery?`)) return;

    try {
      await storageService.deleteGalleryImage(id);
      showNotification(`Deleted image "${title}" from database & storage.`, 'success');
      await fetchGalleryData();
    } catch (err: any) {
      console.error('Failed to delete image:', err);
      showNotification(`Deletion failed: ${err.message || 'Error occurred'}`, 'error');
    }
  };

  // Toggle Active / Inactive Status
  const handleToggleActive = async (img: GalleryImageItem) => {
    const newStatus = img.is_active === false;
    try {
      await storageService.updateGalleryImage(img.id, { is_active: newStatus });
      showNotification(`Image "${img.title}" is now ${newStatus ? 'Visible (Active)' : 'Hidden (Inactive)'}.`, 'info');
      await fetchGalleryData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Reorder Images
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredImages.length) return;

    const currentItem = filteredImages[index];
    const neighborItem = filteredImages[targetIndex];

    const currentOrder = currentItem.display_order ?? (index + 1);
    const neighborOrder = neighborItem.display_order ?? (targetIndex + 1);

    try {
      await storageService.updateGalleryImage(currentItem.id, { display_order: neighborOrder });
      await storageService.updateGalleryImage(neighborItem.id, { display_order: currentOrder });
      await fetchGalleryData();
    } catch (err) {
      console.error('Reordering failed:', err);
    }
  };

  // Filtered Images
  const filteredImages = images.filter(img => {
    const matchesCategory = selectedCategory === 'All' || (img.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchesQuery = searchQuery === '' || 
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (img.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="bg-[#04140E] text-[#F2F2ED] rounded-3xl p-6 sm:p-8 border border-[#C5A059]/30 shadow-2xl space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C5A059]/25 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/40">
              <ShieldCheck className="w-3.5 h-3.5 inline mr-1" /> Admin Gallery Control
            </span>
            <span className="text-xs text-emerald-200/60 font-mono">
              Bucket: <strong className="text-[#C5A059]">farm-images</strong> • Table: <strong className="text-[#C5A059]">farm_gallery</strong>
            </span>
          </div>
          <h2 className="text-2xl font-serif-brand font-bold text-[#F2F2ED] mt-2">
            Farm Gallery Manager
          </h2>
          <p className="text-xs text-emerald-200/80">
            Upload high-resolution farm photos to Supabase Storage, edit image metadata, reorder sequence, and delete entries with full loading states & error management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchGalleryData}
            disabled={loading}
            className="p-3 bg-[#062C1E] hover:bg-[#083a28] text-[#C5A059] border border-[#C5A059]/30 rounded-2xl transition-colors shadow flex items-center gap-2 text-xs font-bold"
            title="Refresh database & storage records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-3 bg-[#C5A059] hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload New Images
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xl transition-all ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300' 
            : statusMessage.type === 'error'
            ? 'bg-red-950/90 border-red-500/50 text-red-300'
            : 'bg-amber-950/90 border-amber-500/50 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="opacity-80 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Category Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#062C1E]/80 p-4 rounded-2xl border border-[#C5A059]/20">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#C5A059]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gallery images by title or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-white placeholder-emerald-200/50 focus:border-[#C5A059] focus:outline-none"
          />
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3.5 top-3.5 text-[#C5A059]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-white focus:border-[#C5A059] focus:outline-none"
          >
            <option value="All">All Categories ({images.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gallery Table / Grid */}
      {loading ? (
        <div className="py-16 text-center text-[#C5A059] flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Loading gallery management console...</span>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="py-12 px-6 text-center bg-[#062C1E]/40 border border-[#C5A059]/20 rounded-3xl space-y-3">
          <ImageIcon className="w-12 h-12 text-[#C5A059]/60 mx-auto" />
          <h3 className="text-base font-bold text-[#F2F2ED]">No gallery records found</h3>
          <p className="text-xs text-emerald-200/70 max-w-md mx-auto">
            No images match your current search/filter. Upload new farm photos to display them automatically on the live gallery page.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-2 inline-flex items-center px-4 py-2 bg-[#C5A059] text-slate-950 rounded-xl font-bold text-xs shadow hover:bg-amber-400"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Upload First Photo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-emerald-200/80 font-mono">
            <span>Showing {filteredImages.length} of {images.length} images</span>
            <span>Sorted by created_at DESC</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredImages.map((img, idx) => (
              <div
                key={img.id}
                className={`bg-[#062C1E] border rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-all ${
                  img.is_active === false ? 'border-red-500/40 opacity-75' : 'border-[#C5A059]/30 hover:border-[#C5A059]'
                }`}
              >
                {/* Image Aspect Box */}
                <div className="relative aspect-[4/3] bg-[#04140E] overflow-hidden group">
                  <img
                    src={img.image_url}
                    alt={img.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Status Overlay Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {img.is_active !== false ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-900/90 text-emerald-300 border border-emerald-500/40">
                        Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-950/90 text-red-300 border border-red-500/40">
                        Hidden
                      </span>
                    )}

                    {img.category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#04140E]/90 text-[#C5A059] border border-[#C5A059]/40 truncate max-w-[130px]">
                        {img.category}
                      </span>
                    )}
                  </div>

                  {/* Order Controls */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <button
                      onClick={() => handleMoveOrder(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 bg-[#04140E]/90 hover:bg-[#C5A059] text-[#C5A059] hover:text-slate-950 rounded-lg transition-colors border border-[#C5A059]/30 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(idx, 'down')}
                      disabled={idx === filteredImages.length - 1}
                      className="p-1.5 bg-[#04140E]/90 hover:bg-[#C5A059] text-[#C5A059] hover:text-slate-950 rounded-lg transition-colors border border-[#C5A059]/30 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Preview Button */}
                  <button
                    onClick={() => setPreviewImage(img)}
                    className="absolute bottom-2.5 right-2.5 p-2 bg-[#04140E]/90 hover:bg-[#C5A059] text-[#C5A059] hover:text-slate-950 rounded-xl transition-colors border border-[#C5A059]/30"
                    title="Fullscreen Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Info & Metadata */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif-brand font-bold text-sm text-[#F2F2ED] line-clamp-1">
                      {img.title}
                    </h4>
                    {img.description && (
                      <p className="text-xs text-emerald-200/70 mt-1 line-clamp-2">
                        {img.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#C5A059]/20 flex items-center justify-between text-[11px] text-emerald-200/60 font-mono">
                    <span>Order: #{img.display_order ?? (idx + 1)}</span>
                    <span className="truncate max-w-[120px]">{new Date(img.created_at || img.uploaded_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="px-4 py-3 bg-[#04140E] border-t border-[#C5A059]/20 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActive(img)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                      img.is_active !== false
                        ? 'bg-amber-950/60 text-amber-300 border-amber-500/30 hover:bg-amber-900/80'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/80'
                    }`}
                  >
                    {img.is_active !== false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {img.is_active !== false ? 'Hide' : 'Show'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartEdit(img)}
                      className="px-3 py-1.5 bg-[#062C1E] hover:bg-[#083a28] text-[#C5A059] border border-[#C5A059]/40 rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteImage(img.id, img.title)}
                      className="p-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/30 rounded-xl transition-colors"
                      title="Delete Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div 
            className="bg-[#062C1E] border-2 border-[#C5A059]/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#F2F2ED]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-3">
              <h3 className="text-lg font-serif-brand font-bold text-[#F2F2ED] flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#C5A059]" /> Upload Images to farm-images
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-emerald-200/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-emerald-200 mb-1">Image Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Nellore Brown Breeding Ram in Pasture"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#04140E] border border-[#C5A059]/30 text-white focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-200 mb-1">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#04140E] border border-[#C5A059]/30 text-white focus:border-[#C5A059] focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-emerald-200 mb-1">Select Files (Single or Multiple)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setUploadFiles(e.target.files)}
                  required
                  className="w-full text-xs text-emerald-200 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#C5A059] file:text-slate-950 hover:file:bg-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-200 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="e.g. Pure breed male sheep kept under regular veterinary care"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#04140E] border border-[#C5A059]/30 text-white focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#C5A059]/20">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#04140E] text-emerald-200/80 hover:text-white border border-[#C5A059]/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2 rounded-xl bg-[#C5A059] hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Upload Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setEditingImage(null)}
        >
          <div 
            className="bg-[#062C1E] border-2 border-[#C5A059]/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#F2F2ED]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-3">
              <h3 className="text-lg font-serif-brand font-bold text-[#F2F2ED] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#C5A059]" /> Edit Image Metadata
              </h3>
              <button onClick={() => setEditingImage(null)} className="text-emerald-200/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-[#04140E] rounded-xl border border-[#C5A059]/20">
                <img
                  src={editingImage.image_url}
                  alt={editingImage.title}
                  className="w-16 h-16 object-cover rounded-lg border border-[#C5A059]/30"
                />
                <div>
                  <div className="font-bold text-[#F2F2ED] text-xs line-clamp-1">{editingImage.title}</div>
                  <div className="text-[10px] text-emerald-200/60 font-mono mt-0.5">ID: {editingImage.id}</div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-emerald-200 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#04140E] border border-[#C5A059]/30 text-white focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-200 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#04140E] border border-[#C5A059]/30 text-white focus:border-[#C5A059] focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-200 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editDisplayOrder}
                    onChange={(e) => setEditDisplayOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#04140E] border border-[#C5A059]/30 text-white focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-200 mb-1">Visibility Status</label>
                  <select
                    value={editIsActive ? 'active' : 'hidden'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#04140E] border border-[#C5A059]/30 text-white focus:border-[#C5A059] focus:outline-none"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="hidden">Hidden (Inactive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-emerald-200 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#04140E] border border-[#C5A059]/30 text-white focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-200 mb-1">Replace Image File (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditReplacementFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-emerald-200 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#C5A059] file:text-slate-950 hover:file:bg-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#C5A059]/20">
                <button
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="px-4 py-2 rounded-xl bg-[#04140E] text-emerald-200/80 hover:text-white border border-[#C5A059]/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2 rounded-xl bg-[#C5A059] hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-[#04140E] border-2 border-[#C5A059]/50 rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 bg-[#062C1E] border-b border-[#C5A059]/30">
              <h3 className="font-serif-brand font-bold text-[#F2F2ED]">{previewImage.title}</h3>
              <button onClick={() => setPreviewImage(null)} className="p-1 text-emerald-200/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center min-h-[300px]">
              <img
                src={previewImage.image_url}
                alt={previewImage.title}
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            {previewImage.description && (
              <div className="p-4 bg-[#062C1E] border-t border-[#C5A059]/20 text-xs text-emerald-200/90">
                {previewImage.description}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
