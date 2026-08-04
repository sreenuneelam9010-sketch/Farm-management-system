import React, { useState, useEffect } from 'react';
import { storageService, isFarmGalleryImage, BUCKET_NAME } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GalleryImageItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { InfiniteGalleryMarquee } from '../components/InfiniteGalleryMarquee';
import { 
  Camera, Maximize2, X, ChevronLeft, ChevronRight, Phone, RefreshCw, 
  ZoomIn, ZoomOut, RotateCcw, SlidersHorizontal, Upload, Plus, Sparkles, CheckCircle2 
} from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [filter, setFilter] = useState<string>('All');
  const [activeModalItem, setActiveModalItem] = useState<GalleryImageItem | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [allImages, setAllImages] = useState<GalleryImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCarousel, setShowCarousel] = useState(true);

  // Touch Swipe Gesture State for Lightbox
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Admin Direct Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Sheep & Goat');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  useEffect(() => {
    loadStorageGallery();

    // Supabase Realtime channel for instant multi-user synchronization
    let realtimeChannel: any;
    if (isSupabaseConfigured) {
      realtimeChannel = supabase
        .channel('public:farm_gallery_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'farm_gallery' }, () => {
          loadStorageGallery();
        })
        .subscribe();
    }

    // Custom browser event for instant local uploads / modifications
    const handleUpdateEvent = () => loadStorageGallery();
    window.addEventListener('farm_gallery_updated', handleUpdateEvent);

    return () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
      window.removeEventListener('farm_gallery_updated', handleUpdateEvent);
    };
  }, []);

  const loadStorageGallery = async () => {
    setLoading(true);
    try {
      const storageItems = await storageService.getGalleryImages();
      setAllImages(storageItems || []);
    } catch (e) {
      console.warn('Failed to load farm gallery items:', e);
      setAllImages([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'All',
    'Sheep & Goat'
  ];

  const filtered = filter === 'All'
    ? allImages
    : allImages.filter(img => (img.category || '').toLowerCase() === filter.toLowerCase());

  // Lightbox Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeModalItem) return;
      if (e.key === 'Escape') setActiveModalItem(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === '0') handleResetZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalItem, filtered]);

  const handleOpenModal = (item: GalleryImageItem) => {
    setActiveModalItem(item);
    setZoomScale(1);
  };

  const handlePrev = () => {
    if (!activeModalItem || filtered.length === 0) return;
    const currentIndex = filtered.findIndex(img => img.id === activeModalItem.id);
    const prevIndex = (currentIndex - 1 + filtered.length) % filtered.length;
    setActiveModalItem(filtered[prevIndex]);
    setZoomScale(1);
  };

  const handleNext = () => {
    if (!activeModalItem || filtered.length === 0) return;
    const currentIndex = filtered.findIndex(img => img.id === activeModalItem.id);
    const nextIndex = (currentIndex + 1) % filtered.length;
    setActiveModalItem(filtered[nextIndex]);
    setZoomScale(1);
  };

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => setZoomScale(1);

  // Swipe Gestures for Mobile Lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50) {
      handleNext(); // Swipe left to view next
    } else if (distance < -50) {
      handlePrev(); // Swipe right to view previous
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Direct Admin Upload Handler
  const handleDirectUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const title = uploadFiles.length === 1 
          ? (uploadTitle.trim() || file.name.replace(/\.[^/.]+$/, '')) 
          : `${uploadTitle.trim() || 'Farm Photo'} #${i + 1}`;
        
        await storageService.addGalleryImage(
          title, 
          file, 
          uploadCategory, 
          uploadDescription.trim()
        );
      }

      setUploadTitle('');
      setUploadDescription('');
      setUploadFiles(null);
      setShowUploadModal(false);
      setUploadSuccessMsg('Uploaded new farm image(s) successfully to Supabase Storage & Database!');
      setTimeout(() => setUploadSuccessMsg(''), 5000);
      await loadStorageGallery();
    } catch (err) {
      console.error('Direct upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#04140E] min-h-screen text-[#F2F2ED]">
      
      {/* 1. TOP INFINITE SCROLLING CAROUSEL OPTION */}
      {showCarousel && <InfiniteGalleryMarquee />}

      {/* 2. RESPONSIVE GRID GALLERY SECTION */}
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#C5A059]/20">
        
        {/* Toast Notification */}
        {uploadSuccessMsg && (
          <div className="mb-6 max-w-2xl mx-auto bg-emerald-950 text-emerald-300 border border-emerald-500/50 p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xl animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {uploadSuccessMsg}
            </span>
            <button onClick={() => setUploadSuccessMsg('')} className="text-emerald-400 hover:text-white underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/40 shadow">
              <Camera className="w-3.5 h-3.5 mr-1.5 text-[#C5A059]" /> All Farm Photos
            </span>

            <button
              onClick={() => setShowCarousel(!showCarousel)}
              className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#062C1E] text-emerald-200 border border-[#C5A059]/20 hover:border-[#C5A059] transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3 mr-1 text-[#C5A059]" />
              {showCarousel ? 'Hide Carousel' : 'Show Auto Carousel'}
            </button>

            {/* Admin Direct Upload Trigger */}
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C5A059] text-slate-950 shadow-lg hover:bg-amber-400 transition-transform active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Upload Images
              </button>
            )}
          </div>

          <h2 className="text-2xl font-serif-brand font-bold text-[#F2F2ED] tracking-tight sm:text-4xl">
            Farm Photo Archive
          </h2>
          <p className="mt-2 text-emerald-200/80 text-sm sm:text-base">
            Authentic, high-resolution photos of our sheep flocks, Natu Kolla country chickens, slatted floor sheds, and green pastures ({allImages.length} photos uploaded).
          </p>
        </div>

        {/* Category Filter Tabs */}
        {allImages.length > 0 && (
          <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-3 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap shadow-md ${
                  filter === cat
                    ? 'bg-[#C5A059] text-slate-950 font-black scale-105 shadow-[#C5A059]/20'
                    : 'bg-[#062C1E] text-emerald-200/80 border border-[#C5A059]/20 hover:border-[#C5A059]/50 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#C5A059] gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Loading farm photo gallery...</span>
          </div>
        ) : filtered.length === 0 ? (
          /* Clean Empty State Message - Requirement 4 & Requirement 10 */
          <div className="text-center py-16 px-6 bg-[#062C1E]/60 border border-[#C5A059]/30 rounded-3xl max-w-xl mx-auto shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-[#04140E] border border-[#C5A059]/40 rounded-full flex items-center justify-center mx-auto text-[#C5A059] shadow-inner">
              <Camera className="w-8 h-8 opacity-90" />
            </div>
            
            <h3 className="text-xl font-serif-brand font-bold text-[#F2F2ED]">
              No farm images uploaded yet.
            </h3>

            <p className="text-xs text-emerald-200/70 max-w-md mx-auto leading-relaxed">
              Only authentic, uploaded farm photos (sheep, native chickens, slatted sheds, pastures) are displayed in this gallery.
            </p>

            {/* Admin Upload Button in Empty State */}
            {isAdmin ? (
              <div className="pt-2">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-[#C5A059] hover:bg-amber-400 text-slate-950 shadow-xl transition-all transform hover:scale-105"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-[#C5A059]/80 font-mono pt-2">
                Check back soon! New farm photos are uploaded regularly by farm supervisors.
              </p>
            )}
          </div>
        ) : (
          /* Responsive Masonry Grid: 1 column mobile, 2 tablet, 3-4 desktop */
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => handleOpenModal(item)}
                className="break-inside-avoid group relative rounded-3xl overflow-hidden shadow-xl border border-[#C5A059]/25 bg-[#062C1E]/90 hover:border-[#C5A059] hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Image Container with Natural Height / Aspect */}
                <div className="w-full overflow-hidden bg-[#04140E] relative">
                  {item.isMissing ? (
                    <div className="w-full h-64 bg-[#04140E] p-6 flex flex-col items-center justify-center text-center space-y-2 border border-[#C5A059]/30">
                      <Camera className="w-8 h-8 text-[#C5A059]/70" />
                      <span className="text-xs text-[#C5A059] font-mono font-semibold">
                        {item.missingFileName || item.title} not found in farm-images bucket
                      </span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={item.image_url}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      
                      {/* Hover View Overlay */}
                      <div className="absolute inset-0 bg-[#04140E]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-[#C5A059] text-slate-950 rounded-full flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Info Footer */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {item.category && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#C5A059] bg-[#04140E] px-2.5 py-0.5 rounded-full border border-[#C5A059]/30 inline-block">
                        {item.category}
                      </span>
                    )}
                    <h3 className="text-sm font-serif-brand font-bold text-[#F2F2ED] mt-2 group-hover:text-[#C5A059] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                  </div>
                  {item.description && (
                    <p className="text-xs text-emerald-200/70 mt-1.5 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* FULLSCREEN LIGHTBOX MODAL WITH ZOOM, NAV, SWIPE & KEYBOARD SUPPORT (Requirement 8) */}
      {activeModalItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6"
          onClick={() => setActiveModalItem(null)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="relative max-w-5xl w-full bg-[#04140E] border-2 border-[#C5A059]/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Lightbox Header Bar */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-[#062C1E] border-b border-[#C5A059]/30">
              <div className="flex items-center gap-2">
                {activeModalItem.category && (
                  <span className="px-3 py-1 bg-[#04140E] text-[#C5A059] border border-[#C5A059]/40 rounded-full text-xs font-black uppercase tracking-wider">
                    {activeModalItem.category}
                  </span>
                )}
                <span className="text-xs text-emerald-200/80 font-mono hidden sm:inline bg-[#04140E] px-2.5 py-1 rounded-lg border border-[#C5A059]/20">
                  {filtered.findIndex(img => img.id === activeModalItem.id) + 1} of {filtered.length}
                </span>
              </div>

              {/* Navigation & Zoom Toolbar */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-[#04140E] hover:bg-[#C5A059] text-[#C5A059] hover:text-slate-950 rounded-xl transition-colors border border-[#C5A059]/30"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-[#04140E] hover:bg-[#C5A059] text-[#C5A059] hover:text-slate-950 rounded-xl transition-colors border border-[#C5A059]/30"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                {zoomScale > 1 && (
                  <button
                    onClick={handleResetZoom}
                    className="p-2 bg-[#04140E] hover:bg-[#C5A059] text-[#C5A059] hover:text-slate-950 rounded-xl transition-colors border border-[#C5A059]/30"
                    title="Reset Zoom (0)"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <div className="h-5 w-px bg-[#C5A059]/30 mx-1"></div>
                <button
                  onClick={handlePrev}
                  className="p-2 bg-[#04140E] hover:bg-[#C5A059] text-[#C5A059] hover:text-slate-950 rounded-xl transition-colors border border-[#C5A059]/30"
                  title="Previous Image (Left Arrow)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 bg-[#04140E] hover:bg-[#C5A059] text-[#C5A059] hover:text-slate-950 rounded-xl transition-colors border border-[#C5A059]/30"
                  title="Next Image (Right Arrow)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="p-2 bg-red-950/80 hover:bg-red-600 text-white rounded-xl transition-colors border border-red-500/40 ml-1"
                  title="Close Preview (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image View Stage */}
            <div className="relative flex-1 bg-black overflow-auto flex items-center justify-center min-h-[320px] sm:min-h-[480px] p-4 select-none cursor-zoom-in">
              <img
                src={activeModalItem.image_url}
                alt={activeModalItem.title}
                referrerPolicy="no-referrer"
                style={{ transform: `scale(${zoomScale})`, transition: 'transform 0.25s ease-out' }}
                onClick={() => setZoomScale(prev => prev === 1 ? 1.8 : 1)}
                className="max-h-[65vh] w-auto max-w-full object-contain transition-transform"
              />

              {zoomScale > 1 && (
                <div className="absolute bottom-3 left-3 bg-black/80 text-[#C5A059] px-3 py-1 rounded-full text-xs font-mono border border-[#C5A059]/40">
                  Zoom: {zoomScale.toFixed(1)}x
                </div>
              )}
            </div>

            {/* Details Footer */}
            <div className="p-5 bg-[#062C1E]/95 border-t border-[#C5A059]/30">
              <h3 className="text-lg sm:text-2xl font-serif-brand font-bold text-[#F2F2ED]">
                {activeModalItem.title}
              </h3>
              {activeModalItem.description && (
                <p className="mt-1.5 text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                  {activeModalItem.description}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-[#C5A059]/20 flex flex-wrap items-center justify-between text-xs text-emerald-300/70 gap-2">
                <div>
                  📍 Lakshmi Venkateshwara Sheep & Natu Kolla Farm • Devarajapalli, Kadapa
                </div>
                <div className="text-[#C5A059] font-bold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Primary Contact: Neelam Ramachandraiah (+91 9502756669)
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADMIN DIRECT UPLOAD MODAL */}
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
              <h3 className="text-lg font-bold text-[#F2F2ED] flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#C5A059]" /> Upload Farm Photos to Storage
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-emerald-200/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectUpload} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-emerald-200 mb-1">Image Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Pure Breed Nellore Brown Ram in Grazing Land"
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
                  <option value="Sheep & Goat">Sheep & Goat</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-emerald-200 mb-1">Select Farm Photos (Single or Batch)</label>
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
                  placeholder="e.g. Slatted shed with clean drinking water trough"
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

    </div>
  );
};
