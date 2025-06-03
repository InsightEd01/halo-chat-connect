-- Add message type and reactions support
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'text',
ADD COLUMN IF NOT EXISTS media_url text;

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    emoji text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (message_id, user_id, emoji)
);

-- Add RLS policies for message_reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see reactions in their chats" ON message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN participants p ON p.chat_id = m.chat_id
            WHERE m.id = message_reactions.message_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add reactions to messages in their chats" ON message_reactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN participants p ON p.chat_id = m.chat_id
            WHERE m.id = message_id
            AND p.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can delete their own reactions" ON message_reactions
    FOR DELETE USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS message_reactions_message_id_idx ON message_reactions(message_id);

-- Add voice messages bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Add storage policy for voice messages
CREATE POLICY "Voice messages are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'voice-messages' );

CREATE POLICY "Authenticated users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'voice-messages' 
    AND auth.role() = 'authenticated'
);
