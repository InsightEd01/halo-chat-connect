
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export type BucketType = 'avatars' | 'chat_attachments' | 'documents' | 'status';

interface UploadOptions {
  bucket: BucketType;
  file: File;
  userId: string;
  folder?: string;
}

export const uploadFile = async ({ bucket, file, userId, folder }: UploadOptions) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = folder ? `${userId}/${folder}/${fileName}` : `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const deleteFile = async (bucket: BucketType, path: string) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

export const getFileUrl = (bucket: BucketType, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};
