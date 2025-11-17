import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BUCKET = 'photos';

export const uploadPhoto = async (file: File, folder: string = 'general'): Promise<{ publicUrl: string }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return { publicUrl };
  } catch (error) {
    console.error('Failed to upload photo:', error);
    const blobUrl = URL.createObjectURL(file);
    return { publicUrl: blobUrl };
  }
};

export const deletePhoto = async (url: string): Promise<void> => {
  try {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      return;
    }

    const urlParts = url.split(`${STORAGE_BUCKET}/`);
    if (urlParts.length < 2) {
      console.warn('Invalid photo URL for deletion:', url);
      return;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting photo:', error);
    }
  } catch (error) {
    console.error('Failed to delete photo:', error);
  }
};

export const createStorageBucket = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 5242880
      });

      if (error && !error.message.includes('already exists')) {
        console.error('Error creating storage bucket:', error);
        return false;
      }

      console.log('✅ Storage bucket created:', STORAGE_BUCKET);
    }

    return true;
  } catch (error) {
    console.error('Failed to create storage bucket:', error);
    return false;
  }
};
