import React, { useState, useEffect } from 'react';
import { storageService, BUCKET_NAME, getFounderAvatarUrl } from '../lib/storage';
import { OwnerProfile, GalleryImageItem } from '../types';

import founder1 from '../assets/founders/founder-1.jpg';
import founder2 from '../assets/founders/founder-2.jpg';
import founder3 from '../assets/founders/founder-3.jpg';
import { isSupabaseConfigured } from '../lib/supabase';
import { processFarmImage } from '../lib/imageProcessor';
import { Image, Upload, Trash2, CheckCircle2, Shield, Database, RefreshCw, Edit3, ArrowUp, ArrowDown, Eye, Check, X, Layers, FileImage, Scissors, Maximize2, Sparkles } from 'lucide-react';

export const ImageManager: React.FC = () => {
  const [owners, setOwners] = useState<OwnerProfile[]>([]);
  const [gallery, setGallery] = useState<GalleryImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingOwnerId, setUploadingOwnerId] = useState<string | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // New Gallery Item state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Sheep & Goat');
  const [newFiles, setNewFiles] = useState<FileList | null>(null);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit Item Modal State
  const [editingItem, setEditingItem] = useState<GalleryImageItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Sheep & Goat');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Preview Modal
  const [previewImage, setPreviewImage] = useState<GalleryImageItem | null>(null);

  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = async () => {
    setLoading(true);
    const [ownersData, galleryData] = await Promise.all([
      storageService.getOwners(),
      storageService.getGalleryImages(true) // Include inactive images for admin view
    ]);
    setOwners(ownersData);
    setGallery(galleryData);
    setLoading(false);
  };

  const handleOwnerUpload = async (ownerId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingOwnerId(ownerId);
    setMessage(null);
    try {
      await storageService.updateOwnerPhoto(ownerId, file);
      await refreshAll();
      setMessage({ text: 'Owner photo successfully uploaded and updated in Supabase storage & database!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to upload owner image. Please try again.', type: 'error' });
    } finally {
      setUploadingOwnerId(null);
    }
  };

  const handleAddGalleryImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFiles || newFiles.length === 0) {
      setMessage({ text: 'Please select at least one image file.', type: 'error' });
      return;
    }

    setIsUploadingGallery(true);
    setMessage(null);
    try {
      let count = 0;
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const title = newFiles.length === 1 
          ? (newTitle.trim() || file.name.replace(/\.[^/.]+$/, "")) 
          : `${newTitle.trim() || 'Farm Photo'} #${i + 1}`;
        
        await storageService.addGalleryImage(
          title, 
          file, 
          newCategory, 
          newDescription.trim(),
          gallery.length + count + 1
        );
        count++;
      }

      setNewTitle('');
      setNewDescription('');
      setNewFiles(null);
      await refreshAll();
      setMessage({ text: `Successfully uploaded ${count} farm image(s) to Supabase Storage bucket "${BUCKET_NAME}" & database "farm_gallery"!`, type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to upload gallery images.', type: 'error' });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleStartEdit = (item: GalleryImageItem) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
    setEditCategory('Sheep & Goat');
    setEditIsActive(item.is_active !== false);
    setEditFile(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSavingEdit(true);
    try {
      await storageService.updateGalleryImage(editingItem.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        is_active: editIsActive,
        file: editFile || undefined
      });
      await refreshAll();
      setEditingItem(null);
      setMessage({ text: 'Gallery image updated successfully.', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to update image details.', type: 'error' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleReplaceImageFile = async (id: string, file: File) => {
    setMessage(null);
    try {
      await storageService.updateGalleryImage(id, { file });
      await refreshAll();
      setMessage({ text: 'Image file replaced successfully in Supabase Storage!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to replace image file.', type: 'error' });
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gallery image?')) return;
    try {
      await storageService.deleteGalleryImage(id);
      await refreshAll();
      setMessage({ text: 'Image deleted from gallery database.', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to delete image.', type: 'error' });
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= gallery.length) return;

    const newGallery = [...gallery];
    const temp = newGallery[index];
    newGallery[index] = newGallery[targetIndex];
    newGallery[targetIndex] = temp;

    // Update display orders
    const reordered = newGallery.map((item, idx) => ({
      id: item.id,
      display_order: idx + 1
    }));

    setGallery(newGallery);
    await storageService.reorderGalleryImages(reordered);
    await refreshAll();
  };

  const handleStandardizeAllImages = async () => {
    if (gallery.length === 0) return;
    if (!confirm(`Are you sure you want to standardize all ${gallery.length} gallery images to 1152 × 1536 px (3:4 portrait aspect ratio) with intelligent center-cropping?`)) return;

    setIsProcessingBatch(true);
    setMessage(null);
    let successCount = 0;

    try {
      for (const item of gallery) {
        try {
          // Process current image URL
          const processed = await processFarmImage(item.image_url, `${item.title || 'farm_image'}.jpg`);
          await storageService.updateGalleryImage(item.id, {
            file: processed.file
          });
          successCount++;
        } catch (e) {
          console.error(`Failed processing image ${item.id}`, e);
        }
      }
      await refreshAll();
      setMessage({
        text: `Successfully standardized ${successCount} image(s) to 1152 × 1536 pixels (3:4 aspect ratio) in JPEG format!`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Batch image standardization failed.', type: 'error' });
    } finally {
      setIsProcessingBatch(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Summary Diagnostics Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold">Supabase Farm Gallery Storage & Database</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Official farm media repository for Lakshmi Venkateshwara Farm. Images are stored in cloud object storage bucket and recorded in `farm_gallery`.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isSupabaseConfigured 
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSupabaseConfigured ? 'Supabase Storage Connected' : 'Local Storage Mode'}
            </span>
            <button
              onClick={refreshAll}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
              title="Refresh Media Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Technical Specs & Summary Stats */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-medium block">Total Uploaded Images:</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">{gallery.length} Photos</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Active: {gallery.filter(i => i.is_active !== false).length} • Inactive: {gallery.filter(i => i.is_active === false).length}</span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-medium block">Standard Resolution & Aspect:</span>
            <span className="text-amber-300 font-bold font-mono text-sm mt-1 block flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" /> 1152 × 1536 px (3:4 Portrait)
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Intelligent Center Crop • 95%+ Quality</span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-medium block">Storage Bucket & DB Table:</span>
            <span className="text-emerald-300 font-bold font-mono text-sm mt-1 block">{BUCKET_NAME}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">farm_gallery database table</span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-medium block">Image Integrity Guarantee:</span>
            <span className="text-blue-300 font-bold font-mono text-sm mt-1 block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> 100% Real Farm Photos
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Zero AI / Zero Filters / Zero Watermarks</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-semibold flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* 1. Owner Profile Images Management */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" /> Owner & Founder Profiles
            </h3>
            <p className="text-xs text-slate-500">
              Official leadership profiles for Neelam Ramachandraiah, Neelam Subbaiah, and Neelam Sreenivasulu.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'founder-1', name: 'Neelam Ramachandraiah', designation: 'Founder', phone: '+91 9502756669', src: founder1, fallback: founder1 },
            { id: 'founder-2', name: 'Neelam Subbaiah', designation: 'Founder', phone: '+91 8897288390', src: founder2, fallback: founder2 },
            { id: 'founder-3', name: 'Neelam Sreenivasulu', designation: 'Digital Operator', phone: '+91 9392589010', src: founder3, fallback: founder3 }
          ].map(owner => (
            <div key={owner.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center justify-between space-y-4">
              <div className="relative">
                <img
                  src={owner.src}
                  alt={owner.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-emerald-600 shadow-md"
                  onError={(e) => {
                    if ((e.currentTarget as HTMLImageElement).src !== owner.fallback) {
                      (e.currentTarget as HTMLImageElement).src = owner.fallback;
                    }
                  }}
                />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {owner.designation}
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">{owner.name}</h4>
                <p className="text-xs text-slate-500">{owner.phone}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Farm Gallery Admin Management */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Image className="w-5 h-5 text-emerald-600" /> Admin Farm Gallery Management
            </h3>
            <p className="text-xs text-slate-500">
              Upload real farm images, replace, reorder, edit titles/descriptions, and toggle display visibility.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleStandardizeAllImages}
              disabled={isProcessingBatch || gallery.length === 0}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
              title="Resize and center-crop all uploaded gallery images to 1152x1536 3:4 aspect ratio JPEGs"
            >
              <Scissors className={`w-3.5 h-3.5 ${isProcessingBatch ? 'animate-spin' : ''}`} />
              {isProcessingBatch ? 'Standardizing...' : 'Standardize All (1152×1536)'}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>{gallery.length} Images Saved in DB</span>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleAddGalleryImages} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-700" /> Upload New Real Farm Images
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Image Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Pure Breed Jodipi Ram in Grazing Field"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Sheep & Goat">Sheep & Goat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Farm Photos (Single or Batch)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setNewFiles(e.target.files)}
                className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Image Description (Optional)</label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="e.g. Slatted floor shed with clean drinking water trough for breeding sheep"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploadingGallery}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isUploadingGallery ? 'Uploading to Bucket & DB...' : 'Upload Farm Images'}
            </button>
          </div>
        </form>

        {/* Existing Gallery Table / Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase px-2">
            <span>Uploaded Gallery Records ({gallery.length})</span>
            <span>Controls: Reorder | Edit | Replace | Delete</span>
          </div>

          {gallery.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No farm images uploaded yet. Use the form above to upload real farm pictures.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`bg-slate-50 rounded-2xl border ${item.is_active === false ? 'border-amber-300 bg-amber-50/40 opacity-75' : 'border-slate-200'} p-4 flex flex-col justify-between shadow-sm relative group`}
                >
                  <div className="space-y-3">
                    {/* Thumbnail and Header */}
                    <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="bg-slate-900/80 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          #{item.display_order ?? index + 1}
                        </span>
                        {item.category && (
                          <span className="bg-emerald-950/90 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {/* Top Action Overlay */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 group-hover:opacity-100">
                        <button
                          onClick={() => setPreviewImage(item)}
                          className="p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg transition-colors"
                          title="Preview Full Size"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGalleryItem(item.id)}
                          className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow"
                          title="Delete Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                        URL: {item.image_url}
                      </p>
                    </div>
                  </div>

                  {/* Controls Toolbar */}
                  <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    {/* Reorder Up/Down */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-30 text-slate-700 rounded-lg text-xs"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === gallery.length - 1}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-30 text-slate-700 rounded-lg text-xs"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Edit Details */}
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>

                    {/* Replace Image File */}
                    <label className="cursor-pointer px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
                      <FileImage className="w-3 h-3" /> Replace
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleReplaceImageFile(item.id, file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Image Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" /> Edit Gallery Image Details
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Sheep & Goat">Sheep & Goat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Active in Public Gallery Page
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Replace Image File (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full bg-slate-900 p-4 rounded-3xl border border-slate-700 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center text-white pb-2 border-b border-slate-800">
              <span className="text-sm font-bold">{previewImage.title}</span>
              <button onClick={() => setPreviewImage(null)} className="p-1 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={previewImage.image_url} alt={previewImage.title} className="max-h-[70vh] w-auto mx-auto object-contain rounded-2xl" />
            {previewImage.description && (
              <p className="text-xs text-slate-300 text-center">{previewImage.description}</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
