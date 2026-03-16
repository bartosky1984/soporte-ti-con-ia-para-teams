import { supabase } from './supabaseClient';

const isDbEnabled = import.meta.env.VITE_DB_ENABLED === 'true';

export const storageService = {
  uploadFile: async (file: File): Promise<string | null> => {
    if (!isDbEnabled) {
      // Mock upload with data URL for offline/demo
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, log it and return mock for now 
        // (usually the user should create the bucket in dashboard or via migration)
        console.warn("Storage upload failed - bucket 'ticket-attachments' might not exist. Falling back to data URL for demo.");
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const { data } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }
};
