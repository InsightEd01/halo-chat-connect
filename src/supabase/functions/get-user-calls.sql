
CREATE OR REPLACE FUNCTION get_user_calls(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  caller_id UUID,
  receiver_id UUID,
  call_type VARCHAR(10),
  status VARCHAR(20),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  caller JSONB,
  receiver JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.caller_id,
    c.receiver_id,
    c.call_type,
    c.status,
    c.started_at,
    c.ended_at,
    c.duration,
    c.created_at,
    c.updated_at,
    jsonb_build_object(
      'username', caller_profile.username,
      'avatar_url', caller_profile.avatar_url
    ) as caller,
    jsonb_build_object(
      'username', receiver_profile.username,
      'avatar_url', receiver_profile.avatar_url
    ) as receiver
  FROM calls c
  LEFT JOIN profiles caller_profile ON c.caller_id = caller_profile.id
  LEFT JOIN profiles receiver_profile ON c.receiver_id = receiver_profile.id
  WHERE c.caller_id = user_uuid OR c.receiver_id = user_uuid
  ORDER BY c.started_at DESC;
END;
$$;
