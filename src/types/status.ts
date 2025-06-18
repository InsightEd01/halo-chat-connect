
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
  reactions: Record<string, string[]>;
  views: string[];
  viewCount: number;
  user: StatusUser;
}
