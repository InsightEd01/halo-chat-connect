
-- Create storage buckets for chat attachments, documents, and status updates
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('chat_attachments', 'chat_attachments', true),
  ('documents', 'documents', true),
  ('status', 'status', true)
ON CONFLICT (id) DO NOTHING;

--
-- Policies for: chat_attachments
--
DROP POLICY IF EXISTS "Anyone can view chat attachments" ON storage.objects;
CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT USING (bucket_id = 'chat_attachments');

DROP POLICY IF EXISTS "Authenticated can insert chat attachments" ON storage.objects;
CREATE POLICY "Authenticated can insert chat attachments"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat_attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated can update own chat attachments" ON storage.objects;
CREATE POLICY "Authenticated can update own chat attachments"
ON storage.objects FOR UPDATE to authenticated USING (bucket_id = 'chat_attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Drop potentially insecure old policies before creating the correct one
DROP POLICY IF EXISTS "Authenticated can delete chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete own chat attachments" ON storage.objects;
CREATE POLICY "Authenticated can delete own chat attachments"
ON storage.objects FOR DELETE to authenticated USING (bucket_id = 'chat_attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

--
-- Policies for: documents
--
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated can insert documents" ON storage.objects;
CREATE POLICY "Authenticated can insert documents"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated can update own documents" ON storage.objects;
CREATE POLICY "Authenticated can update own documents"
ON storage.objects FOR UPDATE to authenticated USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Drop potentially insecure old policies before creating the correct one
DROP POLICY IF EXISTS "Authenticated can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete own documents" ON storage.objects;
CREATE POLICY "Authenticated can delete own documents"
ON storage.objects FOR DELETE to authenticated USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

--
-- Policies for: status
--
DROP POLICY IF EXISTS "Anyone can view status media" ON storage.objects;
CREATE POLICY "Anyone can view status media"
ON storage.objects FOR SELECT USING (bucket_id = 'status');

DROP POLICY IF EXISTS "Authenticated can insert status media" ON storage.objects;
CREATE POLICY "Authenticated can insert status media"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'status' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated can update own status media" ON storage.objects;
CREATE POLICY "Authenticated can update own status media"
ON storage.objects FOR UPDATE to authenticated USING (bucket_id = 'status' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Drop potentially insecure old policies before creating the correct one
DROP POLICY IF EXISTS "Authenticated can delete status" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete own status media" ON storage.objects;
CREATE POLICY "Authenticated can delete own status media"
ON storage.objects FOR DELETE to authenticated USING (bucket_id = 'status' AND auth.uid()::text = (storage.foldername(name))[1]);

--
-- Policies for: avatars (Correcting existing policies)
--
-- Drop potentially insecure old policies before creating the correct one
DROP POLICY IF EXISTS "Authenticated can delete own avatars" on storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE to authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
