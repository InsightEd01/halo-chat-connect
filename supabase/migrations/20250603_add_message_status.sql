-- Add message status triggers
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update message status to 'delivered' when chat is opened
  IF TG_OP = 'INSERT' THEN
    UPDATE messages
    SET status = 'delivered'
    WHERE chat_id = NEW.chat_id
    AND user_id != NEW.user_id
    AND status = 'sent';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message status updates
DROP TRIGGER IF EXISTS message_status_trigger ON messages;
CREATE TRIGGER message_status_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_status();
