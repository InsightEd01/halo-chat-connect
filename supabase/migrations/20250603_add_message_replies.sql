-- Add reply support to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES messages(id) ON DELETE SET NULL;

-- Create foreign key constraint with messages table
ALTER TABLE messages 
ADD CONSTRAINT messages_reply_to_fkey 
FOREIGN KEY (reply_to) 
REFERENCES messages(id) 
ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS messages_reply_to_idx ON messages(reply_to);
