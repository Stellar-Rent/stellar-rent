import { supabase } from './supabase';

/**
 * Upload an image to Supabase Storage
 * @param imageFile File object or base64 string
 * @param propertyId Property ID for organizing images
 * @param imageIndex Index of the image for naming
 * @returns Uploaded image URL or null if upload failed
 */
export async function uploadToSupabaseStorage(
  imageFile: File | string,
  propertyId: string,
  imageIndex: number
): Promise<string | null> {
  try {
    if (typeof imageFile === 'string' && imageFile.includes('supabase')) {
      return imageFile;
    }

    let file: File;
    let fileName: string;

    if (typeof imageFile === 'string') {
      if (imageFile.startsWith('data:')) {
        const [header, base64Data] = imageFile.split(',');
        const mimeType = header ? header.match(/data:([^;]+)/)?.[1] || 'image/jpeg' : 'image/jpeg';
        const extension = mimeType.split('/')[1] || 'jpg';

        const byteCharacters = Buffer.from(base64Data || '', 'base64').toString('binary');
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        file = new File([blob], `image-${imageIndex}.${extension}`, { type: mimeType });
        fileName = `${propertyId}/image-${imageIndex}.${extension}`;
      } else {
        const response = await fetch(imageFile);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        file = new File([uint8Array], `image-${imageIndex}.jpg`, { type: 'image/jpeg' });
        fileName = `${propertyId}/image-${imageIndex}.jpg`;
      }
    } else {
      file = imageFile;
      const fileExt = file.name.split('.').pop() || 'jpg';
      fileName = `${propertyId}/image-${imageIndex}.${fileExt}`;
    }

    const { data, error } = await supabase.storage.from('property-images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('property-images').getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Supabase Storage upload error:', error);
    return null;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl URL of the image to delete
 * @returns true if deletion was successful, false otherwise
 */
export async function deleteFromSupabaseStorage(imageUrl: string): Promise<boolean> {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex((part) => part === 'property-images');
    if (bucketIndex === -1) return false;

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    if (!filePath) {
      console.error('Invalid file path for Supabase Storage deletion');
      return false;
    }

    const { error } = await supabase.storage.from('property-images').remove([filePath]);

    if (error) {
      console.error('Supabase Storage delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Supabase Storage delete error:', error);
    return false;
  }
}

/**
 * Delete all images for a property from Supabase Storage
 * @param propertyId Property ID
 * @returns true if deletion was successful, false otherwise
 */
export async function deletePropertyImagesFromStorage(propertyId: string): Promise<boolean> {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('property-images')
      .list(propertyId);

    if (listError) {
      console.error('Failed to list property images:', listError);
      return false;
    }

    if (!files || files.length === 0) {
      return true;
    }
    const filePaths = files.map((file) => `${propertyId}/${file.name}`);

    const { error } = await supabase.storage.from('property-images').remove(filePaths);

    if (error) {
      console.error('Supabase Storage bulk delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Supabase Storage bulk delete error:', error);
    return false;
  }
}
