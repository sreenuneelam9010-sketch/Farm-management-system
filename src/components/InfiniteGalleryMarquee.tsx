import React, { useState, useEffect } from 'react';
import { storageService, isFarmGalleryImage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GalleryImageItem } from '../types';
import { Camera, X, Maximize2, Sparkles, ChevronLeft, ChevronRight, Upload } from 'lucide-react';

export const InfiniteGalleryMarquee: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeModalItem, setActiveModalItem] = useState<GalleryImageItem | null>(null);
  const [farmImages, setFarmImages] = useState<GalleryImageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadGallery();

    let realtimeChannel: any;
    if (isSupabaseConfigured) {
      realtimeChannel = supabase
        .channel('public:farm_gallery_marquee_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'farm_gallery' }, () => {
          loadGallery();
        })
        .subscribe();
    }

    const handleUpdate = () => loadGallery();
    window.addEventListener('farm_gallery_updated', handleUpdate);

    return () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
      window.removeEventListener('farm_gallery_updated', handleUpdate);
    };
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const items = await storageService.getGalleryImages();
      // Ensure only real farm photos are included (strictly filter out leadership/owner photos)
      const validFarmPhotos = (items || []).filter(isFarmGalleryImage);
      setFarmImages(validFarmPhotos);
    } catch (e) {
      console.warn('Failed to load gallery for marquee:', e);
      setFarmImages([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'All',
    'Sheep & Goat'
  ];

  const filteredImages = selectedCategory === 'All'
    ? farmImages
    : farmImages.filter(img => (img.category || '').toLowerCase() === selectedCategory.toLowerCase());

  // Create marquee items array by repeating if items exist
  const marqueeItems = filteredImages.length > 0
    ? (filteredImages.length < 6
        ? [...filteredImages, ...filteredImages, ...filteredImages, ...filteredImages]
        : [...filteredImages, ...filteredImages, ...filteredImages])
    : [];

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrev = () => {
    if (!activeModalItem || filteredImages.length === 0) return;
    const currentIndex = filteredImages.findIndex(img => img.id === activeModalItem.id);
    const prevIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length;
    setActiveModalItem(filteredImages[prevIndex]);
  };

  const handleNext = () => {
    if (!activeModalItem || filteredImages.length === 0) return;
    const currentIndex = filteredImages.findIndex(img => img.id === activeModalItem.id);
    const nextIndex = (currentIndex + 1) % filteredImages.length;
    setActiveModalItem(filteredImages[nextIndex]);
  };

  return (
    <section id="farm-gallery-marquee" className="py-20 bg-[#020B07] border-t border-[#C5A059]/30 relative overflow-hidden">
      
      {/* Background glow accents */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#062C1E]/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/40 mb-3 shadow-lg">
            <Camera className="w-3.5 h-3.5 mr-2 text-[#C5A059]" />
            Farm Gallery
          </span>
          
          <h2 className="text-3xl sm:text-5xl font-serif-brand font-bold text-[#F2F2ED] tracking-tight">
            Our Farm in Pictures
          </h2>
          
          <p className="mt-3 text-sm sm:text-base text-emerald-200/80 max-w-2xl mx-auto">
            Take a visual tour of Lakshmi Venkateshwara Sheep & Natu Kolla Farm. Real photos of our livestock, slatted sheds, and green pastures.
          </p>
        </div>

        {/* Filter Category Tabs if images exist */}
        {farmImages.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-2 overflow-x-auto pb-3 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap shadow-md ${
                  selectedCategory === cat
                    ? 'bg-[#C5A059] text-slate-950 font-black scale-105 shadow-[#C5A059]/20'
                    : 'bg-[#062C1E] text-emerald-200/80 border border-[#C5A059]/25 hover:border-[#C5A059]/60 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* INFINITE SCROLLING MARQUEE CONTAINER OR EMPTY STATE */}
      {loading ? (
        <div className="text-center py-12 text-emerald-300 text-sm font-semibold">
          Loading farm gallery...
        </div>
      ) : marqueeItems.length === 0 ? (
        /* Mandatory Empty State Message when no uploaded farm images exist */
        <div className="max-w-xl mx-auto px-4 py-12 text-center bg-[#062C1E]/60 border border-[#C5A059]/30 rounded-3xl shadow-2xl relative z-10">
          <Camera className="w-12 h-12 text-[#C5A059] mx-auto mb-3 opacity-90" />
          <h3 className="text-lg font-serif-brand font-bold text-[#F2F2ED]">
            No farm images uploaded yet.
          </h3>
          <p className="mt-2 text-xs text-emerald-200/70">
            Upload real farm pictures (sheep, native chickens, slatted sheds, pastures) via the Admin Dashboard to display them in this gallery.
          </p>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden py-4 group">
          
          {/* Left & Right gradient shadow overlays for smooth edge fading */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#020B07] to-transparent z-20 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#020B07] to-transparent z-20 pointer-events-none"></div>

          {/* Continuous Marquee Track */}
          <div className="marquee-container flex gap-6 px-4">
            {marqueeItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                onClick={() => setActiveModalItem(item)}
                className="relative w-72 sm:w-80 sm:h-96 h-80 flex-shrink-0 rounded-3xl overflow-hidden dark-glass-card border border-[#C5A059]/30 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:border-[#C5A059] hover:shadow-[#C5A059]/20 group/card"
              >
                {/* Image or Missing Message */}
                {item.isMissing ? (
                  <div className="w-full h-full bg-[#04140E] p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <Camera className="w-8 h-8 text-[#C5A059]/70" />
                    <span className="text-xs text-[#C5A059] font-mono font-semibold px-2">
                      {item.missingFileName || item.title} not found in farm-images bucket
                    </span>
                  </div>
                ) : (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                  />
                )}

                {/* Top Category Badge */}
                {item.category && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 bg-[#04140E]/80 backdrop-blur-md text-[#C5A059] border border-[#C5A059]/40 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
                      {item.category}
                    </span>
                  </div>
                )}

                {/* View Overlay Icon */}
                <div className="absolute inset-0 bg-[#04140E]/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                  <div className="w-12 h-12 bg-[#C5A059] text-slate-950 rounded-full flex items-center justify-center shadow-xl transform scale-75 group-hover/card:scale-100 transition-transform duration-300">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>

                {/* Bottom Title & Description Glass Panel */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#04140E] via-[#04140E]/90 to-transparent z-10 pt-10">
                  <h3 className="text-sm font-serif-brand font-bold text-[#F2F2ED] line-clamp-1 group-hover/card:text-[#C5A059] transition-colors">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-[11px] text-emerald-200/70 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Hover Instruction Banner if images exist */}
      {farmImages.length > 0 && (
        <div className="mt-4 text-center">
          <span className="text-[11px] font-bold text-[#C5A059]/80 uppercase tracking-widest inline-flex items-center gap-1.5 bg-[#062C1E]/60 px-4 py-1.5 rounded-full border border-[#C5A059]/20">
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            Hover over gallery to pause continuous scroll • Click any photo for Lightbox preview
          </span>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {activeModalItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveModalItem(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-[#04140E] border-2 border-[#C5A059]/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between p-4 bg-[#062C1E] border-b border-[#C5A059]/30">
              <div className="flex items-center gap-2">
                {activeModalItem.category && (
                  <span className="px-3 py-1 bg-[#04140E] text-[#C5A059] border border-[#C5A059]/40 rounded-full text-xs font-black uppercase tracking-wider">
                    {activeModalItem.category}
                  </span>
                )}
                <span className="text-xs text-emerald-200/70 font-mono hidden sm:inline">
                  Farm Photo
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="p-2 bg-[#04140E] hover:bg-[#C5A059] text-[#C5A059] hover:text-slate-950 rounded-xl transition-colors border border-[#C5A059]/30"
                  title="Previous Image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 bg-[#04140E] hover:bg-[#C5A059] text-[#C5A059] hover:text-slate-950 rounded-xl transition-colors border border-[#C5A059]/30"
                  title="Next Image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="p-2 bg-red-950/80 hover:bg-red-600 text-white rounded-xl transition-colors border border-red-500/40 ml-2"
                  title="Close Preview (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Display */}
            <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[450px]">
              <img
                src={activeModalItem.image_url}
                alt={activeModalItem.title}
                referrerPolicy="no-referrer"
                className="max-h-[60vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Modal Footer Description */}
            <div className="p-6 bg-[#062C1E]/90 border-t border-[#C5A059]/30">
              <h3 className="text-xl sm:text-2xl font-serif-brand font-bold text-[#F2F2ED]">
                {activeModalItem.title}
              </h3>
              {activeModalItem.description && (
                <p className="mt-2 text-sm text-emerald-200/90 leading-relaxed">
                  {activeModalItem.description}
                </p>
              )}
              
              <div className="mt-4 pt-3 border-t border-[#C5A059]/20 flex flex-wrap items-center justify-between text-xs text-emerald-300/70">
                <div>
                  📍 Lakshmi Venkateshwara Sheep & Natu Kolla Farm
                </div>
                <div className="text-[#C5A059] font-bold">
                  Neelam Ramachandraiah (+91 9502756669)
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};

