import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('church-community')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(error.message);

  return supabase.storage.from('church-community').getPublicUrl(path).data.publicUrl;
}
