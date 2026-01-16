-- AVATARS BUCKET POLICY
CREATE POLICY "Avatar_Owner_Insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars' AND (select auth.uid()::text) = regexp_replace(name, '\.[^.]*$', ''));

CREATE POLICY "Avatar_Owner_Update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars' AND (select auth.uid()::text) = regexp_replace(name, '\.[^.]*$', ''));

CREATE POLICY "Avatar_Public_Select" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

-- CHARACTERS BUCKET POLICY
CREATE POLICY "Character_Insert_Policy" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'characters'
);

CREATE POLICY "Character_Update_Policy" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'characters' AND (owner = auth.uid())
);

CREATE POLICY "Character_Select_Policy" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'characters');

CREATE POLICY "Character_Delete_Policy" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'characters' AND (owner = auth.uid())
);