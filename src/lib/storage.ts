import { supabase, isSupabaseConfigured } from './supabase';
import { OwnerProfile, GalleryImageItem } from '../types';
import { processFarmImage, processProfileImage } from './imageProcessor';

import founder1 from '../assets/founders/founder-1.jpg';
import founder2 from '../assets/founders/founder-2.jpg';
import founder3 from '../assets/founders/founder-3.jpg';

export const BUCKET_NAME = 'farm-images';
export const PRODUCT_BUCKET_NAME = 'product-images';
export const PROFILE_BUCKET_NAME = 'profile-images';
export const DOCUMENTS_BUCKET_NAME = 'documents';

export const FOUNDER_IMAGES: Record<string, string> = {
  'owner-1': founder1,
  'owner-2': founder2,
  'owner-3': founder3,
  'founder-1': founder1,
  'founder-2': founder2,
  'founder-3': founder3,
};

export function getFounderImageUrl(id: string, name: string, rawUrl?: string): string {
  // If user explicitly uploaded a new data:image or blob: URL during current session, keep it
  if (rawUrl && (rawUrl.startsWith('data:image/') || rawUrl.startsWith('blob:'))) {
    return rawUrl;
  }
  
  // If rawUrl is a valid non-placeholder http URL uploaded via storage, use it
  if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) && 
      !rawUrl.includes('ui-avatars.com') && 
      !rawUrl.includes('placeholder') && 
      !rawUrl.includes('1.jpeg') && 
      !rawUrl.includes('2.jpeg') && 
      !rawUrl.includes('3.jpeg')) {
    return rawUrl;
  }

  // Map to bundled founder assets
  if (id === 'owner-1' || id === 'founder-1' || (name && name.toLowerCase().includes('ramachandraiah'))) {
    return founder1;
  }
  if (id === 'owner-2' || id === 'founder-2' || (name && name.toLowerCase().includes('subbaiah'))) {
    return founder2;
  }
  if (id === 'owner-3' || id === 'founder-3' || (name && name.toLowerCase().includes('sreenivasulu'))) {
    return founder3;
  }

  return FOUNDER_IMAGES[id] || founder1;
}

export function getFounderAvatarUrl(id: string, name: string, rawUrl?: string): string {
  return getFounderImageUrl(id, name, rawUrl);
}

export const DEFAULT_OWNERS: OwnerProfile[] = [
  {
    id: 'owner-1',
    name: 'Neelam Ramachandraiah',
    designation: 'Founder',
    phone: '+91 9502756669',
    image_url: founder1
  },
  {
    id: 'owner-2',
    name: 'Neelam Subbaiah',
    designation: 'Founder',
    phone: '+91 8897288390',
    image_url: founder2
  },
  {
    id: 'owner-3',
    name: 'Neelam Sreenivasulu',
    designation: 'Digital Operator',
    phone: '+91 9392589010',
    image_url: founder3
  }
];

export const DEFAULT_GALLERY: GalleryImageItem[] = [];

// Helper function to check if an image is a farm image (and not an owner profile image)
export function isFarmGalleryImage(item: GalleryImageItem): boolean {
  if (!item) return false;
  if (item.category === 'Owners & Leadership') return false;
  const titleLower = (item.title || '').toLowerCase();
  if (
    titleLower.includes('founder') ||
    titleLower.includes('digital operation') ||
    titleLower.includes('digital operator') ||
    titleLower.includes('client relations') ||
    titleLower.includes('neelam')
  ) {
    return false;
  }
  const url = item.image_url || '';
  if (url === '/1.jpeg' || url === '/2.jpeg' || url === '/3.jpeg') {
    return false;
  }
  return true;
}

