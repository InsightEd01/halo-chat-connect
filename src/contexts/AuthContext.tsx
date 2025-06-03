
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, userId?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Separate function to handle profile creation without blocking auth flow
  const handleProfileCreation = async (user: User) => {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Generate user_id for new profile
        const userId = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Create profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            user_id: userId,
            avatar_url: user.user_metadata?.avatar_url || null
          });

        if (error) {
          console.error('Error creating profile:', error);
          // Don't throw error - profile creation failure shouldn't block auth
        }
      }
    } catch (error) {
      console.error('Error checking/creating profile:', error);
      // Don't throw error - profile creation failure shouldn't block auth
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        // Update state synchronously
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle profile creation asynchronously without blocking
        if (session?.user) {
          // Use setTimeout to defer profile creation and prevent blocking
          setTimeout(() => {
            handleProfileCreation(session.user);
          }, 0);
        }
      }
    );

    // Check for existing session after setting up listener
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle profile creation for existing session
      if (session?.user) {
        setTimeout(() => {
          handleProfileCreation(session.user);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, userId?: string) => {
    try {
      setLoading(true);
      
      // Generate user ID if not provided
      const user_id = userId || Math.floor(100000 + Math.random() * 900000).toString();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            user_id
          },
          emailRedirectTo: `${window.location.origin}/chats`
        }
      });

      if (error) throw error;
      
      if (data.session) {
        toast({
          title: "Account created successfully",
          description: `Your Wispa user ID: ${user_id}`,
        });
        navigate('/chats');
      } else if (data.user) {
        toast({
          title: "Account created successfully",
          description: "You can now sign in with your new account",
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Navigation will be handled by auth state change
    } catch (error: any) {
      console.error('Signin error:', error);
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error: any) {
      console.error('Signout error:', error);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
