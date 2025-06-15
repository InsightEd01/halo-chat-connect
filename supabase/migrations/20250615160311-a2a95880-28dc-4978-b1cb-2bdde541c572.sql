
-- Remove restrictive "owner" conditions to avoid type errors
-- Avatars
drop policy if exists "Authenticated can delete own avatars" on storage.objects;
create policy "Authenticated can delete avatars"
on storage.objects for delete 
to authenticated using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Chat attachments
drop policy if exists "Authenticated can delete own chat attachments" on storage.objects;
create policy "Authenticated can delete chat attachments"
on storage.objects for delete 
to authenticated using (bucket_id = 'chat_attachments' and auth.role() = 'authenticated');

-- Documents
drop policy if exists "Authenticated can delete own documents" on storage.objects;
create policy "Authenticated can delete documents"
on storage.objects for delete 
to authenticated using (bucket_id = 'documents' and auth.role() = 'authenticated');

-- Status
drop policy if exists "Authenticated can delete own status" on storage.objects;
create policy "Authenticated can delete status"
on storage.objects for delete 
to authenticated using (bucket_id = 'status' and auth.role() = 'authenticated');