class StorageService {
  private getLocalOwners(): OwnerProfile[] {
    try {
      const stored = localStorage.getItem('lvf_owners');
      if (stored) {
        const parsed: OwnerProfile[] = JSON.parse(stored);
        return parsed.map(owner => {
          const resolvedUrl = getFounderAvatarUrl(owner.id, owner.name, owner.image_url);
          if (owner.id === 'owner-3' || owner.name === 'Neelam Sreenivasulu') {
            return { ...owner, designation: 'Digital Operator', image_url: resolvedUrl };
          }
          return { ...owner, image_url: resolvedUrl };
        });
      }
      return DEFAULT_OWNERS;
    } catch {
      return DEFAULT_OWNERS;
    }
  }

  private setLocalOwners(owners: OwnerProfile[]) {
    try {
      localStorage.setItem('lvf_owners', JSON.stringify(owners));
    } catch (e) {
      console.error('Failed to save local owners', e);
    }
  }

  private getLocalGallery(): GalleryImageItem[] {
    try {
      const stored = localStorage.getItem('lvf_gallery_images');
      return stored ? JSON.parse(stored) : DEFAULT_GALLERY;
    } catch {
      return DEFAULT_GALLERY;
    }
  }

  private setLocalGallery(items: GalleryImageItem[]) {
    try {
      localStorage.setItem('lvf_gallery_images', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save local gallery', e);
    }
  }

  // Owners
  async getOwners(): Promise<OwnerProfile[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('owners').select('*').order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          const normalized = data.map((owner: any) => {
            const resolvedUrl = getFounderAvatarUrl(owner.id, owner.name, owner.image_url);
            return {
              ...owner,
              image_url: resolvedUrl,
              designation: (owner.id === 'owner-3' || owner.name === 'Neelam Sreenivasulu') ? 'Digital Operator' : owner.designation
            };
          });
          this.setLocalOwners(normalized);
          return normalized;
        }
      } catch (err) {
        console.warn('Supabase fetch owners failed, falling back to local data', err);
      }
    }
    return this.getLocalOwners();
  }

  async updateOwnerPhoto(ownerId: string, rawFile: File): Promise<string> {
    let publicUrl = '';
    let file = rawFile;
    try {
      const processed = await processFarmImage(rawFile, rawFile.name);
      file = processed.file;
    } catch (e) {
      console.warn('Image processing fallback to raw file', e);
    }

    if (isSupabaseConfigured) {
      try {
        const fileName = `owners/${ownerId}_${Date.now()}.jpg`;

        // Upload to profile-images bucket
        const { error: uploadError } = await supabase.storage
          .from(PROFILE_BUCKET_NAME)
          .upload(fileName, file, { upsert: true, contentType: file.type || 'image/jpeg' });

        if (!uploadError) {
          const { data } = supabase.storage.from(PROFILE_BUCKET_NAME).getPublicUrl(fileName);
          publicUrl = data.publicUrl;

          // Update PostgreSQL owners table
          await supabase
            .from('owners')
            .update({ image_url: publicUrl })
            .eq('id', ownerId);
        }
      } catch (err) {
        console.error('Supabase upload error:', err);
      }
    }

    // Client fallback if Supabase not configured or failed
    if (!publicUrl) {
      publicUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    // Update local state
    const current = this.getLocalOwners();
    const updated = current.map(o => o.id === ownerId ? { ...o, image_url: publicUrl } : o);
    this.setLocalOwners(updated);

    return publicUrl;
  }

  // Gallery - Load f1.jpeg (left) and f11.jpeg (right) from farm-images bucket
  async getGalleryImages(includeInactive = false): Promise<GalleryImageItem[]> {
    const targetFiles = ['f1.jpeg', 'f11.jpeg'];
    const items: GalleryImageItem[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data: rootFiles } = await supabase.storage
          .from(BUCKET_NAME)
          .list('', { limit: 100 });
        const { data: galleryFiles } = await supabase.storage
          .from(BUCKET_NAME)
          .list('gallery', { limit: 100 });

        const rootNames = (rootFiles || []).map(f => f.name);
        const galleryNames = (galleryFiles || []).map(f => f.name);

        for (let i = 0; i < targetFiles.length; i++) {
          const fileName = targetFiles[i];
          let filePath = '';

          if (rootNames.includes(fileName)) {
            filePath = fileName;
          } else if (galleryNames.includes(fileName)) {
            filePath = `gallery/${fileName}`;
          }

          if (filePath) {
            const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
            items.push({
              id: `farm-${fileName}`,
              title: fileName,
              image_url: data.publicUrl,
              uploaded_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              category: 'Sheep & Goat',
              description: `Uploaded farm photo ${fileName}`,
              display_order: i + 1,
              is_active: true,
              isMissing: false,
              missingFileName: fileName
            });
          } else {
            items.push({
              id: `farm-missing-${fileName}`,
              title: fileName,
              image_url: '',
              uploaded_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              category: 'Sheep & Goat',
              description: `${fileName} not found in farm-images bucket`,
              display_order: i + 1,
              is_active: true,
              isMissing: true,
              missingFileName: fileName
            });
          }
        }

        return items;
      } catch (err) {
        console.warn('Supabase storage check failed, using direct public URLs for f1.jpeg & f11.jpeg', err);
      }
    }

    // Direct fallback public URLs for f1.jpeg and f11.jpeg
    const f1Url = `https://cigyjcodvzshgqrjghxc.supabase.co/storage/v1/object/public/farm-images/f1.jpeg`;
    const f11Url = `https://cigyjcodvzshgqrjghxc.supabase.co/storage/v1/object/public/farm-images/f11.jpeg`;

    return [
      {
        id: 'farm-f1.jpeg',
        title: 'f1.jpeg',
        image_url: f1Url,
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        category: 'Sheep & Goat',
        description: 'Uploaded farm photo f1.jpeg',
        display_order: 1,
        is_active: true,
        isMissing: false,
        missingFileName: 'f1.jpeg'
      },
      {
        id: 'farm-f11.jpeg',
        title: 'f11.jpeg',
        image_url: f11Url,
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        category: 'Sheep & Goat',
        description: 'Uploaded farm photo f11.jpeg',
        display_order: 2,
        is_active: true,
        isMissing: false,
        missingFileName: 'f11.jpeg'
      }
    ];
  }

  async addGalleryImage(
    title: string, 
    rawFile: File, 
    category: string = 'Sheep & Goat', 
    description: string = '',
    displayOrder?: number
  ): Promise<GalleryImageItem> {
    let publicUrl = '';
    let file = rawFile;
    try {
      const processed = await processFarmImage(rawFile, rawFile.name);
      file = processed.file;
    } catch (err) {
      console.warn('Fallback to raw file for gallery upload', err);
    }

    let resultItem: GalleryImageItem | null = null;

    if (isSupabaseConfigured) {
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const fileName = `gallery/${Date.now()}_${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, file, { upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
          publicUrl = data.publicUrl;

          const currentGallery = this.getLocalGallery();
          const nextOrder = displayOrder ?? (currentGallery.length + 1);

          // Insert into farm_gallery table
          const { data: inserted, error: dbError } = await supabase
            .from('farm_gallery')
            .insert([{
              image_url: publicUrl,
              image_title: title,
              image_description: description,
              uploaded_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              display_order: nextOrder,
              is_active: true,
              category
            }])
            .select()
            .single();

          // Also insert into legacy gallery_images for backward compatibility
          try {
            await supabase.from('gallery_images').insert([{
              title,
              image_url: publicUrl,
              uploaded_at: new Date().toISOString()
            }]);
          } catch {}

          if (!dbError && inserted) {
            resultItem = {
              id: inserted.id,
              title: inserted.image_title || title,
              image_url: inserted.image_url,
              category: inserted.category || category,
              description: inserted.image_description || description,
              uploaded_at: inserted.uploaded_at || inserted.created_at,
              created_at: inserted.created_at || inserted.uploaded_at,
              display_order: inserted.display_order ?? nextOrder,
              is_active: inserted.is_active ?? true
            };
            this.setLocalGallery([resultItem, ...currentGallery]);
          }
        }
      } catch (err) {
        console.error('Supabase gallery upload error:', err);
      }
    }

    if (!resultItem) {
      if (!publicUrl) {
        publicUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const current = this.getLocalGallery();
      resultItem = {
        id: `gal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title,
        image_url: publicUrl,
        category,
        description,
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        display_order: displayOrder ?? (current.length + 1),
        is_active: true
      };

      const updated = [resultItem, ...current];
      this.setLocalGallery(updated);
    }

    // Trigger auto refresh across all active tabs/components (Requirement 11)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farm_gallery_updated'));
    }

    return resultItem;
  }

  async updateGalleryImage(
    id: string,
    updates: {
      title?: string;
      description?: string;
      category?: string;
      display_order?: number;
      is_active?: boolean;
      image_url?: string;
      file?: File;
    }
  ): Promise<GalleryImageItem | null> {
    const current = this.getLocalGallery();
    const target = current.find(item => item.id === id);
    if (!target) return null;

    let updatedUrl = updates.image_url || target.image_url;

    // Handle image file replacement if provided
    if (updates.file) {
      let fileToUpload = updates.file;
      try {
        const processed = await processFarmImage(updates.file, updates.file.name);
        fileToUpload = processed.file;
      } catch (err) {
        console.warn('Failed to auto-process replaced image file', err);
      }

      if (isSupabaseConfigured) {
        try {
          const cleanName = fileToUpload.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
          const fileName = `gallery/${Date.now()}_${cleanName}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, fileToUpload, { upsert: true });

          if (!uploadError) {
            const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
            updatedUrl = data.publicUrl;
          }
        } catch (e) {
          console.error('Error replacing image file:', e);
        }
      } else {
        updatedUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(fileToUpload);
        });
      }
    }

    const updatedItem: GalleryImageItem = {
      ...target,
      title: updates.title !== undefined ? updates.title : target.title,
      description: updates.description !== undefined ? updates.description : target.description,
      category: updates.category !== undefined ? updates.category : target.category,
      display_order: updates.display_order !== undefined ? updates.display_order : target.display_order,
      is_active: updates.is_active !== undefined ? updates.is_active : target.is_active,
      image_url: updatedUrl
    };

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('farm_gallery')
          .update({
            image_title: updatedItem.title,
            image_description: updatedItem.description,
            category: updatedItem.category,
            display_order: updatedItem.display_order,
            is_active: updatedItem.is_active,
            image_url: updatedItem.image_url
          })
          .eq('id', id);

        // Also update legacy table
        await supabase
          .from('gallery_images')
          .update({
            title: updatedItem.title,
            image_url: updatedItem.image_url
          })
          .eq('id', id);
      } catch (err) {
        console.error('Supabase update gallery error:', err);
      }
    }

    const newGalleryList = current.map(item => item.id === id ? updatedItem : item);
    this.setLocalGallery(newGalleryList);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farm_gallery_updated'));
    }

    return updatedItem;
  }

  async deleteGalleryImage(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('farm_gallery').delete().eq('id', id);
        await supabase.from('gallery_images').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete error', err);
      }
    }
    const current = this.getLocalGallery();
    const updated = current.filter(i => i.id !== id);
    this.setLocalGallery(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farm_gallery_updated'));
    }

    return true;
  }

  async reorderGalleryImages(reorderedItems: { id: string; display_order: number }[]): Promise<boolean> {
    const current = this.getLocalGallery();
    const orderMap = new Map(reorderedItems.map(item => [item.id, item.display_order]));

    const updated = current.map(item => {
      if (orderMap.has(item.id)) {
        return { ...item, display_order: orderMap.get(item.id)! };
      }
      return item;
    });

    updated.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    this.setLocalGallery(updated);

    if (isSupabaseConfigured) {
      try {
        for (const item of reorderedItems) {
          await supabase
            .from('farm_gallery')
            .update({ display_order: item.display_order })
            .eq('id', item.id);
        }
      } catch (err) {
        console.error('Supabase reorder error:', err);
      }
    }
    return true;
  }

  // Product Images Bucket
  async uploadProductImage(file: File, productId?: string): Promise<string> {
    let fileToUpload = file;
    try {
      const processed = await processFarmImage(file, file.name);
      fileToUpload = processed.file;
    } catch (e) {
      console.warn('Image processing fallback for product image', e);
    }

    if (isSupabaseConfigured) {
      try {
        const cleanName = fileToUpload.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const path = `products/${productId || 'prod'}_${Date.now()}_${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_BUCKET_NAME)
          .upload(path, fileToUpload, { upsert: true, contentType: fileToUpload.type || 'image/jpeg' });

        if (!uploadError) {
          const { data } = supabase.storage.from(PRODUCT_BUCKET_NAME).getPublicUrl(path);
          return data.publicUrl;
        } else {
          console.error('Error uploading product image:', uploadError);
        }
      } catch (err) {
        console.error('Supabase product image upload exception:', err);
      }
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(fileToUpload);
    });
  }

  // Profile Images Bucket
  async uploadProfileImage(file: File, identifier: string = 'user'): Promise<string> {
    let fileToUpload = file;
    try {
      const processed = await processProfileImage(file, file.name);
      fileToUpload = processed.file;
    } catch (e) {
      console.warn('Image processing fallback for profile image', e);
    }

    if (isSupabaseConfigured) {
      try {
        const cleanName = fileToUpload.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const path = `profiles/${identifier}_${Date.now()}_${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from(PROFILE_BUCKET_NAME)
          .upload(path, fileToUpload, { upsert: true, contentType: fileToUpload.type || 'image/jpeg' });

        if (!uploadError) {
          const { data } = supabase.storage.from(PROFILE_BUCKET_NAME).getPublicUrl(path);
          return data.publicUrl;
        } else {
          console.error('Error uploading profile image:', uploadError);
        }
      } catch (err) {
        console.error('Supabase profile image upload exception:', err);
      }
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(fileToUpload);
    });
  }

  // Documents Bucket
  async uploadDocument(file: File, folder: string = 'general'): Promise<{ publicUrl: string; name: string; path: string } | null> {
    if (isSupabaseConfigured) {
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const path = `${folder}/${Date.now()}_${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from(DOCUMENTS_BUCKET_NAME)
          .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' });

        if (!uploadError) {
          const { data } = supabase.storage.from(DOCUMENTS_BUCKET_NAME).getPublicUrl(path);
          return {
            publicUrl: data.publicUrl,
            name: file.name,
            path
          };
        } else {
          console.error('Error uploading document:', uploadError);
        }
      } catch (err) {
        console.error('Supabase document upload exception:', err);
      }
    }

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    return {
      publicUrl: dataUrl,
      name: file.name,
      path: `local_${Date.now()}_${file.name}`
    };
  }

  async listDocuments(folder: string = ''): Promise<{ name: string; publicUrl: string; path: string; created_at?: string; size?: number }[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data: files, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET_NAME)
        .list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (error || !files) return [];

      const result = [];
      for (const f of files) {
        if (f.name && !f.name.startsWith('.')) {
          const fullPath = folder ? `${folder}/${f.name}` : f.name;
          const { data } = supabase.storage.from(DOCUMENTS_BUCKET_NAME).getPublicUrl(fullPath);
          result.push({
            name: f.name.replace(/^[0-9]+_/, ''),
            publicUrl: data.publicUrl,
            path: fullPath,
            created_at: f.created_at,
            size: f.metadata?.size
          });
        }
      }
      return result;
    } catch (err) {
      console.error('Error listing documents from Supabase:', err);
      return [];
    }
  }

  async deleteDocument(path: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const { error } = await supabase.storage.from(DOCUMENTS_BUCKET_NAME).remove([path]);
      return !error;
    } catch (err) {
      console.error('Error deleting document:', err);
      return false;
    }
  }

  async uploadAvatar(file: File, userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const storageService = new StorageService();
