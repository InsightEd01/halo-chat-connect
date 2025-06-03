-- Add new columns to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_group boolean DEFAULT false;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add role column to participants table
ALTER TABLE participants ADD COLUMN IF NOT EXISTS role text DEFAULT 'member';

-- Add new columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type text DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS forwarded_from uuid REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS voice_duration integer;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE (message_id, user_id, emoji)
);

-- Create typing_status table
CREATE TABLE IF NOT EXISTS typing_status (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp bigint NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE (chat_id, user_id)
);

-- Create RLS policies
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- Message reactions policies
CREATE POLICY "Users can insert their own reactions"
    ON message_reactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view reactions in their chats"
    ON message_reactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM participants p
        WHERE p.chat_id = (
            SELECT chat_id FROM messages WHERE id = message_reactions.message_id
        )
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own reactions"
    ON message_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- Typing status policies
CREATE POLICY "Users can update their own typing status"
    ON typing_status FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view typing status in their chats"
    ON typing_status FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM participants p
        WHERE p.chat_id = typing_status.chat_id
        AND p.user_id = auth.uid()
    ));
