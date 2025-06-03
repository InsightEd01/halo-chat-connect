-- Create message_reactions table
create table if not exists public.message_reactions (
    id uuid default gen_random_uuid() primary key,
    message_id uuid not null references public.messages(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    emoji text not null,
    created_at timestamptz default now(),
    unique (message_id, user_id, emoji)
);

-- Add RLS policies
alter table public.message_reactions enable row level security;

create policy "Users can see reactions in their chats"
on public.message_reactions
for select
using (
    exists (
        select 1 from public.messages m
        join public.participants p on p.chat_id = m.chat_id
        where m.id = message_reactions.message_id
        and p.user_id = auth.uid()
    )
);

create policy "Users can add reactions to messages in their chats"
on public.message_reactions
for insert
with check (
    exists (
        select 1 from public.messages m
        join public.participants p on p.chat_id = m.chat_id
        where m.id = message_id
        and p.user_id = auth.uid()
    )
    and user_id = auth.uid()
);

create policy "Users can delete their own reactions"
on public.message_reactions
for delete
using (user_id = auth.uid());

-- Create index for better performance
create index message_reactions_message_id_idx on public.message_reactions(message_id);
