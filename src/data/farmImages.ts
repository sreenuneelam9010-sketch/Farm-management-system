export interface FarmImageItem {
  id: string | number;
  title: string;
  category: 'Sheep & Goat';
  url: string;
  description?: string;
}

// Single source of truth is uploaded images in Supabase farm-images bucket.
// Zero stock or AI placeholder images.
export const farmImagesData: FarmImageItem[] = [];

