-- Fix missing RLS policies for print_filaments
-- Without these, users cannot update or delete their print_filament links,
-- causing duplication when editing prints (since delete fails silently).

create policy "Users can update own print filaments." on public.print_filaments
  for update using (
    exists ( select 1 from public.prints where id = print_filaments.print_id and user_id = auth.uid() )
  );
  
create policy "Users can delete own print filaments." on public.print_filaments
  for delete using (
    exists ( select 1 from public.prints where id = print_filaments.print_id and user_id = auth.uid() )
  );
