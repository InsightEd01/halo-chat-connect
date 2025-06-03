
import { Json } from "@/integrations/supabase/types";

export interface StatusUser {
  username: string;
  avatar_url: string | null;
}

export interface StatusUpdate {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  created_at: string;
  expires_at: string;
  viewed_by: string[];
  reactions?: Record<string, string[]>; // emoji -> user_ids
  user?: StatusUser;
}
